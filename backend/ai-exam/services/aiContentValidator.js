'use strict';

/**
 * aiContentValidator.js
 * Validation layer for the AI question generation pipeline.
 *
 * Integration points in aiAssistedService.js generateBatch():
 *   POINT A (before generation): checkDocumentNotEmpty -> detectDuplicateContent -> calculateMaxQuestions -> validateRequestedQuestionCount
 *   POINT B (after generation):  validateGeneratedQuestions
 *
 * All numeric thresholds live in CONFIG for easy tuning without touching logic.
 */

// ================================================================
// CONFIG
// ================================================================
const CONFIG = {
    /** Minimum substantive word count in a document (step 1) */
    MIN_CONTENT_WORDS: Number(process.env.VALIDATOR_MIN_WORDS) || 150,
    /** Minimum words-per-question ratio — e.g. 15 means a 150-word doc can support at most 10 questions (step 1) */
    MIN_WORDS_PER_QUESTION: Number(process.env.VALIDATOR_WORDS_PER_Q) || 15,
    /** Jaccard threshold to consider two paragraphs as duplicates (step 2) */
    PARA_DUPLICATE_THRESHOLD: 0.7,
    /** Shingle size in words (step 2) */
    SHINGLE_SIZE: 5,
    /** Multiplier: knowledge nodes * this = max recommended questions (step 3) */
    QUESTIONS_PER_NODE: 1.5,
    /** requestedCount > maxQuestions * WARN_MULTIPLIER -> warning (step 3) */
    WARN_MULTIPLIER: 2,
    /** requestedCount > maxQuestions * REJECT_MULTIPLIER -> hard reject (step 3) */
    REJECT_MULTIPLIER: 3,
    /** Jaccard threshold for duplicates among newly generated questions (step 4) */
    QUESTION_DUPLICATE_THRESHOLD: 0.75,
    /** Jaccard threshold for duplicates against the existing question bank (step 4) */
    BANK_DUPLICATE_THRESHOLD: 0.75,
};

// ================================================================
// UTILITY
// ================================================================

/** Normalize to lowercase, remove punctuation, collapse whitespace */
function normalizeText(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^\w\u00C0-\u1EF9\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Split normalized text into word tokens */
function tokenize(text) {
    return normalizeText(text).split(' ').filter(t => t.length > 0);
}

/** Build a Set of n-gram shingles from a token array */
function buildShingles(tokens, n) {
    const shingles = new Set();
    for (let i = 0; i <= tokens.length - n; i++) {
        shingles.add(tokens.slice(i, i + n).join(' '));
    }
    return shingles;
}

/** Jaccard similarity between two Sets */
function jaccardOnSets(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
        if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

// ================================================================
// STEP 1: Check for empty / title-only document
// ================================================================

/**
 * Detect heading lines: all-caps, fewer than 8 words, or chapter markers.
 */
function isHeadingLine(line) {
    const t = line.trim();
    if (!t) return false;
    if (/^(chuong|phan|muc|bai|section|chapter|part)\s*[\dIVXivx]+[.:)]*$/i.test(t)) return true;
    if (/^[\dIVXivx]+[.:)]\s*$/.test(t)) return true;
    const words = t.split(/\s+/).filter(Boolean);
    const letters = t.replace(/[^a-zA-Z\u00C0-\u1EF9\s]/gu, '').trim();
    if (letters.length > 0 && letters === letters.toUpperCase() && words.length <= 8) return true;
    return false;
}

/**
 * Return isValid=false when:
 *   (a) document has fewer than MIN_CONTENT_WORDS substantive words, OR
 *   (b) words-per-question ratio is below MIN_WORDS_PER_QUESTION
 *       (prevents uploading 151-word doc and requesting 50 questions).
 *
 * @param {string} rawText
 * @param {number} [requestedCount=0] - number of questions the teacher wants; 0 = skip ratio check
 * @returns {{ isValid: boolean, wordCount: number, totalWords: number, reason: string, maxAllowedQuestions?: number }}
 */
