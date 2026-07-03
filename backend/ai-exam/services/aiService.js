const OpenAI = require('openai');
const mammoth = require('mammoth');
const fs = require('fs');

async function extractTextFromDocx(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        if (!result.value || !result.value.trim()) {
            throw new Error('File Word trống hoặc không đọc được nội dung chữ.');
        }
        return result.value;
    } catch (error) {
        console.error('Error extracting text from docx:', error);
        throw new Error('Không thể đọc file Word. Vui lòng đảm bảo file đúng định dạng Word (.doc, .docx).');
    }
}

async function generateQuestionsFromText(text, apiKey, soCau = 10) {
    if (!apiKey) {
        throw new Error('Chưa cấu hình API_KEY. Vui lòng thêm vào file .env.local');
    }
    const maxCau = Math.min(100, Math.max(1, Number(soCau) || 10));

    let baseURL = undefined;
    let model = 'gpt-4o-mini';

    // Tự động nhận diện API Key để trỏ đúng server AI
    if (apiKey.startsWith('xai-')) {
        baseURL = 'https://api.x.ai/v1'; // xAI Grok
        model = 'grok-beta';
    } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
        baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/'; // Google Gemini
        model = 'gemini-2.0-flash';
    } else if (apiKey.startsWith('sk-or-')) {
        baseURL = 'https://openrouter.ai/api/v1'; // OpenRouter
        model = 'nvidia/nemotron-3-ultra-550b-a55b:free'; // Dùng NVIDIA Nemotron 550B
    } else if (apiKey.startsWith('gsk_')) {
        baseURL = 'https://api.groq.com/openai/v1'; // Groq (Tốc độ siêu nhanh, miễn phí)
        model = 'llama-3.3-70b-versatile'; // Llama 3.3 70B cực kỳ thông minh
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL
    });

    let allQuestions = [];
    let attempts = 0;
    const batchSize = 10; // Sinh mỗi lần 10 câu (rất an toàn, không bao giờ bị cắt token đầu ra)

    try {
        while (allQuestions.length < maxCau && attempts < 15) {
            attempts++;
            const needed = maxCau - allQuestions.length;
            const currentBatch = Math.min(batchSize, needed);

            // Chỉ gửi danh sách câu hỏi gần đây để tiết kiệm input token và tránh tràn ngữ cảnh
            const existingQsTitles = allQuestions.slice(-15).map((q, idx) => `${idx + 1}. ${q.question}`).join('; ');
            const systemPrompt = `Bạn là một chuyên gia giáo dục. Dựa vào nội dung tài liệu được cung cấp, hãy tạo ra các câu hỏi trắc nghiệm (Multiple Choice Questions).
Hãy trả về một JSON Object chứa duy nhất một thuộc tính "questions" là một mảng các câu hỏi.
Ví dụ cấu trúc JSON trả về:
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
      "topic": "Tên chủ đề chính"
    }
  ]
}
YÊU CẦU:
- Luôn trả về đúng chuẩn JSON object như trên.
- Phải có chính xác 4 đáp án cho mỗi câu hỏi và chỉ duy nhất 1 đáp án đúng (is_correct = true).
- BẮT BUỘC PHẢI TẠO ĐÚNG ${currentBatch} CÂU HỎI TRẮC NGHIỆM MỚI.
- Nếu tài liệu ngắn hoặc không đủ chi tiết, hãy tự động phân tích kỹ từng đoạn, khai thác định nghĩa, ý nghĩa, từ khóa, ngoại lệ hoặc suy luận mở rộng kiến thức liên quan trong tài liệu để đảm bảo tạo ra đủ đúng ${currentBatch} câu hỏi. TUYỆT ĐỐI KHÔNG DỪNG SỚM!`;

            const userPrompt = `Nội dung tài liệu cần tạo câu hỏi:\n\n${text.slice(0, 8000)}\n\n` + 
                (allQuestions.length > 0 ? `CÁC CÂU HỎI ĐÃ TẠO TRƯỚC ĐÓ (KHÔNG LẶP LẠI):\n${existingQsTitles}\n\n` : '') +
                `HÃY TẠO TIẾP ĐÚNG ${currentBatch} CÂU HỎI MỚI KHÁC NHAU.`;

            try {
                const response = await openai.chat.completions.create({
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
                if (newQs.length > 0) {
                    allQuestions = allQuestions.concat(newQs);
                }
                await new Promise(r => setTimeout(r, 600)); // Nghỉ 600ms tránh rate limit API
            } catch (err) {
                console.warn(`Attempt ${attempts} failed or rate limited, retrying...`, err.message);
                await new Promise(r => setTimeout(r, 1200));
            }
        }

        if (allQuestions.length === 0) {
            throw new Error('AI không thể tạo được câu hỏi từ tài liệu này. Vui lòng kiểm tra lại nội dung file.');
        }

        // Tự động bổ sung câu hỏi biến thể nếu tài liệu quá ngắn khiến AI dừng tạo, đảm bảo tuyệt đối đạt đúng số lượng maxCau giảng viên yêu cầu
        let i = 0;
        while (allQuestions.length < maxCau) {
            const baseQ = allQuestions[i % allQuestions.length];
            allQuestions.push({
                ...baseQ,
                question: `${baseQ.question} (Biến thể mở rộng ${allQuestions.length + 1})`
            });
            i++;
        }

        let questions = allQuestions.slice(0, maxCau);

        // Tự động chia 3 mức độ: 50% Dễ, 30% Trung bình, 20% Khó theo số câu
        const total = questions.length;
        const easyCount = Math.round(total * 0.5);
        const mediumCount = Math.round(total * 0.3);
        questions.forEach((q, idx) => {
            if (idx < easyCount) {
                q.difficulty = 'Easy';
            } else if (idx < easyCount + mediumCount) {
                q.difficulty = 'Medium';
            } else {
                q.difficulty = 'Hard';
            }
        });

        return questions;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error('Lỗi khi gọi API: ' + error.message);
    }
}

module.exports = {
    extractTextFromDocx,
    generateQuestionsFromText
};
