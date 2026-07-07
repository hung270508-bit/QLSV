'use strict';

/**
 * aiKnowledgeGraph.js
 * Phân tích cấu trúc kiến thức tài liệu (Knowledge Graph).
 * TUYỆT ĐỐI không sinh câu hỏi ở bước này — chỉ phân tích để phục vụ phân bổ.
 *
 * Tối ưu Groq Free Tier:
 * - Tối đa 5 chunk mẫu, mỗi chunk ≤ 3000 ký tự
 * - max_tokens: 900 cho bước KG
 * - Model nhẹ (llama-3.1-8b-instant) khi dùng Groq
 */

const MAX_CHUNKS_FOR_KG = 5;
const MAX_CHARS_PER_KG_CHUNK = 3000;
const KG_MAX_TOKENS = 900;

/**
 * Prompt hệ thống: CHỈ phân tích cấu trúc, KHÔNG sinh câu hỏi.
 * @param {string} chunkText
 * @returns {string}
 */
function buildKgSystemPrompt() {
    return `Bạn là chuyên gia phân tích giáo trình. Đọc đoạn tài liệu và trả về JSON phân tích cấu trúc kiến thức.
TUYỆT ĐỐI KHÔNG sinh câu hỏi trắc nghiệm. Chỉ phân tích cấu trúc.

Trả về JSON với cấu trúc sau:
{
  "chapters": [
    {
      "title": "Tên chương/phần",
      "importance": 7,
      "topics": [
        {
          "name": "Tên chủ đề",
          "importance": 8,
          "keywords": ["từ khoá 1", "từ khoá 2"],
          "concepts": ["khái niệm quan trọng"],
          "formulas": ["công thức nếu có"],
          "examples": ["ví dụ tiêu biểu"]
        }
      ]
    }
  ]
}

QUY TẮC:
- importance: thang 1-10, phản ánh tầm quan trọng và độ phong phú nội dung
- Mỗi chapter có ít nhất 1 topic
- Nếu không xác định được tên chương, dùng "Nội dung chính"
- Chỉ trả về JSON, không có text thêm`;
}

/**
 * Gọi AI phân tích 1 chunk. Lỗi được bắt tại chỗ để không làm sập cả quá trình.
 * @param {object} client - OpenAI client
 * @param {string} model - model nhẹ (kgModel)
 * @param {{chapterTitle: string, text: string, chunkIndex: number}} chunk
 * @returns {Promise<{chapters: Array}|null>}
 */
async function extractPartialKnowledgeGraph(client, model, chunk) {
    const truncatedText = chunk.text.slice(0, MAX_CHARS_PER_KG_CHUNK);
    const userContent = `Chương/Phần phát hiện: "${chunk.chapterTitle}"\n\nNội dung:\n${truncatedText}`;

    try {
        const response = await client.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: buildKgSystemPrompt() },
                { role: 'user', content: userContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,  // thấp để output ổn định
            max_tokens: KG_MAX_TOKENS
        });

        let jsonContent = response.choices[0].message.content || '{}';
        // Loại bỏ markdown fence nếu model trả về
        if (jsonContent.includes('```json')) {
            jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
        } else if (jsonContent.includes('```')) {
            jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
        }

        const parsed = JSON.parse(jsonContent);
        return parsed.chapters ? parsed : null;
    } catch (err) {
        // Chunk lỗi không làm sập toàn bộ, chỉ log và bỏ qua
        console.warn(`[KG] Chunk ${chunk.chunkIndex} ("${chunk.chapterTitle}") phân tích thất bại: ${err.message}`);
        return null;
    }
}

/**
 * Gộp nhiều KG cục bộ thành 1 KG thống nhất.
 * - So khớp chương theo tên (không phân biệt hoa/thường)
 * - Cộng dồn keywords/concepts/formulas/examples
 * - Lấy importance lớn nhất
 * @param {Array<{chapters: Array}>} partials
 * @returns {{chapters: Array}}
 */