function checkDocumentNotEmpty(rawText, requestedCount) {
    if (!rawText || rawText.trim().length === 0) {
        return { isValid: false, wordCount: 0, totalWords: 0, reason: 'EMPTY_OR_TITLE_ONLY_DOCUMENT' };
    }
    const totalWords = rawText.trim().split(/\s+/).filter(Boolean).length;
    const lines = rawText.split(/\r?\n/);
    let contentWords = 0;
    for (const line of lines) {
        if (!line.trim() || isHeadingLine(line)) continue;
        const words = line.trim().split(/\s+/).filter(Boolean);
        contentWords += words.length;
    }
    // Nếu cả bài chỉ là 1 đoạn ngắn, contentWords có thể bằng totalWords
    if (contentWords === 0 && totalWords > 0) {
        contentWords = totalWords;
    }

    if (contentWords < CONFIG.MIN_CONTENT_WORDS) {
        return { isValid: false, wordCount: contentWords, totalWords, reason: 'EMPTY_OR_TITLE_ONLY_DOCUMENT' };
    }
    // Ratio check: if requestedCount is provided, verify words-per-question
    if (requestedCount && requestedCount > 0) {
        const maxAllowedByRatio = Math.floor(contentWords / CONFIG.MIN_WORDS_PER_QUESTION);
        if (requestedCount > maxAllowedByRatio) {
            return {
                isValid: false,
                wordCount: contentWords,
                totalWords,
                reason: 'INSUFFICIENT_CONTENT_FOR_REQUESTED_COUNT',
                maxAllowedQuestions: maxAllowedByRatio
            };
        }
    }
    return { isValid: true, wordCount: contentWords, totalWords, reason: '' };
}

// ================================================================
// STEP 2: Detect copy-paste / repeated content
// ================================================================

/**
 * Detect near-duplicate paragraphs using 5-gram Jaccard shingling.
 * Returns deduplicated content as uniqueContent.
 * @param {string} rawText
 * @returns {{ hasDuplicates: boolean, duplicateGroups: number[][], uniqueContent: string }}
 */
function detectDuplicateContent(rawText) {
    const paragraphs = rawText
        .split(/\r?\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 5);

    if (paragraphs.length <= 1) {
        return { hasDuplicates: false, duplicateGroups: [], uniqueContent: rawText };
    }

    const shingleSets = paragraphs.map(p => buildShingles(tokenize(p), CONFIG.SHINGLE_SIZE));
    const duplicateOf = new Array(paragraphs.length).fill(-1);
    const duplicateGroups = [];
    const groupMap = new Map();

    for (let i = 0; i < paragraphs.length; i++) {
        for (let j = i + 1; j < paragraphs.length; j++) {
            if (duplicateOf[j] !== -1) continue;
            if (jaccardOnSets(shingleSets[i], shingleSets[j]) > CONFIG.PARA_DUPLICATE_THRESHOLD) {
                duplicateOf[j] = i;
                if (!groupMap.has(i)) {
                    groupMap.set(i, [i]);
                    duplicateGroups.push(groupMap.get(i));
                }
                groupMap.get(i).push(j);
            }
        }
    }

    const keptIndices = new Set(paragraphs.map((_, i) => i).filter(i => duplicateOf[i] === -1));
    const uniqueContent = paragraphs.filter((_, i) => keptIndices.has(i)).join('\n\n');

    return { hasDuplicates: duplicateGroups.length > 0, duplicateGroups, uniqueContent };
}

// ================================================================
// STEP 3: Cap question count based on actual content
// ================================================================

/** Count total topic nodes across all chapters in a KG */
function countKnowledgeNodes(kg) {
    if (!kg || !Array.isArray(kg.chapters)) return 0;
    return kg.chapters.reduce((sum, c) => sum + (Array.isArray(c.topics) ? c.topics.length : 1), 0);
}

/**
 * Build a KG over uniqueContent and derive the maximum sensible question count.
 * Uses the existing aiKnowledgeGraph.buildKnowledgeGraph (passed as argument).
 * Falls back to a word-count heuristic if KG fails.
 *
 * @param {string} uniqueContent - de-duplicated text from step 2
 * @param {object} client - OpenAI-compatible client
 * @param {string} kgModel
 * @param {Function} buildDocumentChunks
 * @param {Function} buildKnowledgeGraph
 * @returns {Promise<{ maxQuestions: number, knowledgeNodeCount: number }>}
 */
