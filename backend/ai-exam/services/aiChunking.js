'use strict';

/**
 * aiChunking.js
 * Xử lý văn bản tài liệu: làm sạch → phát hiện chương → chia chunk theo token.
 * Mục đích: thay thế việc cắt cứng 8000 ký tự đầu bằng cách hiểu cấu trúc tài liệu.
 */

// Regex phát hiện tiêu đề chương (tiếng Việt + tiếng Anh, số La Mã + Ả Rập)
const CHAPTER_REGEX = /^(?:Chương|Phần|Bài|Chapter|CHƯƠNG|PHẦN|BÀI|CHAPTER|Chaper)\s+(?:[IVXLCDMivxlcdm]+|\d+)[.\s:]/m;

// Ước lượng token: 1 token ≈ 4 ký tự (an toàn cho cả tiếng Việt và tiếng Anh)
const CHARS_PER_TOKEN = 4;

/**
 * Chuẩn hoá văn bản: loại ký tự lỗi do extract .docx, chuẩn hoá khoảng trắng.
 * @param {string} rawText
 * @returns {string}
 */
function cleanText(rawText) {
    if (!rawText) return '';
    return rawText
        // Thay thế ký tự null và ký tự điều khiển không mong muốn
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
        // Chuẩn hoá line break: \r\n → \n
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Loại bỏ ký tự thay thế (replacement character từ encoding lỗi)
        .replace(/\uFFFD/g, '')
        // Loại bỏ Unicode BOM
        .replace(/^\uFEFF/, '')
        // Thu gọn nhiều dòng trống liên tiếp thành 2 dòng trống (phân cách paragraph)
        .replace(/\n{3,}/g, '\n\n')
        // Thu gọn khoảng trắng ngang thừa trong dòng
        .replace(/[ \t]+/g, ' ')
        // Trim từng dòng
        .split('\n').map(l => l.trim()).join('\n')
        .trim();
}

/**
 * Phát hiện ranh giới chương trong văn bản và chia thành các section.
 * Nếu không phát hiện được chương nào → fallback: toàn bộ văn bản là 1 section.
 * @param {string} cleanedText
 * @returns {Array<{chapterTitle: string, text: string}>}
 */
function splitIntoChapterSections(cleanedText) {
    // Regex tổng quát hơn để split toàn bộ văn bản
    const splitRegex = /(?=^(?:Chương|Phần|Bài|Chapter|CHƯƠNG|PHẦN|BÀI|CHAPTER|Chaper)\s+(?:[IVXLCDMivxlcdm]+|\d+)[.\s:])/im;

    const lines = cleanedText.split('\n');
    const sections = [];
    let currentTitle = null;
    let currentLines = [];

    for (const line of lines) {
        if (CHAPTER_REGEX.test(line)) {
            // Lưu section cũ nếu có nội dung
            if (currentLines.length > 0 && currentLines.some(l => l.trim())) {
                sections.push({
                    chapterTitle: currentTitle || 'Phần mở đầu',
                    text: currentLines.join('\n').trim()
                });
            }
            // Bắt đầu section mới
            currentTitle = line.trim();
            currentLines = [line];
        } else {
            currentLines.push(line);
        }
    }

    // Lưu section cuối cùng
    if (currentLines.length > 0 && currentLines.some(l => l.trim())) {
        sections.push({
            chapterTitle: currentTitle || 'Nội dung chính',
            text: currentLines.join('\n').trim()
        });
    }

    // Fallback: không phát hiện được chương nào
    if (sections.length === 0) {
        return [{ chapterTitle: 'Toàn bộ tài liệu', text: cleanedText }];
    }

    return sections;
}

/**
 * Chia văn bản thành các chunk theo đoạn văn (paragraph), không cắt giữa câu.
 * @param {string} text
 * @param {number} maxTokens - tối đa token mỗi chunk (mặc định 1500)
 * @returns {Array<string>}
 */
function chunkByTokens(text, maxTokens = 1500) {
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    const chunks = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        const candidate = currentChunk ? `${currentChunk}\n\n${para}` : para;

        if (candidate.length <= maxChars) {
            // Vẫn trong giới hạn → gộp vào chunk hiện tại
            currentChunk = candidate;
        } else {
            // Lưu chunk hiện tại (nếu không rỗng)
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }

            // Nếu 1 đoạn văn đơn dài hơn maxChars → cắt theo câu
            if (para.length > maxChars) {
                const sentences = para.split(/(?<=[.!?;])\s+/);
                let sentChunk = '';
                for (const sent of sentences) {
                    const sentCandidate = sentChunk ? `${sentChunk} ${sent}` : sent;
                    if (sentCandidate.length <= maxChars) {
                        sentChunk = sentCandidate;
                    } else {
                        if (sentChunk) chunks.push(sentChunk.trim());
                        // Nếu 1 câu vẫn dài hơn maxChars → cắt cứng (hiếm gặp)
                        sentChunk = sent.length > maxChars ? sent.slice(0, maxChars) : sent;
                    }
                }
                if (sentChunk) currentChunk = sentChunk;
                else currentChunk = '';
            } else {
                currentChunk = para;
            }
        }
    }

    // Lưu chunk cuối
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text.slice(0, maxChars)];
}

/**
 * Điểm vào chính: clean → chia section theo chương → chunk theo token.
 * @param {string} rawText - Văn bản thô từ extractTextFromDocx
 * @param {object} opts
 * @param {number} [opts.maxTokens=1500]
 * @returns {Array<{chapterTitle: string, text: string, chunkIndex: number}>}
 */
function buildDocumentChunks(rawText, { maxTokens = 1500 } = {}) {
    const cleaned = cleanText(rawText);
    const sections = splitIntoChapterSections(cleaned);
    const result = [];

    let globalIndex = 0;
    for (const section of sections) {
        const chunks = chunkByTokens(section.text, maxTokens);
        for (const chunkText of chunks) {
            result.push({
                chapterTitle: section.chapterTitle,
                text: chunkText,
                chunkIndex: globalIndex++
            });
        }
    }

    return result;
}

module.exports = {
    cleanText,
    splitIntoChapterSections,
    chunkByTokens,
    buildDocumentChunks
};
