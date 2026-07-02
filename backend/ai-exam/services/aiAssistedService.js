const OpenAI = require('openai');
const { extractTextFromDocx } = require('../aiService');

module.exports = (repo) => {
    // Helper tạo OpenAI client theo API Key
    const getOpenAIClient = () => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('Chưa cấu hình OPENAI_API_KEY ở server.');

        let baseURL = undefined;
        let model = 'gpt-4o-mini';

        if (apiKey.startsWith('xai-')) {
            baseURL = 'https://api.x.ai/v1';
            model = 'grok-beta';
        } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
            baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
            model = 'gemini-2.0-flash';
        } else if (apiKey.startsWith('sk-or-')) {
            baseURL = 'https://openrouter.ai/api/v1';
            model = 'nvidia/nemotron-3-ultra-550b-a55b:free';
        } else if (apiKey.startsWith('gsk_')) {
            baseURL = 'https://api.groq.com/openai/v1';
            model = 'llama-3.3-70b-versatile';
        }

        return {
            client: new OpenAI({ apiKey, baseURL }),
            model
        };
    };

    // Hàm sinh 1 batch câu hỏi (tối đa 10 câu/lần)
    const generateBatch = async (sessionId, document, soCauYeuCau, doKho, chuDe) => {
        const { client, model } = getOpenAIClient();
        
        // Lấy thông tin session hiện tại
        const session = await repo.getSessionById(sessionId);
        if (!session) throw new Error('Không tìm thấy phiên sinh AI');

        const daSinh = session.so_cau_da_sinh || 0;
        const needed = Math.min(10, (soCauYeuCau || session.so_cau_yeu_cau) - daSinh);
        if (needed <= 0) {
            await repo.updateSessionStatus(sessionId, 'COMPLETED');
            return [];
        }

        // Lấy danh sách câu hỏi đã có trong session để chống lặp lại
        const existingQs = await repo.getExistingQuestionsSummary(sessionId);
        const existingText = existingQs.map((q, idx) => `${idx + 1}. [Chủ đề: ${q.chu_de || 'Chung'}] ${q.noi_dung}`).join('; ');

        const diffInstruct = (doKho && doKho !== 'Mixed') ? `Độ khó bắt buộc cho tất cả các câu: ${doKho}.` : `Độ khó phân bổ hợp lý (Easy, Medium, Hard).`;
        const topicInstruct = (chuDe && chuDe !== 'Toàn bộ') ? `Chỉ tập trung khai thác kiến thức thuộc chủ đề/chương: ${chuDe}.` : `Khai thác toàn diện các chủ đề trong tài liệu.`;

        const systemPrompt = `Bạn là một chuyên gia giáo dục và xây dựng đề thi trắc nghiệm. Dựa vào tài liệu được cung cấp, hãy tạo ra đúng ${needed} câu hỏi trắc nghiệm (Multiple Choice Questions) mới.
Hãy trả về một JSON Object chứa duy nhất một thuộc tính "questions" là một mảng các câu hỏi.
Cấu trúc JSON chuẩn:
{
  "questions": [
    {
      "question": "Nội dung câu hỏi",
      "options": [
        { "text": "Đáp án A", "is_correct": false },
        { "text": "Đáp án B", "is_correct": true },
        { "text": "Đáp án C", "is_correct": false },
        { "text": "Đáp án D", "is_correct": false }
      ],
      "explanation": "Giải thích chi tiết tại sao đáp án lại đúng.",
      "difficulty": "Easy", // chỉ được chọn: "Easy", "Medium", "Hard"
      "topic": "Tên chủ đề hoặc chương"
    }
  ]
}
YÊU CẦU QUAN TRỌNG:
- Luôn trả về đúng chuẩn JSON object như trên.
- Phải có chính xác 4 đáp án cho mỗi câu hỏi và chỉ duy nhất 1 đáp án đúng (is_correct = true).
- BẮT BUỘC PHẢI TẠO ĐÚNG ${needed} CÂU HỎI TRẮC NGHIỆM MỚI.
- ${diffInstruct}
- ${topicInstruct}
- TUYỆT ĐỐI KHÔNG LẶP LẠI từ khóa hay nội dung của các câu hỏi đã có trước đó. Nếu tài liệu ngắn, hãy tự động suy luận, khai thác khía cạnh mới, ngoại lệ hoặc ứng dụng thực tế để đảm bảo đủ ${needed} câu hỏi mới!`;

        const userPrompt = `Nội dung tài liệu:\n\n${document.text_content ? document.text_content.slice(0, 8000) : ''}\n\n` +
            (existingText ? `CÁC CÂU HỎI ĐÃ SINH TRƯỚC ĐÓ (TUYỆT ĐỐI KHÔNG LẶP LẠI):\n${existingText}\n\n` : '') +
            `HÃY TẠO TIẾP ĐÚNG ${needed} CÂU HỎI TRẮC NGHIỆM MỚI KHÁC NHAU.`;

        let attempts = 0;
        let lastError = null;

        while (attempts < 3) {
            attempts++;
            try {
                const response = await client.chat.completions.create({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 4096
                });

                let jsonContent = response.choices[0].message.content || '{}';
                if (jsonContent.includes('```json')) {
                    jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
                } else if (jsonContent.includes('```')) {
                    jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
                }

                const parsed = JSON.parse(jsonContent);
                const newQs = parsed.questions || [];
                if (newQs.length === 0) {
                    throw new Error('AI trả về danh sách câu hỏi trống');
                }

                // Lưu vào database với trạng thái PENDING
                await repo.saveStagingQuestions(sessionId, document.id, newQs);
                return newQs;
            } catch (err) {
                lastError = err;
                console.warn(`AI generate batch attempt ${attempts} failed:`, err.message);
                await new Promise(r => setTimeout(r, 1000 * attempts)); // Exponential backoff
            }
        }

        // Nếu thất bại sau 3 lần thử, cập nhật trạng thái FAILED để giữ lại dữ liệu cũ
        await repo.updateSessionStatus(sessionId, 'FAILED', null, `Lỗi AI sau 3 lần thử: ${lastError.message}`);
        throw new Error(`Không thể sinh câu hỏi từ AI: ${lastError.message}`);
    };

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
                file_url: file.path,
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

            // Thực hiện sinh batch đầu tiên (10 câu)
            try {
                await generateBatch(sessionId, document, Number(so_cau_yeu_cau) || 10, do_kho, chu_de);
            } catch (err) {
                console.error('Initial batch generation error:', err.message);
                // Vẫn trả về sessionId để frontend có thể bấm Resume (Tiếp tục sinh)
            }

            return await repo.getSessionById(sessionId);
        },

        // 3. Resume / Sinh thêm 10 câu cho session đang có
        resumeSession: async (sessionId) => {
            const session = await repo.getSessionById(sessionId);
            if (!session) throw new Error('Không tìm thấy phiên sinh câu hỏi');

            if (session.so_cau_da_sinh >= session.so_cau_yeu_cau) {
                await repo.updateSessionStatus(sessionId, 'COMPLETED');
                return session;
            }

            await repo.updateSessionStatus(sessionId, 'RUNNING');
            const document = await repo.getDocumentById(session.document_id);

            try {
                await generateBatch(sessionId, document, session.so_cau_yeu_cau, session.do_kho, session.chu_de);
            } catch (err) {
                console.error('Resume batch generation error:', err.message);
                throw err;
            }

            return await repo.getSessionById(sessionId);
        },

        // 4. Các thao tác khác trên câu hỏi
        getSessionsByTeacher: async (maGiangVien) => {
            return await repo.getSessionsByTeacher(maGiangVien);
        },

        getQuestionsBySession: async (sessionId, filters) => {
            return await repo.getStagingQuestionsBySession(sessionId, filters);
        },

        approveQuestion: async (questionId) => {
            const sessionData = await repo.getSessionByQuestionId(questionId);
            if (!sessionData) throw new Error('Không tìm thấy phiên sinh câu hỏi');
            return await repo.approveAndMoveToBank(questionId, sessionData);
        },

        approveAllInSession: async (sessionId) => {
            const sessionData = await repo.getSessionById(sessionId);
            if (!sessionData) throw new Error('Không tìm thấy phiên sinh câu hỏi');
            return await repo.approveAllInSession(sessionId, sessionData);
        },

        updateQuestionStatus: async (questionId, status) => {
            if (status === 'APPROVED') {
                const sessionData = await repo.getSessionByQuestionId(questionId);
                if (!sessionData) throw new Error('Không tìm thấy phiên sinh câu hỏi');
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