async function calculateMaxQuestions(uniqueContent, client, kgModel, buildDocumentChunks, buildKnowledgeGraph) {
    try {
        const chunks = buildDocumentChunks(uniqueContent, { maxTokens: 1500 });
        const kg = await buildKnowledgeGraph(client, kgModel, chunks);
        const knowledgeNodeCount = countKnowledgeNodes(kg);
        const maxQuestions = Math.floor(knowledgeNodeCount * CONFIG.QUESTIONS_PER_NODE);
        return { maxQuestions: Math.max(maxQuestions, 1), knowledgeNodeCount };
    } catch (err) {
        console.warn('[Validator] calculateMaxQuestions KG fallback:', err.message);
        const estimated = Math.floor(tokenize(uniqueContent).length / 50);
        return { maxQuestions: Math.max(estimated, 1), knowledgeNodeCount: 0 };
    }
}

/**
 * Gate the requested question count against the calculated maximum.
 * @param {number} requestedCount
 * @param {number} maxQuestions
 * @returns {{ allowed: boolean, warning?: string, suggestedMax?: number, reason?: string, message?: string }}
 */
function validateRequestedQuestionCount(requestedCount, maxQuestions) {
    if (requestedCount <= maxQuestions) return { allowed: true };

    if (requestedCount <= maxQuestions * CONFIG.WARN_MULTIPLIER) {
        return {
            allowed: true,
            warning: 'Nội dung tài liệu có thể chưa đủ phong phú; một số câu hỏi có thể bị trùng lặp ý nghĩa.',
            suggestedMax: maxQuestions
        };
    }

    if (requestedCount <= maxQuestions * CONFIG.REJECT_MULTIPLIER) {
        return {
            allowed: true,
            warning: 'Số câu hỏi yêu cầu (' + requestedCount + ') vượt quá 2 lần giới hạn tối ưu (' + maxQuestions + '). Chất lượng bộ đề có thể bị ảnh hưởng.',
            suggestedMax: maxQuestions
        };
    }

    return {
        allowed: false,
        reason: 'CONTENT_INSUFFICIENT_FOR_REQUESTED_COUNT',
        suggestedMax: maxQuestions,
        message: 'Tài liệu chỉ đủ nội dung để tạo tối đa ' + maxQuestions + ' câu hỏi chất lượng. Vui lòng bổ sung thêm nội dung vào tài liệu hoặc giảm số câu hỏi yêu cầu.'
    };
}

// ================================================================
// STEP 4: Post-generation validation
// ================================================================

/**
 * 4a. Ask the AI to verify one question is grounded in the source text
 * and has exactly one correct answer. Falls back to pass-through on error.
 *
 * @param {object} question - { question, options, explanation }
 * @param {string} sourceContent
 * @param {object} client
 * @param {string} model
 * @returns {Promise<{ isGroundedInSource: boolean, hasUniqueCorrectAnswer: boolean, confidence: number }>}
 */
async function checkQuestionGrounding(question, sourceContent, client, model) {
    const optionsText = (question.options || [])
        .map((o, i) => String.fromCharCode(65 + i) + '. ' + o.text + (o.is_correct ? ' [CORRECT]' : ''))
        .join('\n');

    const prompt = 'You are a strict exam question auditor. Evaluate the question below against the source document.\n\n'
        + 'SOURCE DOCUMENT:\n' + (sourceContent || '').slice(0, 2000)
        + '\n\nQUESTION:\n' + (question.question || '')
        + '\n\nOPTIONS:\n' + optionsText
        + '\n\nEXPLANATION:\n' + (question.explanation || '')
        + '\n\nRespond with JSON only: {"isGroundedInSource":bool,"hasUniqueCorrectAnswer":bool,"confidence":float}';

    try {
        const response = await client.chat.completions.create({
            model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0,
            max_tokens: 150
        });
        let jsonContent = response.choices[0].message.content || '{}';
        if (jsonContent.includes('```json')) {
            jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
        } else if (jsonContent.includes('```')) {
            jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
        }
        const parsed = JSON.parse(jsonContent);
        return {
            isGroundedInSource: Boolean(parsed.isGroundedInSource),
            hasUniqueCorrectAnswer: Boolean(parsed.hasUniqueCorrectAnswer),
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
        };
    } catch (err) {
        console.warn('[Validator] checkQuestionGrounding error (passing through):', err.message);
        return { isGroundedInSource: true, hasUniqueCorrectAnswer: true, confidence: 0 };
    }
}

