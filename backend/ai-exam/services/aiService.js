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

module.exports = {
    extractTextFromDocx
};

