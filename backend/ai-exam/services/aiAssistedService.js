'use strict';

const OpenAI = require('openai');
const { extractTextFromDocx } = require('./aiService');
const { buildDocumentChunks } = require('./aiChunking');
const { buildKnowledgeGraph } = require('./aiKnowledgeGraph');
const {
    buildAllocationPlan,
    getNextAllocationTarget,
    generateQuestionsForTarget
} = require('./aiQuestionGeneration');

module.exports = (repo) => {

    // ================================================================
    // Helper: tạo OpenAI client theo API Key
    // Trả thêm kgModel — model nhẹ hơn cho bước phân tích Knowledge Graph
    // để tiết kiệm quota Groq Free Tier
    // ================================================================
    const getOpenAIClient = () => {
        const apiKey = process.env.OPENAI_API_KEY || process.env.AI_MODEL_OVERRIDE;
        if (!apiKey) throw new Error('Chưa cấu hình OPENAI_API_KEY ở server.');

        let baseURL = undefined;
        let model   = 'gpt-4o-mini';
        let kgModel = 'gpt-4o-mini'; // mặc định: dùng cùng model chính

        if (apiKey.startsWith('xai-')) {
            baseURL = 'https://api.x.ai/v1';
            model   = 'grok-beta';
            kgModel = 'grok-beta';
        } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
            baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
            model   = 'gemini-2.0-flash';
            kgModel = 'gemini-2.0-flash';
        } else if (apiKey.startsWith('sk-or-')) {
            baseURL = 'https://openrouter.ai/api/v1';
            model   = 'nvidia/nemotron-3-ultra-550b-a55b:free';
            kgModel = 'nvidia/nemotron-3-ultra-550b-a55b:free';
        } else if (apiKey.startsWith('gsk_')) {
            // Groq Free Tier: dùng model nhẹ cho KG để tiết kiệm quota,
            // giữ model mạnh cho bước sinh câu hỏi
            baseURL = 'https://api.groq.com/openai/v1';
            model   = process.env.AI_MODEL_OVERRIDE || 'llama-3.3-70b-versatile';
            kgModel = 'llama-3.1-8b-instant'; // nhẹ hơn, nhanh hơn, đủ để phân tích KG
        }

        return {
            client: new OpenAI({ apiKey, baseURL }),
            model,
            kgModel
        };
    };

    // ================================================================
    // Helper: lấy hoặc build Knowledge Graph (có cache theo document_id)
    // ĐÂY LÀ TIẾT KIỆM TOKEN QUAN TRỌNG NHẤT:
    // resumeSession nhiều lần sẽ dùng cache, không gọi lại AI cho bước KG
    // ================================================================
    const getOrBuildKnowledgeGraph = async (client, kgModel, document, chunks) => {
        // Bước 1: kiểm tra cache
        const cached = await repo.getKnowledgeGraphByDocument(document.id);
        if (cached && cached.chapters && cached.chapters.length > 0) {
            console.log(`[KG] Dùng cache cho document_id=${document.id} (${cached.chapters.length} chương)`);
            return cached;
        }

        // Bước 2: build mới từ AI
        console.log(`[KG] Building Knowledge Graph cho document_id=${document.id}...`);
        const kg = await buildKnowledgeGraph(client, kgModel, chunks);

        // Bước 3: lưu cache (lỗi lưu không làm dừng luồng chính)
        await repo.saveKnowledgeGraph(document.id, kg);
        console.log(`[KG] Built and cached: ${kg.chapters.length} chương`);

        return kg;
    };

    // ================================================================
    // Helper: lọc Knowledge Graph theo chu_de người dùng chọn
    // (Bổ sung 2: đảm bảo tính năng "sinh theo 1 chương cụ thể" không bị hỏng)
    // ================================================================
    const filterKgByChuDe = (kg, chuDe) => {
        if (!chuDe || chuDe === 'Toàn bộ' || chuDe.trim() === '') return kg;

        const needle = chuDe.toLowerCase().trim();
        const filtered = kg.chapters.filter(c =>
            c.title.toLowerCase().includes(needle) ||
            needle.includes(c.title.toLowerCase()) ||
            (c.topics || []).some(t => t.name.toLowerCase().includes(needle))
        );

        if (filtered.length === 0) {
            // Fallback: không tìm thấy chương khớp → log cảnh báo + dùng toàn bộ KG
            console.warn(`[KG] Không tìm thấy chương/chủ đề khớp "${chuDe}" trong KG → sinh toàn bộ`);
            return kg;
        }

        return { chapters: filtered };
    };

    // ================================================================
    // Helper: chuẩn hoá danh sách câu hỏi đã có cho phù hợp với module mới
    // (xử lý trường hợp repo cũ chưa có các cột topic/chapter/keywords)
    // ================================================================
    const normalizeExistingQs = (existingQs) => {
        return (existingQs || []).map(q => ({
            noi_dung:      q.noi_dung || q.question || '',
            question:      q.noi_dung || q.question || '',
            chu_de:        q.chu_de || q.topic || 'Chung',
            topic:         q.topic  || q.chu_de || 'Chung',
            chapter:       q.chapter || 'Chung',
            question_type: q.question_type || null,
            keywords:      Array.isArray(q.keywords) ? q.keywords : []
        }));
    };

    // ================================================================
    // generateBatch — pipeline sinh câu hỏi AI mới hoàn toàn
    // ================================================================
    const generateBatch = async (sessionId, document, soCauYeuCau, doKho, chuDe) => {
        const { client, model, kgModel } = getOpenAIClient();

        // Lấy trạng thái session hiện tại
        const session = await repo.getSessionById(sessionId);
        if (!session) throw new Error('Không tìm thấy đề sinh AI');

        const daSinh = session.so_cau_da_sinh || 0;
        const totalNeeded = (soCauYeuCau || session.so_cau_yeu_cau) - daSinh;
        if (totalNeeded <= 0) {
            await repo.updateSessionStatus(sessionId, 'COMPLETED');
            return [];
        }

        console.log(`[Batch] Session ${sessionId}: đã sinh ${daSinh}, cần thêm ${totalNeeded} câu`);

        // ---- Bước 1: Clean + Chunk ----
        const rawText = document.text_content || '';
        const chunks  = buildDocumentChunks(rawText, { maxTokens: 1500 });
        console.log(`[Batch] Chia thành ${chunks.length} chunk từ tài liệu "${document.tieu_de}"`);

        // ---- Bước 2: Knowledge Graph (có cache) ----
        const fullKg     = await getOrBuildKnowledgeGraph(client, kgModel, document, chunks);

        // ---- Bước 3: Lọc KG theo chu_de nếu người dùng chỉ định ----
        const kg         = filterKgByChuDe(fullKg, chuDe);

        // ---- Bước 4: Lấy câu hỏi đã sinh (để chống trùng và phân bổ đúng) ----
        const rawExisting  = await repo.getExistingQuestionsSummary(sessionId);
        const existingQs   = normalizeExistingQs(rawExisting);

        // ---- Bước 5: Lập kế hoạch phân bổ ----
        const plan = buildAllocationPlan(kg, totalNeeded);
        console.log(`[Batch] Kế hoạch: ${plan.map(p => `${p.topicName}(${p.allocated})`).join(', ')}`);

        // ---- Bước 6: Vòng lặp sinh câu hỏi theo từng target ----
        const allGenerated = [];
        const recentTypesHistory = []; // theo dõi dạng câu hỏi gần nhất để đa dạng hoá

        let batchLastError = null;
        let remaining = totalNeeded;

        while (remaining > 0) {
            // Lấy target tiếp theo từ plan
            const allCurrentQs = [...existingQs, ...allGenerated];
            const result = getNextAllocationTarget(plan, allCurrentQs);

            let target, needed;
            if (result) {
                target = result.target;
                needed = Math.min(result.needed, remaining);
            } else {
                // Tất cả target đã đủ → fallback sinh nốt phần còn lại ở chương importance cao nhất
                const topChapter = kg.chapters.reduce((best, c) => c.importance > best.importance ? c : best, kg.chapters[0]);
                target = {
                    chapterTitle: topChapter.title,
                    topicName:    topChapter.topics?.[0]?.name || topChapter.title,
                    importance:   topChapter.importance,
                    keywords:     topChapter.topics?.[0]?.keywords || []
                };
                needed = remaining;
            }

            try {
                const batch = await generateQuestionsForTarget({
                    client,
                    model,
                    target,
                    chunks,
                    existingQs: [...existingQs, ...allGenerated],
                    forcedDifficulty: (doKho && doKho !== 'Mixed') ? doKho : null,
                    recentTypesHistory,
                    needed
                });

                // Cập nhật lịch sử dạng câu hỏi (dùng để đảm bảo không quá 2 liên tiếp)
                for (const q of batch) {
                    if (q.question_type) recentTypesHistory.push(q.question_type);
                }

                allGenerated.push(...batch);
                remaining -= batch.length;

                // Lưu ngay batch này vào DB để không mất nếu batch sau lỗi
                if (batch.length > 0) {
                    await repo.saveStagingQuestions(sessionId, document.id, batch);
                    console.log(`[Batch] Đã lưu ${batch.length} câu cho "${target.topicName}", còn lại ${remaining}`);
                }

                // Nghỉ nhỏ giữa các lần gọi AI để tránh rate limit Groq
                if (remaining > 0) {
                    await new Promise(r => setTimeout(r, 500));
                }

            } catch (err) {
                batchLastError = err;
                console.error(`[Batch] Lỗi khi sinh câu cho "${target?.topicName}":`, err.message);

                // Nếu lỗi 429 (rate limit): dừng và mark FAILED để giữ các câu đã sinh
                const isRateLimit = err.message?.includes('429') || err.message?.includes('rate') || err.message?.toLowerCase().includes('quota');
                if (isRateLimit) {
                    console.warn('[Batch] Rate limit 429 — dừng sinh, giữ nguyên câu hỏi đã có');
                    break;
                }

                // Lỗi khác: thử tiếp target kế tiếp (không dừng toàn bộ)
                // Nếu không còn câu nào và cũng không sinh được → break
                if (allGenerated.length === 0) break;

                // Giảm remaining xuống để tránh vòng lặp vô tận
                remaining = Math.max(0, remaining - 1);
            }
        }

        // ---- Bước 7: Cập nhật trạng thái session ----
        if (allGenerated.length === 0 && batchLastError) {
            // Không sinh được câu nào → FAILED (giữ lại câu cũ đã có)
            await repo.updateSessionStatus(sessionId, 'FAILED', null, `Lỗi AI: ${batchLastError.message}`);
            throw new Error(`Không thể sinh câu hỏi từ AI: ${batchLastError.message}`);
        }

        // Nếu sinh được ít nhất 1 câu thì không FAILED (giữ nguyên hành vi code cũ)
        return allGenerated;
    };

    // ================================================================
    // EXPORT: giữ nguyên 100% tên hàm và chữ ký so với code gốc
    // ================================================================
    return {
        // 1. Upload file Word và lưu Document
        uploadDocument: async (file, { ma_mon_hoc, ma_giang_vien, tieu_de }) => {
            if (!file || !ma_mon_hoc || !ma_giang_vien || !tieu_de) {
                throw new Error('Vui lòng cung cấp đầy đủ file tài liệu, môn học, giảng viên và tiêu đề.');
            }
            if (!file.originalname.endsWith('.docx') && !file.originalname.endsWith('.doc')) {
                throw new Error('File tài liệu bắt buộc phải là định dạng Word (.doc, .docx).');
            }

            const text = await extractTextFromDocx(file.path);
            const docId = await repo.saveDocument({
                ma_mon_hoc,
                ma_giang_vien,
                tieu_de,
                file_name: file.originalname,
                file_url:  file.path,
                text_content: text
            });

            return { id: docId, tieu_de, file_name: file.originalname, ma_mon_hoc };
        },

        // 2. Khởi tạo phiên sinh AI & chạy batch đầu tiên
        startSession: async ({ document_id, ma_mon_hoc, ma_giang_vien, so_cau_yeu_cau = 10, do_kho = 'Mixed', chu_de = 'Toàn bộ' }) => {
            const document = await repo.getDocumentById(document_id);
            if (!document) throw new Error('Không tìm thấy tài liệu trong hệ thống');

            const sessionId = await repo.createSession({
                document_id,
                ma_mon_hoc,
                ma_giang_vien,
                so_cau_yeu_cau: Number(so_cau_yeu_cau) || 10,
                do_kho,
                chu_de
            });

            // Thực hiện sinh batch đầu tiên
            try {
                await generateBatch(sessionId, document, Number(so_cau_yeu_cau) || 10, do_kho, chu_de);
            } catch (err) {
                console.error('Initial batch generation error:', err.message);
                // Vẫn trả về sessionId để frontend có thể bấm Resume
            }

            return await repo.getSessionById(sessionId);
        },

        // 3. Resume / Sinh thêm câu hỏi cho session đang có
        resumeSession: async (sessionId) => {
            const session = await repo.getSessionById(sessionId);
            if (!session) throw new Error('Không tìm thấy đề sinh câu hỏi');

            if (session.so_cau_da_sinh >= session.so_cau_yeu_cau) {
                await repo.updateSessionStatus(sessionId, 'COMPLETED');
                return session;
            }

            await repo.updateSessionStatus(sessionId, 'RUNNING');
            const document = await repo.getDocumentById(session.document_id);

            try {
                // Knowledge Graph SẼ ĐƯỢC CACHE — không gọi lại AI cho bước KG
                await generateBatch(sessionId, document, session.so_cau_yeu_cau, session.do_kho, session.chu_de);
            } catch (err) {
                console.error('Resume batch generation error:', err.message);
                throw err;
            }

            return await repo.getSessionById(sessionId);
        },

        // 4. Các thao tác còn lại — GIỮ NGUYÊN logic gốc
        getSessionsByTeacher: async (maGiangVien) => {
            return await repo.getSessionsByTeacher(maGiangVien);
        },

        getQuestionsBySession: async (sessionId, filters) => {
            return await repo.getStagingQuestionsBySession(sessionId, filters);
        },

        approveQuestion: async (questionId) => {
            const sessionData = await repo.getSessionByQuestionId(questionId);
            if (!sessionData) throw new Error('Không tìm thấy đề sinh câu hỏi');
            return await repo.approveAndMoveToBank(questionId, sessionData);
        },

        approveAllInSession: async (sessionId) => {
            const sessionData = await repo.getSessionById(sessionId);
            if (!sessionData) throw new Error('Không tìm thấy đề sinh câu hỏi');
            return await repo.approveAllInSession(sessionId, sessionData);
        },

        updateQuestionStatus: async (questionId, status) => {
            if (status === 'APPROVED') {
                const sessionData = await repo.getSessionByQuestionId(questionId);
                if (!sessionData) throw new Error('Không tìm thấy đề sinh câu hỏi');
                return await repo.approveAndMoveToBank(questionId, sessionData);
            } else {
                return await repo.updateQuestionStatus(questionId, status);
            }
        },

        updateQuestion: async (questionId, data) => {
            return await repo.updateQuestion(questionId, data);
        },

        deleteQuestion: async (questionId) => {
            return await repo.deleteQuestion(questionId);
        },

        getBankQuestions: async (bankId) => {
            return await repo.getBankQuestions(bankId);
        },

        deleteOfficialBank: async (bankId) => {
            return await repo.deleteOfficialBank(bankId);
        },

        updateOfficialBank: async (bankId, data) => {
            return await repo.updateOfficialBank(bankId, data);
        }
    };
};
