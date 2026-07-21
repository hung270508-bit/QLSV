const OpenAI = require('openai');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { extractTextFromDocx } = require('./aiService');
const { buildDocumentChunks } = require('./aiChunking');
const { buildKnowledgeGraph } = require('./aiKnowledgeGraph');
const { generateQuestionsForTarget, allocateByImportance, buildAllocationPlan, getNextAllocationTarget } = require('./aiQuestionGeneration');
const { validateGeneratedQuestions, checkDocumentNotEmpty, validateRequestedQuestionCount, detectDuplicateContent } = require('./aiContentValidator');

const CONFIG = {
    MIN_CONTENT_WORDS: 50,
    MIN_WORDS_PER_QUESTION: 30,
    QUESTIONS_PER_NODE: 2,
    DEFAULT_BATCH_SIZE: 10,
};

module.exports = (repo) => {
    // Helper: khởi tạo OpenAI/Groq/Gemini client dựa theo API Key
    const getOpenAIClient = () => {
        const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.API_KEY || '';
        if (!apiKey) {
            const err = new Error('Chưa cấu hình API Key cho AI (OPENAI_API_KEY/GROQ_API_KEY/API_KEY) trong file .env.local');
            err.statusCode = 500;
            throw err;
        }

        let baseURL = undefined;
        let model = 'gpt-4o-mini';
        let kgModel = 'gpt-4o-mini';

        if (apiKey.startsWith('xai-')) {
            baseURL = 'https://api.x.ai/v1';
            model = 'grok-beta';
            kgModel = 'grok-beta';
        } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
            baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
            model = 'gemini-2.0-flash';
            kgModel = 'gemini-2.0-flash';
        } else if (apiKey.startsWith('sk-or-')) {
            baseURL = 'https://openrouter.ai/api/v1';
            model = 'nvidia/nemotron-3-ultra-550b-a55b:free';
            kgModel = 'nvidia/nemotron-3-ultra-550b-a55b:free';
        } else if (apiKey.startsWith('gsk_')) {
            baseURL = 'https://api.groq.com/openai/v1';
            model = 'llama-3.3-70b-versatile';
            kgModel = 'llama-3.3-70b-versatile';
        }

        const client = new OpenAI({ apiKey, baseURL });
        return { client, model, kgModel };
    };

    // Helper: lấy hoặc build Knowledge Graph (có cache theo document_id)
    const getOrBuildKnowledgeGraph = async (client, kgModel, document, chunks) => {
        const cached = await repo.getKnowledgeGraphByDocument(document.id);
        if (cached && cached.chapters && cached.chapters.length > 0) {
            return cached;
        }

        console.log(`[KG] Building Knowledge Graph cho document_id=${document.id}...`);
        const kg = await buildKnowledgeGraph(client, kgModel, chunks);
        await repo.saveKnowledgeGraph(document.id, kg);
        return kg;
    };

    // Helper: lọc Knowledge Graph theo chu_de / chuong_id
    const filterKgByChuDe = (kg, chuDe) => {
        if (!chuDe || chuDe === 'Toàn bộ' || chuDe.trim() === '') return kg;
        const needle = chuDe.toLowerCase().trim();
        const filtered = (kg.chapters || []).filter(c =>
            c.title.toLowerCase().includes(needle) ||
            needle.includes(c.title.toLowerCase()) ||
            (c.topics || []).some(t => t.name.toLowerCase().includes(needle))
        );
        if (filtered.length === 0) {
            console.warn(`[KG] Không tìm thấy chương/chủ đề khớp "${chuDe}" trong KG → dùng toàn bộ`);
            return kg;
        }
        return { chapters: filtered };
    };

    return {
        // 1. Upload tài liệu Word
        uploadDocument: async (file, { ma_mon_hoc, ma_giang_vien, tieu_de, ten_mon_hoc }) => {
            if (!file) throw new Error('Không nhận được file dữ liệu');
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext !== '.doc' && ext !== '.docx') {
                try { fs.unlinkSync(file.path); } catch(e){}
                throw new Error('Chỉ chấp nhận file Word (.doc hoặc .docx)');
            }

            let text = '';
            try {
                text = await extractTextFromDocx(file.path);
            } catch (err) {
                try { fs.unlinkSync(file.path); } catch(e){}
                throw err;
            }

            let is_relevant = true;
            try {
                const { client, model } = getOpenAIClient();
                const prompt = `Kiểm tra xem nội dung tài liệu sau có liên quan đến môn học "${ten_mon_hoc || tieu_de}" hoặc thuộc lĩnh vực học thuật/giáo dục phù hợp không. Trả lời chính xác duy nhất từ YES hoặc NO.\n\nNội dung (1000 ký tự đầu):\n${text.slice(0, 1000)}`;
                const completion = await client.chat.completions.create({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0,
                });
                const responseText = completion.choices[0].message.content.trim().toUpperCase();
                if (responseText.includes('NO') || responseText.includes('KHÔNG') || responseText.includes('KHONG') || responseText.includes('FALSE')) {
                    is_relevant = false;
                }
            } catch (error) {
                console.error('AI validation error in uploadDocument:', error.message);
            }

            const docId = await repo.saveDocument({
                ma_mon_hoc,
                ma_giang_vien,
                tieu_de,
                file_name: file.originalname,
                file_url: file.path,
                text_content: text
            });

            return { id: docId, tieu_de, file_name: file.originalname, ma_mon_hoc, is_relevant };
        },

        getDocumentsByTeacher: async (ma_giang_vien) => {
            return await repo.getDocumentsByTeacher(ma_giang_vien);
        },

        // 2. AI Advisor Orchestrator: Tạo Gợi Ý Câu Hỏi (Chỉ gợi ý, KHÔNG ghi vào ngân hàng)
        suggestQuestions: async ({ mon_hoc_id, chuong_id, do_kho, so_luong, document_id, giangvien_id }) => {
            let document = null;
            if (document_id) {
                document = await repo.getDocumentById(document_id);
            }
            if (!document) {
                const err = new Error('Vui lòng chọn tài liệu từ danh sách hoặc tải file Word mới lên trước khi nhờ AI gợi ý.');
                err.statusCode = 400;
                throw err;
            }

            const requestedCountNum = Math.min(100, Math.max(1, Number(so_luong) || 10));
            const rawTextForCheck = document.text_content || '';

            const rawWordsCount = (rawTextForCheck || '').trim().split(/\s+/).filter(Boolean).length;
            // Kiểm tra trùng lặp copy-paste
            const dupPreCheck = detectDuplicateContent(rawTextForCheck);
            const contentToCheck = dupPreCheck.uniqueContent || rawTextForCheck;

            // Kiểm tra dung lượng từ thực chất
            const emptyCheck = checkDocumentNotEmpty(contentToCheck, requestedCountNum);
            if (!emptyCheck.isValid) {
                const reportedWords = Math.max(emptyCheck.wordCount, emptyCheck.totalWords || 0);
                const isDupSpam = dupPreCheck.hasDuplicates && rawWordsCount > reportedWords + 5;
                const msg = isDupSpam
                    ? `Phát hiện tài liệu chứa nội dung trùng lặp lặp đi lặp lại. Sau khi loại bỏ phần trùng lặp, tài liệu chỉ còn ${reportedWords} từ thực chất (tổng ${rawWordsCount} từ gốc), chưa đủ tối thiểu ${CONFIG.MIN_CONTENT_WORDS} từ để sinh ${requestedCountNum} câu hỏi.`
                    : (emptyCheck.reason === 'INSUFFICIENT_CONTENT_FOR_REQUESTED_COUNT'
                        ? `Tài liệu có ${reportedWords} từ thực chất, chỉ đủ tạo tối đa ${emptyCheck.maxAllowedQuestions || 0} câu hỏi. Vui lòng bổ sung nội dung hoặc giảm số lượng câu.`
                        : `Tài liệu không đủ nội dung thực chất (phát hiện ${reportedWords} từ, cần tối thiểu ${CONFIG.MIN_CONTENT_WORDS} từ). Vui lòng bổ sung nội dung đa dạng hơn.`);
                const err = new Error(msg);
                err.validationCode = emptyCheck.reason;
                err.statusCode = 422;
                if (emptyCheck.maxAllowedQuestions !== undefined) err.suggestedMax = emptyCheck.maxAllowedQuestions;
                throw err;
            }

            const { client, model, kgModel } = getOpenAIClient();
            const chunks = buildDocumentChunks(contentToCheck, { maxTokens: 1500 });
            const fullKg = await getOrBuildKnowledgeGraph(client, kgModel, document, chunks);
            
            // Phân tích dung lượng chủ đề KG
            const knowledgeNodeCount = (fullKg && Array.isArray(fullKg.chapters))
                ? fullKg.chapters.reduce((sum, c) => sum + (Array.isArray(c.topics) ? c.topics.length : 1), 0)
                : 0;
            const maxQuestionsByKg = Math.max(Math.floor(knowledgeNodeCount * CONFIG.QUESTIONS_PER_NODE), 1);
            const countCheck = validateRequestedQuestionCount(requestedCountNum, maxQuestionsByKg);
            if (!countCheck.allowed) {
                const err = new Error(`Cấu trúc chủ đề tài liệu chỉ đủ để sinh tối đa ${maxQuestionsByKg} câu hỏi chất lượng cao. Vui lòng giảm số câu hoặc bổ sung nội dung.`);
                err.validationCode = 'CONTENT_INSUFFICIENT_FOR_REQUESTED_COUNT';
                err.statusCode = 422;
                err.suggestedMax = maxQuestionsByKg;
                throw err;
            }

            const kg = filterKgByChuDe(fullKg, chuong_id);
            const plan = buildAllocationPlan(kg, requestedCountNum);

            let allGenerated = [];
            let remaining = requestedCountNum;
            const recentTypesHistory = [];
            const existingBankQs = await repo.getBankQuestionsBySubject(mon_hoc_id || document?.ma_mon_hoc || '');

            while (remaining > 0) {
                const actualRemaining = requestedCountNum - allGenerated.length;
                if (actualRemaining <= 0) break;

                const result = getNextAllocationTarget(plan, allGenerated);
                let target, needed;
                if (result) {
                    target = result.target;
                    needed = Math.min(result.needed, actualRemaining);
                } else {
                    const topChapter = (kg.chapters || []).reduce((best, c) => (c.importance > best.importance) ? c : best, kg.chapters?.[0] || { title: chuong_id || 'Chung', importance: 1 });
                    target = {
                        chapterTitle: topChapter.title || 'Chung',
                        topicName: topChapter.topics?.[0]?.name || topChapter.title || 'Chung',
                        importance: topChapter.importance || 1,
                        keywords: topChapter.topics?.[0]?.keywords || []
                    };
                    needed = actualRemaining;
                }

                try {
                    const batch = await generateQuestionsForTarget({
                        client,
                        model,
                        target,
                        chunks,
                        existingQs: allGenerated,
                        forcedDifficulty: (do_kho && do_kho !== 'Mixed') ? do_kho : null,
                        recentTypesHistory,
                        needed
                    });

                    // Hậu kiểm AI Content Validator (Validation Point B)
                    const { validQuestions: validBatch } = await validateGeneratedQuestions(
                        batch, contentToCheck, existingBankQs, client, model
                    );

                    const finalBatch = validBatch.slice(0, actualRemaining);
                    for (const q of finalBatch) {
                        if (q.question_type) recentTypesHistory.push(q.question_type);
                    }

                    allGenerated.push(...finalBatch);
                    remaining -= finalBatch.length;

                    if (remaining > 0) {
                        await new Promise(r => setTimeout(r, 500));
                    }
                } catch (err) {
                    console.error(`[AI Advisor] Lỗi sinh batch cho "${target?.topicName}":`, err.message);
                    if (err.message?.includes('429') || err.message?.toLowerCase().includes('quota')) {
                        console.warn('[AI Advisor] Rate limit 429 — dừng sinh batch tiếp theo');
                        break;
                    }
                    if (allGenerated.length === 0 && remaining <= 1) throw err;
                    remaining = Math.max(0, remaining - 1);
                }
            }

            if (allGenerated.length === 0) {
                const err = new Error('AI không thể sinh được câu hỏi hợp lệ từ tài liệu này.');
                err.statusCode = 500;
                throw err;
            }

            // Chuẩn hóa định dạng gói ý theo đúng API contract
            const goi_y = allGenerated.map(q => ({
                cauhoi: q.noi_dung || q.question || '',
                dapan_dung: (q.options || []).find(o => o.la_dap_an_dung || o.is_correct)?.noi_dung || (q.options || []).find(o => o.la_dap_an_dung || o.is_correct)?.text || '',
                dapan_nhieu: (q.options || []).filter(o => !o.la_dap_an_dung && !o.is_correct).map(o => o.noi_dung || o.text || '').filter(Boolean),
                options: (q.options || []).map(o => ({
                    noi_dung: o.noi_dung || o.text || '',
                    text: o.noi_dung || o.text || '',
                    la_dap_an_dung: Boolean(o.la_dap_an_dung || o.is_correct),
                    is_correct: Boolean(o.la_dap_an_dung || o.is_correct)
                })),
                giai_thich: q.giai_thich || q.explanation || '',
                do_kho: q.do_kho || q.difficulty || 'Medium',
                chu_de: q.chu_de || q.topic || target?.topicName || '',
                bloom_level: q.bloom_level || ''
            }));

            const sessionId = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút TTL
            const tieuChiObj = {
                mon_hoc_id: mon_hoc_id || document.ma_mon_hoc,
                chuong_id: chuong_id || 'Toàn bộ',
                do_kho: do_kho || 'Mixed',
                so_luong: requestedCountNum
            };

            await repo.saveSuggestionSession({
                id: sessionId,
                giangvien_id,
                tieu_chi: tieuChiObj,
                goi_y,
                expires_at: expiresAt
            });

            await repo.saveSuggestionAuditLog({
                giangvien_id,
                mon_hoc_id: mon_hoc_id || document.ma_mon_hoc,
                so_cau_goi_y: goi_y.length
            });

            return {
                session_id: sessionId,
                goi_y,
                expires_at: expiresAt
            };
        },

        // 3. Phục hồi gợi ý khi GV refresh trang (Check TTL & Ownership)
        getSuggestions: async (session_id, giangvien_id) => {
            const session = await repo.getSuggestionSessionById(session_id);
            if (!session) {
                const err = new Error('Phiên gợi ý không tồn tại hoặc đã bị xóa.');
                err.statusCode = 410;
                throw err;
            }

            if (new Date(session.expires_at) < new Date()) {
                const err = new Error('Phiên gợi ý đã hết hạn (sau 30 phút). Vui lòng tạo phiên gợi ý mới.');
                err.statusCode = 410;
                throw err;
            }

            if (String(session.giangvien_id) !== String(giangvien_id)) {
                const err = new Error('Bạn không có quyền xem phiên gợi ý này.');
                err.statusCode = 403;
                throw err;
            }

            return {
                session_id: session.id,
                tieu_chi: typeof session.tieu_chi === 'string' ? JSON.parse(session.tieu_chi) : session.tieu_chi,
                goi_y: typeof session.goi_y === 'string' ? JSON.parse(session.goi_y) : session.goi_y,
                expires_at: session.expires_at
            };
        },

        // 4. Các helper quản lý Ngân hàng câu hỏi chính thức (giữ tương thích cho ExamManagement)
        getTeacherQuestionBanks: async (ma_giang_vien) => {
            return await repo.getTeacherQuestionBanks(ma_giang_vien);
        },

        getBankQuestions: async (bankId) => {
            return await repo.getBankQuestions(bankId);
        },

        deleteOfficialBank: async (bankId) => {
            return await repo.deleteOfficialBank(bankId);
        },

        updateOfficialBank: async (bankId, data) => {
            return await repo.updateOfficialBank(bankId, data);
        },

        createOfficialBank: async (data) => {
            return await repo.createOfficialBank(data);
        },

        addQuestionToBank: async (bankId, data) => {
            return await repo.addQuestionToBank(bankId, data);
        },

        addQuestionsBatchToBank: async (bankId, questions, creator_id) => {
            return await repo.addQuestionsBatchToBank(bankId, questions, creator_id);
        },

        updateQuestion: async (questionId, data) => {
            return await repo.updateQuestion(questionId, data);
        },

        deleteQuestion: async (questionId) => {
            return await repo.deleteQuestion(questionId);
        }
    };
};