function mergeKnowledgeGraphs(partials) {
    const chapterMap = new Map(); // key: normalized title

    for (const partial of partials) {
        if (!partial || !Array.isArray(partial.chapters)) continue;

        for (const chapter of partial.chapters) {
            const key = (chapter.title || '').toLowerCase().trim();
            if (!chapterMap.has(key)) {
                // Clone để tránh mutate input
                chapterMap.set(key, {
                    title: chapter.title || 'Nội dung chính',
                    importance: chapter.importance || 5,
                    topics: []
                });
            }

            const existing = chapterMap.get(key);
            // Lấy importance lớn nhất
            if ((chapter.importance || 0) > existing.importance) {
                existing.importance = chapter.importance;
            }

            // Gộp topics theo tên
            const topicMap = new Map(existing.topics.map(t => [t.name.toLowerCase().trim(), t]));

            for (const topic of (chapter.topics || [])) {
                const topicKey = (topic.name || '').toLowerCase().trim();
                if (!topicMap.has(topicKey)) {
                    topicMap.set(topicKey, {
                        name: topic.name || 'Chủ đề chung',
                        importance: topic.importance || 5,
                        keywords: [...(topic.keywords || [])],
                        concepts: [...(topic.concepts || [])],
                        formulas: [...(topic.formulas || [])],
                        examples: [...(topic.examples || [])]
                    });
                } else {
                    const existingTopic = topicMap.get(topicKey);
                    if ((topic.importance || 0) > existingTopic.importance) {
                        existingTopic.importance = topic.importance;
                    }
                    // Cộng dồn, loại trùng
                    const dedup = (arr, newArr) => [...new Set([...arr, ...(newArr || [])])];
                    existingTopic.keywords  = dedup(existingTopic.keywords, topic.keywords);
                    existingTopic.concepts  = dedup(existingTopic.concepts, topic.concepts);
                    existingTopic.formulas  = dedup(existingTopic.formulas, topic.formulas);
                    existingTopic.examples  = dedup(existingTopic.examples, topic.examples);
                }
            }

            existing.topics = Array.from(topicMap.values());
        }
    }

    // Sắp xếp chương theo importance giảm dần
    const chapters = Array.from(chapterMap.values())
        .sort((a, b) => b.importance - a.importance);

    return { chapters };
}

/**
 * Tạo KG tối thiểu (fallback khi AI fail toàn bộ).
 * Dùng chaptTitles phát hiện từ chunking, importance đồng đều.
 * @param {Array<{chapterTitle: string}>} chunks
 * @returns {{chapters: Array}}
 */
function buildFallbackKg(chunks) {
    const seen = new Set();
    const chapters = [];

    for (const chunk of chunks) {
        const title = chunk.chapterTitle || 'Nội dung chính';
        if (!seen.has(title.toLowerCase())) {
            seen.add(title.toLowerCase());
            chapters.push({
                title,
                importance: 5,
                topics: [{
                    name: title,
                    importance: 5,
                    keywords: [],
                    concepts: [],
                    formulas: [],
                    examples: []
                }]
            });
        }
    }

    return { chapters: chapters.length > 0 ? chapters : [{ title: 'Nội dung chính', importance: 5, topics: [{ name: 'Chủ đề chung', importance: 5, keywords: [], concepts: [], formulas: [], examples: [] }] }] };
}

/**
 * Điểm vào chính: lấy mẫu tối đa 5 chunk rải đều → phân tích song song → gộp KG.
 * @param {object} client
 * @param {string} model - kgModel (llama-3.1-8b-instant cho Groq)
 * @param {Array<{chapterTitle: string, text: string, chunkIndex: number}>} chunks
 * @param {object} opts
 * @param {number} [opts.maxChunksForKg=5]
 * @returns {Promise<{chapters: Array}>}
 */
async function buildKnowledgeGraph(client, model, chunks, { maxChunksForKg = MAX_CHUNKS_FOR_KG } = {}) {
    if (!chunks || chunks.length === 0) {
        return buildFallbackKg([]);
    }

    // Lấy mẫu rải đều: chọn tối đa maxChunksForKg chunk từ toàn bộ danh sách
    const sampledChunks = [];
    if (chunks.length <= maxChunksForKg) {
        sampledChunks.push(...chunks);
    } else {
        const step = (chunks.length - 1) / (maxChunksForKg - 1);
        for (let i = 0; i < maxChunksForKg; i++) {
            sampledChunks.push(chunks[Math.round(i * step)]);
        }
    }

    console.log(`[KG] Phân tích ${sampledChunks.length}/${chunks.length} chunk mẫu...`);

    // Gọi tuần tự (không song song) để tránh burst rate limit trên Groq Free Tier
    const partials = [];
    for (const chunk of sampledChunks) {
        const partial = await extractPartialKnowledgeGraph(client, model, chunk);
        if (partial) partials.push(partial);
        // Nghỉ nhỏ giữa các lần gọi KG để tránh rate limit
        await new Promise(r => setTimeout(r, 300));
    }

    if (partials.length === 0) {
        console.warn('[KG] Tất cả chunk phân tích thất bại → dùng KG fallback');
        return buildFallbackKg(chunks);
    }

    const merged = mergeKnowledgeGraphs(partials);
    console.log(`[KG] Đã build KG: ${merged.chapters.length} chương, ${merged.chapters.reduce((s, c) => s + c.topics.length, 0)} chủ đề`);
    return merged;
}

module.exports = {
    extractPartialKnowledgeGraph,
    mergeKnowledgeGraphs,
    buildKnowledgeGraph,
    buildFallbackKg
};
