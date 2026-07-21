'use strict';

/**
 * aiQuestionGeneration.js
 * Logic sinh câu hỏi AI: phân bổ theo importance → mini-RAG retrieval →
 * sinh đa dạng dạng câu hỏi → chống trùng ngữ nghĩa Jaccard → validate cấu trúc.
 *
 * Tối ưu Groq Free Tier:
 * - Context retrieval: tối đa 4000 ký tự, top 2 chunk
 * - Liệt kê tối đa 12 câu cũ trong prompt
 * - Buffer sinh dư: needed+2, tối đa 10 câu/lần gọi
 * - max_tokens: 3000
 * - Explanation tối đa 2 câu
 */

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Ánh xạ cứng Bloom Level → Difficulty.
 * AI KHÔNG được tự quyết định difficulty — luôn ép lại theo bảng này.
 */
const BLOOM_TO_DIFFICULTY = {
    Remember:   'Easy',
    Understand: 'Easy',
    Apply:      'Medium',
    Analyze:    'Hard',
    Evaluate:   'Hard'
};

/** Tỉ trọng phân bổ Bloom Level mặc định */
const BLOOM_WEIGHTS = {
    Remember:   0.15,
    Understand: 0.25,
    Apply:      0.25,
    Analyze:    0.20,
    Evaluate:   0.15
};

/** Tỉ trọng nghiêng theo difficulty khi người dùng chọn cứng */
const DIFFICULTY_TO_BLOOM_WEIGHTS = {
    Easy:   { Remember: 0.40, Understand: 0.40, Apply: 0.20, Analyze: 0.00, Evaluate: 0.00 },
    Medium: { Remember: 0.10, Understand: 0.20, Apply: 0.50, Analyze: 0.20, Evaluate: 0.00 },
    Hard:   { Remember: 0.00, Understand: 0.10, Apply: 0.20, Analyze: 0.40, Evaluate: 0.30 }
};

/** 14 dạng câu hỏi bắt buộc đa dạng hoá */
const QUESTION_TYPES = [
    'Định nghĩa',
    'So sánh',
    'Áp dụng',
    'Tình huống',
    'Thực tế',
    'Chọn bước tiếp theo',
    'Phân tích nguyên nhân',
    'Kết quả',
    'Ngoại lệ',
    'Tính toán',
    'Suy luận',
    'Ghép khái niệm',
    'Ứng dụng',
    'Ví dụ'
];

const QUESTION_GEN_MAX_TOKENS = 3000;
const CONTEXT_MAX_CHARS = 4000;
const CONTEXT_TOP_K = 6;
const MAX_RECENT_QS_IN_PROMPT = 12;
const SEMANTIC_DUP_THRESHOLD = 0.55;

// ================================================================
// PHÂN BỔ SỐ CÂU HỎI THEO IMPORTANCE
// ================================================================

/**
 * Phân bổ số lượng theo tỉ lệ importance dùng phương pháp "largest remainder"
 * để tổng luôn khớp chính xác với totalNeeded.
 * @param {Array<{importance: number, [key: string]: any}>} items
 * @param {number} totalNeeded
 * @returns {Array<{...item, allocated: number}>}
 */
function allocateByImportance(items, totalNeeded) {
    if (!items || items.length === 0) return [];
    if (totalNeeded <= 0) return items.map(i => ({ ...i, allocated: 0 }));

    const totalImportance = items.reduce((s, i) => s + (i.importance || 1), 0);
    // Phần nguyên và phần dư
    const withRemainder = items.map(item => {
        const exact = ((item.importance || 1) / totalImportance) * totalNeeded;
        return { ...item, _floor: Math.floor(exact), _remainder: exact - Math.floor(exact) };
    });

    let distributed = withRemainder.reduce((s, i) => s + i._floor, 0);
    const remaining = totalNeeded - distributed;

    // Sắp xếp theo phần dư giảm dần để phân bổ phần lẻ
    const sorted = [...withRemainder].sort((a, b) => b._remainder - a._remainder);
    for (let i = 0; i < remaining; i++) {
        sorted[i]._floor++;
    }

    // Đảm bảo mỗi item có ít nhất 1 câu nếu totalNeeded đủ lớn
    return sorted.map(({ _floor, _remainder, ...item }) => ({ ...item, allocated: Math.max(0, _floor) }));
}