/**
 * 4b. Check one question for duplicates against already-validated new questions
 * and the existing question bank (from DB).
 *
 * @param {object} question
 * @param {Array} newQsSoFar - questions already accepted in this run
 * @param {Array} bankQs - existing bank questions [{ noi_dung: string }]
 * @returns {{ isDuplicate: boolean, reason: string }}
 */
function checkQuestionDuplicate(question, newQsSoFar, bankQs) {
    const qShingles = buildShingles(tokenize(question.question || ''), CONFIG.SHINGLE_SIZE);

    for (const prev of newQsSoFar) {
        const prevShingles = buildShingles(tokenize(prev.question || ''), CONFIG.SHINGLE_SIZE);
        if (jaccardOnSets(qShingles, prevShingles) > CONFIG.QUESTION_DUPLICATE_THRESHOLD) {
            return { isDuplicate: true, reason: 'DUPLICATE_IN_CURRENT_BATCH' };
        }
    }
    for (const bankQ of (bankQs || [])) {
        const bankShingles = buildShingles(tokenize(bankQ.noi_dung || ''), CONFIG.SHINGLE_SIZE);
        if (jaccardOnSets(qShingles, bankShingles) > CONFIG.BANK_DUPLICATE_THRESHOLD) {
            return { isDuplicate: true, reason: 'DUPLICATE_WITH_EXISTING_BANK' };
        }
    }
    return { isDuplicate: false, reason: '' };
}

/**
 * Post-validate the full list of questions generated by aiQuestionGeneration.
 * Call this AFTER generateQuestionsForTarget returns and BEFORE saveStagingQuestions.
 *
 * Step 4a: AI grounding check (batched in groups of 3 to respect rate limits).
 * Step 4b: Jaccard duplicate check vs new batch and vs existing bank.
 *
 * @param {Array} questions - freshly generated questions
 * @param {string} sourceContent - original document text (used for grounding)
 * @param {Array} bankQs - existing bank questions for this subject [{ noi_dung }]
 * @param {object} client
 * @param {string} model
 * @returns {Promise<{ validQuestions: Array, rejectedQuestions: Array, rejectionReasons: Object }>}
 */
async function validateGeneratedQuestions(questions, sourceContent, bankQs, client, model) {
    const validQuestions = [];
    const rejectedQuestions = [];
    const rejectionReasons = {};

    // Run grounding checks in batches of 3 (controlled concurrency)
    const CONCURRENCY = 3;
    const groundingResults = [];
    for (let i = 0; i < questions.length; i += CONCURRENCY) {
        const batchResults = await Promise.all(
            questions.slice(i, i + CONCURRENCY).map(q => checkQuestionGrounding(q, sourceContent, client, model))
        );
        groundingResults.push(...batchResults);
        if (i + CONCURRENCY < questions.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const gr = groundingResults[i];

        // 4a
        if (!gr.isGroundedInSource || !gr.hasUniqueCorrectAnswer) {
            const reason = !gr.isGroundedInSource ? 'NOT_GROUNDED_IN_SOURCE' : 'NO_UNIQUE_CORRECT_ANSWER';
            rejectedQuestions.push(q);
            rejectionReasons[i] = reason;
            console.log('[Validator] Rejected "' + (q.question || '').slice(0, 60) + '" — ' + reason);
            continue;
        }

        // 4b
        const dup = checkQuestionDuplicate(q, validQuestions, bankQs);
        if (dup.isDuplicate) {
            rejectedQuestions.push(q);
            rejectionReasons[i] = dup.reason;
            console.log('[Validator] Rejected "' + (q.question || '').slice(0, 60) + '" — ' + dup.reason);
            continue;
        }

        validQuestions.push(q);
    }

    console.log('[Validator] Post-check: ' + validQuestions.length + ' valid, ' + rejectedQuestions.length + ' rejected');
    return { validQuestions, rejectedQuestions, rejectionReasons };
}

module.exports = {
    CONFIG,
    checkDocumentNotEmpty,
    detectDuplicateContent,
    calculateMaxQuestions,
    validateRequestedQuestionCount,
    validateGeneratedQuestions,
    normalizeText,
    tokenize,
    buildShingles,
    jaccardOnSets,
    checkQuestionGrounding,
    checkQuestionDuplicate,
};