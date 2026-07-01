const OpenAI = require('openai');
const mammoth = require('mammoth');
const fs = require('fs');

async function extractTextFromDocx(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('Error extracting text from docx:', error);
        throw new Error('Không thể đọc file Word.');
    }
}

async function generateQuestionsFromText(text, apiKey) {
    if (!apiKey) {
        throw new Error('Chưa cấu hình API_KEY. Vui lòng thêm vào file .env.local');
    }
    
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
- Chỉ tạo câu hỏi có trong nội dung tài liệu.
- Phải có chính xác 4 đáp án cho mỗi câu hỏi và chỉ duy nhất 1 đáp án đúng (is_correct = true).
- Tùy vào độ dài tài liệu, sinh tối đa 30 câu hỏi để đảm bảo chất lượng.
`;

    try {
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

        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Nội dung tài liệu cần tạo câu hỏi:\n\n${text}` }
            ],
            response_format: { type: "json_object" }
        });

        const jsonContent = response.choices[0].message.content;
        const parsed = JSON.parse(jsonContent);
        return parsed.questions || [];
    } catch (error) {
        console.error('API Error:', error);
        throw new Error('Lỗi khi gọi API: ' + error.message);
    }
}

module.exports = {
    extractTextFromDocx,
    generateQuestionsFromText
};