/**
 * Phân bổ 2 cấp: chương → chủ đề trong từng chương.
 * @param {{chapters: Array}} kg
 * @param {number} totalNeeded
 * @returns {Array<{chapterTitle: string, topicName: string, importance: number, allocated: number, keywords: string[]}>}
 */
function buildAllocationPlan(kg, totalNeeded) {
    if (!kg || !kg.chapters || kg.chapters.length === 0) {
        return [{ chapterTitle: 'Nội dung chính', topicName: 'Chủ đề chung', importance: 5, allocated: totalNeeded, keywords: [] }];
    }

    // Bước 1: phân bổ cho từng chương
    const chapterItems = kg.chapters.map(c => ({ ...c, importance: c.importance || 5 }));
    const chapterAlloc = allocateByImportance(chapterItems, totalNeeded);

    // Bước 2: trong mỗi chương phân bổ cho từng chủ đề
    const plan = [];
    for (const chapter of chapterAlloc) {
        if (chapter.allocated <= 0) continue;
        const topics = chapter.topics || [];
        if (topics.length === 0) {
            plan.push({
                chapterTitle: chapter.title,
                topicName: chapter.title,
                importance: chapter.importance,
                allocated: chapter.allocated,
                keywords: []
            });
            continue;
        }

        const topicAlloc = allocateByImportance(
            topics.map(t => ({ ...t, importance: t.importance || 5 })),
            chapter.allocated
        );

        for (const topic of topicAlloc) {
            if (topic.allocated > 0) {
                plan.push({
                    chapterTitle: chapter.title,
                    topicName: topic.name,
                    importance: topic.importance,
                    allocated: topic.allocated,
                    keywords: topic.keywords || []
                });
            }
        }
    }

    // Nếu sau phân bổ plan rỗng → fallback 1 target
    if (plan.length === 0) {
        plan.push({
            chapterTitle: kg.chapters[0]?.title || 'Nội dung chính',
            topicName: kg.chapters[0]?.topics?.[0]?.name || 'Chủ đề chung',
            importance: 5,
            allocated: totalNeeded,
            keywords: []
        });
    }

    return plan;
}

/**
 * Chọn target tiếp theo cần sinh câu hỏi.
 * Ưu tiên: chủ đề CHƯA CÓ câu hỏi nào trước (đảm bảo coverage) →
 * sau đó chủ đề thiếu nhiều nhất theo plan.
 * @param {Array<{chapterTitle, topicName, allocated, keywords}>} plan
 * @param {Array<{chu_de: string, chapter?: string}>} existingQs - câu hỏi đã sinh
 * @returns {{target: object, needed: number}|null}
 */
function getNextAllocationTarget(plan, existingQs) {
    if (!plan || plan.length === 0) return null;

    // Đếm câu hỏi đã có theo từng target
    const countMap = new Map();
    for (const q of (existingQs || [])) {
        const topicKey = normalizeTopicKey(q.chu_de || q.topic || '');
        countMap.set(topicKey, (countMap.get(topicKey) || 0) + 1);
    }

    // Tính số câu còn thiếu cho từng target
    const deficits = plan.map(target => {
        const key = normalizeTopicKey(target.topicName);
        const have = countMap.get(key) || 0;
        return { target, needed: Math.max(0, target.allocated - have) };
    }).filter(d => d.needed > 0);

    if (deficits.length === 0) return null;

    // Ưu tiên target chưa có câu hỏi nào
    const empty = deficits.filter(d => {
        const key = normalizeTopicKey(d.target.topicName);
        return (countMap.get(key) || 0) === 0;
    });

    if (empty.length > 0) {
        // Trong số các target chưa có câu, chọn cái quan trọng nhất
        return empty.reduce((best, d) => d.target.importance > best.target.importance ? d : best, empty[0]);
    }

    // Tất cả đã có ít nhất 1 câu → chọn target còn thiếu nhiều nhất
    return deficits.reduce((best, d) => d.needed > best.needed ? d : best, deficits[0]);
}

function normalizeTopicKey(str) {
    return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// ================================================================
// KẾ HOẠCH BLOOM & DẠNG CÂU HỎI
// ================================================================

/**
 * Phân bổ Bloom Level cho một batch câu hỏi.
 * Nếu người dùng chọn cứng difficulty → chỉ dùng các Bloom Level thuộc difficulty đó.
 * @param {number} count - số câu cần sinh
 * @param {string|null} forcedDifficulty - 'Easy'|'Medium'|'Hard'|null
 * @returns {Array<{bloomLevel: string, difficulty: string}>}
 */
function buildBloomPlan(count, forcedDifficulty) {
    let bloomLevels;

    if (forcedDifficulty && forcedDifficulty !== 'Mixed') {
        // Chỉ lấy các Bloom Level ánh xạ đúng với difficulty được chọn
        bloomLevels = Object.entries(BLOOM_TO_DIFFICULTY)
            .filter(([, diff]) => diff === forcedDifficulty)
            .map(([level]) => level);
        if (bloomLevels.length === 0) bloomLevels = Object.keys(BLOOM_WEIGHTS);
    } else {
        bloomLevels = Object.keys(BLOOM_WEIGHTS);
    }

    // Phân bổ đều giữa các Bloom Level thuộc nhóm
    const items = bloomLevels.map(level => ({
        level,
        importance: Math.round((BLOOM_WEIGHTS[level] || 1 / bloomLevels.length) * 100)
    }));
    const allocated = allocateByImportance(items, count);

    const plan = [];
    for (const { level, allocated: n } of allocated) {
        for (let i = 0; i < n; i++) {
            plan.push({
                bloomLevel: level,
                difficulty: BLOOM_TO_DIFFICULTY[level]
            });
        }
    }

    // Đảm bảo đủ count (bù phần lẻ)
    while (plan.length < count) {
        const extra = bloomLevels[plan.length % bloomLevels.length];
        plan.push({ bloomLevel: extra, difficulty: BLOOM_TO_DIFFICULTY[extra] });

    }

    return plan.slice(0, count);
}

/**
 * Phân bổ dạng câu hỏi cho một batch, đảm bảo không quá 2 liên tiếp cùng 1 dạng.
 * @param {number} count
 * @param {Array<string>} recentTypesHistory - lịch sử dạng câu hỏi của các câu gần nhất
 * @returns {Array<string>}
 */
function buildQuestionTypePlan(count, recentTypesHistory = []) {
    const plan = [];
    // Theo dõi số lần liên tiếp của dạng cuối cùng (bao gồm history)
    let lastType = recentTypesHistory[recentTypesHistory.length - 1] || null;
    let consecutiveCount = 0;

    // Đếm số lần liên tiếp cuối từ history
    for (let i = recentTypesHistory.length - 1; i >= 0; i--) {
        if (recentTypesHistory[i] === lastType) consecutiveCount++;
        else break;
    }

    // Pool các dạng câu hỏi với shuffle đơn giản (không cần crypto)
    const shuffled = [...QUESTION_TYPES].sort(() => Math.random() - 0.5);
    let poolIdx = 0;

    for (let i = 0; i < count; i++) {
        let picked = shuffled[poolIdx % shuffled.length];

        // Nếu đã dùng 2 lần liên tiếp → bắt buộc đổi dạng
        if (picked === lastType && consecutiveCount >= 2) {
            // Tìm dạng khác
            let found = false;
            for (let j = 1; j < shuffled.length; j++) {
                const candidate = shuffled[(poolIdx + j) % shuffled.length];
                if (candidate !== lastType) {
                    picked = candidate;
                    poolIdx = (poolIdx + j + 1) % shuffled.length;
                    found = true;
                    break;
                }
            }
            if (!found) picked = QUESTION_TYPES[(poolIdx + 1) % QUESTION_TYPES.length];
        } else {
            poolIdx = (poolIdx + 1) % shuffled.length;
        }

        if (picked === lastType) {
            consecutiveCount++;
        } else {
            consecutiveCount = 1;
            lastType = picked;
        }

        plan.push(picked);
    }

    return plan;
}

// ================================================================
// MINI-RAG RETRIEVAL
// ================================================================

/**
 * Tìm các chunk liên quan nhất đến chủ đề cần sinh câu hỏi bằng keyword scoring.
 * Thay thế hoàn toàn việc cắt cứng 8000 ký tự đầu tài liệu.
 * @param {Array<{chapterTitle: string, text: string}>} chunks
 * @param {string} chapterTitle
 * @param {string} topic
 * @param {string[]} keywords
 * @param {object} opts
 * @param {number} [opts.maxChars=4000]
 * @param {number} [opts.topK=2]
 * @returns {string}
 */
function retrieveRelevantContext(chunks, chapterTitle, topic, keywords = [], { maxChars = CONTEXT_MAX_CHARS, topK = CONTEXT_TOP_K } = {}) {
    if (!chunks || chunks.length === 0) return '';

    // Nếu tổng dung lượng toàn bộ tài liệu nhỏ hơn hoặc bằng maxChars (24.000 ký tự ~ 4.000 - 5.000 từ),
    // gửi TOÀN BỘ tài liệu để AI có đầy đủ 100% ngữ cảnh, không bị bỏ sót bất kỳ chi tiết nào.
    const totalLength = chunks.reduce((acc, c) => acc + (c.text?.length || 0), 0);
    if (totalLength <= maxChars) {
        return chunks.map(c => c.text || '').filter(Boolean).join('\n\n---\n\n');
    }

    // Chuẩn bị query tokens: tên chủ đề + chương + keywords
    const queryText = `${chapterTitle} ${topic} ${keywords.join(' ')}`.toLowerCase();
    const queryTokens = tokenize(queryText);

    // Tính điểm cho từng chunk
    const scored = chunks.map(chunk => {
        const chunkText = `${chunk.chapterTitle} ${chunk.text}`.toLowerCase();
        const chunkTokens = new Set(tokenize(chunkText));

        const chapterBonus = chunk.chapterTitle.toLowerCase().includes(chapterTitle.toLowerCase()) ? 3 : 0;
        const matchCount = queryTokens.filter(t => chunkTokens.has(t)).length;
        return { chunk, score: matchCount + chapterBonus };
    });

    // Lấy top K chunk liên quan nhất
    const topChunks = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(s => s.chunk);

    // Luôn đảm bảo chunk đầu tiên (chứa định nghĩa/tổng quan) có mặt nếu chưa có trong topK
    if (chunks[0] && !topChunks.includes(chunks[0])) {
        topChunks.unshift(chunks[0]);
    }

    let combined = '';
    for (const chunk of topChunks) {
        const separator = combined ? '\n\n---\n\n' : '';
        const remaining = maxChars - combined.length - separator.length;
        if (remaining <= 0) break;
        combined += separator + chunk.text.slice(0, remaining);
    }

    return combined;
}

// ================================================================
// CHỐNG TRÙNG NGỮ NGHĨA
// ================================================================

/**
 * Tokenize văn bản thành tập từ (loại stopword tiếng Việt và tiếng Anh cơ bản).
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
    const stopwords = new Set(['là', 'và', 'của', 'trong', 'cho', 'với', 'được', 'có', 'không', 'các', 'một', 'những', 'này', 'đó', 'the', 'a', 'an', 'is', 'are', 'in', 'of', 'to', 'and', 'or', 'for', 'on', 'at', 'by', 'from', 'that', 'this', 'it', 'be', 'as']);
    return text
        .toLowerCase()
        .replace(/[^\wÀ-ỹ\s]/gu, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1 && !stopwords.has(t));
}

/**
 * Tính Jaccard similarity giữa 2 tập token.
 */
function jaccardSimilarity(tokensA, tokensB) {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    const intersection = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}

/**
 * Kiểm tra xem câu hỏi mới có trùng ý với câu hỏi đã có không.
 * Dùng Jaccard similarity trên token — bắt được cả câu diễn đạt khác nhau cùng ý.
 * Threshold thấp hơn (0.35) vì câu hỏi tiếng Việt ngắn có tập token nhỏ, Jaccard tự nhiên thấp hơn.
 * @param {string} newQuestion - text câu hỏi mới
 * @param {Array<{noi_dung?: string, question?: string}>} existingQs
 * @param {number} threshold
 * @returns {boolean}
 */
function isSemanticDuplicate(newQuestion, existingQs, threshold = SEMANTIC_DUP_THRESHOLD) {
    const newTokens = tokenize(newQuestion);
    if (newTokens.length === 0) return false;
    for (const eq of existingQs) {
        const eqText = eq.noi_dung || eq.question || '';
        const eqTokens = tokenize(eqText);
        if (eqTokens.length === 0) continue;
        if (jaccardSimilarity(newTokens, eqTokens) >= threshold) {
            return true;
        }
    }
    return false;
}

// ================================================================
// VALIDATE CẤU TRÚC
// ================================================================

/**
 * Kiểm tra câu hỏi có đúng cấu trúc yêu cầu không:
 * - Đúng 4 đáp án
 * - Đúng 1 đáp án đúng
 * - Có explanation
 * - Có difficulty hợp lệ
 */
function isStructurallyValid(q) {
    if (!q || !q.question || typeof q.question !== 'string') return false;
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;
    const correctCount = q.options.filter(o => o.is_correct).length;
    if (correctCount !== 1) return false;
    if (!q.explanation || typeof q.explanation !== 'string') return false;
    if (!['Easy', 'Medium', 'Hard'].includes(q.difficulty)) return false;
    return true;
}

/**
 * Ép difficulty theo bảng ánh xạ Bloom → Difficulty.
 * AI không được tự quyết định difficulty.
 */
function enforceBloomDifficultyConsistency(q) {
    if (q.bloom_level && BLOOM_TO_DIFFICULTY[q.bloom_level]) {
        q.difficulty = BLOOM_TO_DIFFICULTY[q.bloom_level];
    }
    return q;
}

// ================================================================
// SINH CÂU HỎI
// ================================================================

/**
 * Build system prompt cho bước sinh câu hỏi.
 * @param {number} bufferCount - số câu cần sinh (needed + buffer)
 * @param {{bloomLevel: string, difficulty: string}[]} bloomPlan
 * @param {string[]} typePlan
 * @param {string} context - nội dung tài liệu liên quan (mini-RAG)
 * @param {Array<{noi_dung?: string, question?: string, chu_de?: string}>} recentQs
 * @param {string} chapterTitle
 * @param {string} topicName
 */
function buildQuestionGenPrompt(bufferCount, bloomPlan, typePlan, context, recentQs, chapterTitle, topicName) {
    // Mô tả từng câu cần sinh (Bloom + dạng câu hỏi)
    const questionsSpec = bloomPlan.slice(0, bufferCount).map((bp, i) => {
        const qType = typePlan[i] || QUESTION_TYPES[i % QUESTION_TYPES.length];
        return `  Câu ${i + 1}: Bloom=${bp.bloomLevel}, Difficulty=${bp.difficulty}, Dạng="${qType}"`;
    }).join('\n');

    // Liệt kê tối đa 12 câu cũ để AI tránh trùng (chống trùng thật chạy bằng code)
    const recentSummary = recentQs.slice(-MAX_RECENT_QS_IN_PROMPT)
        .map((q, i) => `${i + 1}. ${q.noi_dung || q.question || ''}`)
        .join('\n');

    const systemPrompt = `Bạn là chuyên gia xây dựng đề thi trắc nghiệm đại học. Sinh đúng ${bufferCount} câu hỏi trắc nghiệm mới dựa trên nội dung tài liệu.

CHƯƠNG/CHỦ ĐỀ CẦN SINH: ${chapterTitle} → ${topicName}

KẾ HOẠCH TỪNG CÂU (phải tuân thủ chính xác):
${questionsSpec}

QUY TẮC BẮT BUỘC:
1. Trả về JSON object: {"questions": [...]} — KHÔNG có text thêm
2. Mỗi câu hỏi: {"question":"...","options":[{"text":"...","is_correct":bool},...],"explanation":"...","difficulty":"Easy/Medium/Hard","topic":"...","bloom_level":"...","chapter":"...","question_type":"...","keywords":["..."]}
3. Đúng 4 đáp án, đúng 1 is_correct=true
4. difficulty PHẢI khớp với Bloom trong kế hoạch: Remember/Understand→Easy, Apply→Medium, Analyze/Evaluate→Hard
5. Đáp án nhiễu phải hợp lý (phản ánh lỗi hiểu sai phổ biến), không vô nghĩa, không quá ngắn/quá dài
6. explanation TỐI ĐA 2 CÂU — viết súc tích, đúng trọng tâm
7. TUYỆT ĐỐI BÁM SÁT 100% NỘI DUNG TÀI LIỆU được cung cấp bên dưới. KHÔNG sinh câu hỏi nằm ngoài tài liệu hay tự bịa kiến thức ngoại lai. Nếu tài liệu không nói đến chi tiết đó thì tuyệt đối không được hỏi.
8. TUYỆT ĐỐI không lặp ý các câu đã có

CHECKLIST TỰ KIỂM TRA (trước khi trả kết quả):
□ Đủ ${bufferCount} câu
□ Mỗi câu đúng 4 đáp án, 1 đáp án đúng
□ difficulty khớp bloom_level
□ explanation ≤ 2 câu
□ Chỉ hỏi kiến thức có thực trong tài liệu được cung cấp
□ Không trùng câu đã có`;

    const userContent = `NỘI DUNG TÀI LIỆU LIÊN QUAN (CHỈ ĐƯỢC PHÉP SINH CÂU HỎI TRONG PHẠM VI NỘI DUNG NÀY):
${context || 'Toàn bộ tài liệu gốc của giảng viên.'}

${recentSummary ? `CÁC CÂU ĐÃ SINH (TUYỆT ĐỐI KHÔNG LẶP Ý):\n${recentSummary}\n\n` : ''}HÃY SINH ${bufferCount} CÂU HỎI TRẮC NGHIỆM MỚI THEO KẾ HOẠCH VÀ CHỈ DỰA TRÊN NỘI DUNG TÀI LIỆU TRÊN.`;

    return { systemPrompt, userContent };
}

/**
 * Sinh câu hỏi cho 1 target cụ thể.
 * @param {object} opts
 * @param {object} opts.client - OpenAI client
 * @param {string} opts.model - model chính (llama-3.3-70b-versatile cho Groq)
 * @param {{chapterTitle: string, topicName: string, allocated: number, keywords: string[]}} opts.target
 * @param {Array<{chapterTitle: string, text: string}>} opts.chunks
 * @param {Array} opts.existingQs - toàn bộ câu hỏi đã có trong session
 * @param {string|null} opts.forcedDifficulty
 * @param {string[]} opts.recentTypesHistory - lịch sử dạng câu hỏi gần nhất
 * @param {number} opts.needed - số câu cần sinh cho target này
 * @returns {Promise<Array>}
 */
async function generateQuestionsForTarget({ client, model, target, chunks, existingQs, forcedDifficulty, recentTypesHistory, needed }) {
    // Buffer: sinh dư một chút để bù cho câu bị lọc, nhưng không vượt quá 10 câu/lần
    const bufferCount = Math.min(needed + 2, 10);

    // Kế hoạch Bloom và dạng câu hỏi cho batch này
    const bloomPlan  = buildBloomPlan(bufferCount, forcedDifficulty);
    const typePlan   = buildQuestionTypePlan(bufferCount, recentTypesHistory);

    // Mini-RAG: lấy context liên quan đến chủ đề
    const context = retrieveRelevantContext(chunks, target.chapterTitle, target.topicName, target.keywords);

    const { systemPrompt, userContent } = buildQuestionGenPrompt(
        bufferCount, bloomPlan, typePlan, context, existingQs, target.chapterTitle, target.topicName
    );

    let attempts = 0;
    let lastError = null;

    while (attempts < 3) {
        attempts++;
        try {
            const response = await client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userContent  }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.75,
                max_tokens: QUESTION_GEN_MAX_TOKENS
            });

            let jsonContent = response.choices[0].message.content || '{}';
            // Loại markdown fence nếu có
            if (jsonContent.includes('```json')) {
                jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
            } else if (jsonContent.includes('```')) {
                jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
            }

            const parsed = JSON.parse(jsonContent);
            let newQs = parsed.questions || [];

            if (newQs.length === 0) throw new Error('AI trả về danh sách câu hỏi trống');

            // 1. Validate cấu trúc
            newQs = newQs.filter(q => isStructurallyValid(q));

            // 2. Ép Bloom/Difficulty đúng bảng ánh xạ
            newQs = newQs.map((q, i) => {
                // Gắn bloom_level từ plan nếu AI quên ghi
                if (!q.bloom_level && bloomPlan[i]) {
                    q.bloom_level = bloomPlan[i].bloomLevel;
                }
                return enforceBloomDifficultyConsistency(q);
            });

            // 3. Lọc trùng ngữ nghĩa với toàn bộ câu đã có (không chỉ 12 câu trong prompt)
            const deduped = [];
            for (const q of newQs) {
                const allPrevious = [...existingQs, ...deduped];
                if (!isSemanticDuplicate(q.question, allPrevious)) {
                    deduped.push(q);
                } else {
                    console.log(`[QGen] Lọc câu trùng: "${q.question.slice(0, 60)}..."`);
                }
            }

            // 4. Gắn metadata chương/chủ đề/dạng câu hỏi
            const result = deduped.slice(0, needed).map((q, i) => ({
                ...q,
                topic:         q.topic         || target.topicName,
                chapter:       q.chapter       || target.chapterTitle,
                question_type: q.question_type || typePlan[i] || 'Định nghĩa',
                keywords:      q.keywords      || target.keywords || []
            }));

            console.log(`[QGen] Target "${target.topicName}": cần ${needed}, sinh ${bufferCount}, qua lọc ${deduped.length}, giữ ${result.length}`);
            return result;

        } catch (err) {
            lastError = err;

            // Phân loại lỗi 429: đọc header retry-after nếu Groq cung cấp
            const status = err.status || err.response?.status;
            const isRateLimit = status === 429 || err.message?.includes('429') || err.message?.toLowerCase().includes('rate limit');

            if (isRateLimit) {
                // Đọc retry-after từ header (Groq gửi số giây phải đợi)
                const retryAfterSec = parseInt(
                    err.headers?.['retry-after'] ||
                    err.response?.headers?.['retry-after'] ||
                    err.error?.headers?.['retry-after'] ||
                    '0', 10
                );

                if (retryAfterSec > 60) {
                    // Groq báo phải đợi hơn 1 phút → hết quota ngày, không retry vô ích
                    console.warn(`[QGen] Hết quota Groq (retry-after: ${retryAfterSec}s) → dừng retry ngay`);
                    throw new Error(`Rate limit Groq — hết quota, retry-after: ${retryAfterSec}s. Thử lại sau.`);
                }

                // Chờ đúng theo retry-after nếu ≤ 60s, tối thiểu 2s
                const waitMs = Math.max(retryAfterSec * 1000 || 2000, 2000);
                console.warn(`[QGen] Rate limit 429 (attempt ${attempts}/3) — chờ ${waitMs}ms theo retry-after`);
                await new Promise(r => setTimeout(r, waitMs));
            } else {
                // Lỗi khác (network, parse error, ...) — exponential backoff bình thường
                console.warn(`[QGen] Attempt ${attempts}/3 thất bại: ${err.message}`);
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts - 1)));
            }
        }
    }

    throw new Error(`Không thể sinh câu hỏi sau 3 lần thử: ${lastError?.message}`);
}


module.exports = {
    BLOOM_TO_DIFFICULTY,
    BLOOM_WEIGHTS,
    QUESTION_TYPES,
    allocateByImportance,
    buildAllocationPlan,
    getNextAllocationTarget,
    buildBloomPlan,
    buildQuestionTypePlan,
    retrieveRelevantContext,
    isSemanticDuplicate,
    isStructurallyValid,
    enforceBloomDifficultyConsistency,
    generateQuestionsForTarget,
    tokenize
};
