module.exports = (dbPromise) => {
    return {
        // 1. Quản lý tài liệu Word tải lên
        saveDocument: async ({ ma_mon_hoc, ma_giang_vien, tieu_de, file_name, file_url, text_content }) => {
            const [res] = await dbPromise.query(
                `INSERT INTO documents (ma_mon_hoc, ma_giang_vien, tieu_de, file_name, file_url, text_content, trang_thai) 
                 VALUES (?, ?, ?, ?, ?, ?, 'READY')`,
                [ma_mon_hoc, ma_giang_vien, tieu_de, file_name, file_url, text_content]
            );
            return res.insertId;
        },

        getDocumentsByTeacher: async (ma_giang_vien) => {
            const [rows] = await dbPromise.query(
                `SELECT d.*, m.TenMonHoc 
                 FROM documents d 
                 JOIN monhoc m ON d.ma_mon_hoc = m.MaMonHoc 
                 WHERE d.ma_giang_vien = ? 
                 ORDER BY d.created_at DESC`,
                [ma_giang_vien]
            );
            return rows.map(r => ({ ...r, text_content: r.text_content ? `${r.text_content.slice(0, 150)}...` : '' }));
        },

        getDocumentById: async (id) => {
            const [rows] = await dbPromise.query(
                `SELECT d.*, m.TenMonHoc 
                 FROM documents d 
                 JOIN monhoc m ON d.ma_mon_hoc = m.MaMonHoc 
                 WHERE d.id = ?`,
                [id]
            );
            return rows[0] || null;
        },

        // 2. Quản lý phiên sinh AI (Sessions)
        createSession: async ({ document_id, ma_mon_hoc, ma_giang_vien, so_cau_yeu_cau, do_kho, chu_de }) => {
            const [res] = await dbPromise.query(
                `INSERT INTO ai_generation_sessions (document_id, ma_mon_hoc, ma_giang_vien, so_cau_yeu_cau, so_cau_da_sinh, do_kho, chu_de, trang_thai) 
                 VALUES (?, ?, ?, ?, 0, ?, ?, 'RUNNING')`,
                [document_id, ma_mon_hoc, ma_giang_vien, so_cau_yeu_cau || 10, do_kho || 'Mixed', chu_de || 'Toàn bộ']
            );
            return res.insertId;
        },

        getSessionById: async (id) => {
            const [rows] = await dbPromise.query(
                `SELECT s.*, d.tieu_de as doc_tieu_de, d.file_name, d.text_content, m.TenMonHoc 
                 FROM ai_generation_sessions s 
                 JOIN documents d ON s.document_id = d.id 
                 JOIN monhoc m ON s.ma_mon_hoc = m.MaMonHoc 
                 WHERE s.id = ?`,
                [id]
            );
            return rows[0] || null;
        },

        getSessionsByTeacher: async (ma_giang_vien) => {
            const [rows] = await dbPromise.query(
                `SELECT s.*, d.tieu_de as doc_tieu_de, m.TenMonHoc 
                 FROM ai_generation_sessions s 
                 JOIN documents d ON s.document_id = d.id 
                 JOIN monhoc m ON s.ma_mon_hoc = m.MaMonHoc 
                 WHERE s.ma_giang_vien = ? 
                 ORDER BY s.updated_at DESC`,
                [ma_giang_vien]
            );
            return rows;
        },

        updateSessionStatus: async (id, trang_thai, so_cau_da_sinh = null, error_message = null) => {
            let sql = `UPDATE ai_generation_sessions SET trang_thai = ?, error_message = ?`;
            const params = [trang_thai, error_message];
            if (so_cau_da_sinh !== null) {
                sql += `, so_cau_da_sinh = ?`;
                params.push(so_cau_da_sinh);
            }
            sql += ` WHERE id = ?`;
            params.push(id);
            await dbPromise.query(sql, params);
        },

        // 3. Quản lý câu hỏi tạm thời (Staging Questions)
        saveStagingQuestions: async (session_id, document_id, questions) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                let addedCount = 0;
                for (const q of questions) {
                    const [qRes] = await connection.query(
                        `INSERT INTO ai_generated_questions (session_id, document_id, chu_de, noi_dung, giai_thich, do_kho, trang_thai) 
                         VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
                        [session_id, document_id, q.topic || 'Chung', q.question, q.explanation || '', q.difficulty || 'Medium']
                    );
                    const qId = qRes.insertId;
                    addedCount++;

                    if (q.options && Array.isArray(q.options)) {
                        for (const opt of q.options) {
                            await connection.query(
                                `INSERT INTO ai_generated_options (question_id, noi_dung, la_dap_an_dung) 
                                 VALUES (?, ?, ?)`,
                                [qId, opt.text, opt.is_correct ? 1 : 0]
                            );
                        }
                    }
                }

                await connection.query(
                    `UPDATE ai_generation_sessions 
                     SET so_cau_da_sinh = (SELECT COUNT(*) FROM ai_generated_questions WHERE session_id = ?),
                         trang_thai = IF(so_cau_da_sinh >= so_cau_yeu_cau, 'COMPLETED', 'READY')
                     WHERE id = ?`,
                    [session_id, session_id]
                );

                await connection.commit();
                return addedCount;
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        },

        getStagingQuestionsBySession: async (session_id, filters = {}) => {
            let sql = `SELECT * FROM ai_generated_questions WHERE session_id = ?`;
            const params = [session_id];

            if (filters.trang_thai && filters.trang_thai !== 'All') {
                sql += ` AND trang_thai = ?`;
                params.push(filters.trang_thai);
            }
            if (filters.do_kho && filters.do_kho !== 'All') {
                sql += ` AND do_kho = ?`;
                params.push(filters.do_kho);
            }
            sql += ` ORDER BY id ASC`;

            const [questions] = await dbPromise.query(sql, params);
            for (const q of questions) {
                const [options] = await dbPromise.query(
                    `SELECT id, noi_dung as text, la_dap_an_dung as is_correct FROM ai_generated_options WHERE question_id = ? ORDER BY id ASC`,
                    [q.id]
                );
                q.options = options.map(o => ({ ...o, is_correct: Boolean(o.is_correct) }));
            }
            return questions;
        },

        getExistingQuestionsSummary: async (session_id) => {
            const [rows] = await dbPromise.query(
                `SELECT noi_dung, chu_de FROM ai_generated_questions WHERE session_id = ?`,
                [session_id]
            );
            return rows;
        },

        updateQuestionStatus: async (id, trang_thai) => {
            await dbPromise.query(`UPDATE ai_generated_questions SET trang_thai = ? WHERE id = ?`, [trang_thai, id]);
        },

        getSessionByQuestionId: async (questionId) => {
            const [rows] = await dbPromise.query(
                `SELECT s.*, d.tieu_de as doc_tieu_de, m.TenMonHoc 
                 FROM ai_generated_questions q 
                 JOIN ai_generation_sessions s ON q.session_id = s.id 
                 JOIN documents d ON s.document_id = d.id 
                 JOIN monhoc m ON s.ma_mon_hoc = m.MaMonHoc 
                 WHERE q.id = ?`,
                [questionId]
            );
            return rows[0] || null;
        },

        // 4. Chuyển câu hỏi đã duyệt sang Ngân hàng câu hỏi chính thức (Question Bank)
        approveAndMoveToBank: async (questionId, session) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                const [qs] = await connection.query(`SELECT * FROM ai_generated_questions WHERE id = ?`, [questionId]);
                if (qs.length === 0) throw new Error('Không tìm thấy câu hỏi');
                const stagingQ = qs[0];

                const [opts] = await connection.query(`SELECT * FROM ai_generated_options WHERE question_id = ?`, [questionId]);

                const bankTitle = session.tieu_de || `Bộ đề AI - ${session.TenMonHoc || session.ma_mon_hoc}`;
                let bankId;
                const [existingBanks] = await connection.query(
                    `SELECT id FROM question_banks WHERE ma_mon_hoc = ? AND ma_giang_vien = ? AND tieu_de = ? LIMIT 1`,
                    [session.ma_mon_hoc, session.ma_giang_vien, bankTitle]
                );

                if (existingBanks.length > 0) {
                    bankId = existingBanks[0].id;
                } else {
                    const [newBank] = await connection.query(
                        `INSERT INTO question_banks (ma_mon_hoc, ma_giang_vien, tieu_de, tong_so_cau, trang_thai) 
                         VALUES (?, ?, ?, 0, 'Approved')`,
                        [session.ma_mon_hoc, session.ma_giang_vien, bankTitle]
                    );
                    bankId = newBank.insertId;
                }

                let realQId = stagingQ.bank_question_id;
                if (!realQId) {
                    const [resQ] = await connection.query(
                        `INSERT INTO questions (bank_id, chu_de, noi_dung, giai_thich, do_kho, ai_generated, trang_thai) 
                         VALUES (?, ?, ?, ?, ?, 1, 'Approved')`,
                        [bankId, stagingQ.chu_de || 'Chung', stagingQ.noi_dung, stagingQ.giai_thich, stagingQ.do_kho]
                    );
                    realQId = resQ.insertId;
                } else {
                    await connection.query(
                        `UPDATE questions SET chu_de = ?, noi_dung = ?, giai_thich = ?, do_kho = ?, trang_thai = 'Approved' WHERE id = ?`,
                        [stagingQ.chu_de || 'Chung', stagingQ.noi_dung, stagingQ.giai_thich, stagingQ.do_kho, realQId]
                    );
                    await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [realQId]);
                }

                for (const o of opts) {
                    await connection.query(
                        `INSERT INTO question_options (question_id, noi_dung, la_dap_an_dung) VALUES (?, ?, ?)`,
                        [realQId, o.noi_dung, o.la_dap_an_dung]
                    );
                }

                await connection.query(
                    `UPDATE ai_generated_questions SET trang_thai = 'APPROVED', bank_question_id = ? WHERE id = ?`,
                    [realQId, questionId]
                );

                await connection.query(
                    `UPDATE question_banks SET tong_so_cau = (SELECT COUNT(*) FROM questions WHERE bank_id = ? AND trang_thai = 'Approved') WHERE id = ?`,
                    [bankId, bankId]
                );

                await connection.commit();
                return realQId;
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        },

        approveAllInSession: async (session_id, session) => {
            const [pendingQs] = await dbPromise.query(
                `SELECT id FROM ai_generated_questions WHERE session_id = ? AND trang_thai = 'PENDING'`,
                [session_id]
            );
            let count = 0;
            const self = module.exports(dbPromise);
            for (const q of pendingQs) {
                await self.approveAndMoveToBank(q.id, session);
                count++;
            }
            return count;
        },

        getBankQuestions: async (bankId) => {
            const [qs] = await dbPromise.query(`SELECT id, chu_de, noi_dung, giai_thich, do_kho, trang_thai FROM questions WHERE bank_id = ? ORDER BY id ASC`, [bankId]);
            for (const q of qs) {
                const [opts] = await dbPromise.query(`SELECT id, noi_dung AS text, noi_dung, la_dap_an_dung AS is_correct, la_dap_an_dung FROM question_options WHERE question_id = ? ORDER BY id ASC`, [q.id]);
                q.options = opts.map(o => ({
                    id: o.id,
                    text: o.text || o.noi_dung,
                    noi_dung: o.noi_dung || o.text,
                    is_correct: Boolean(o.is_correct || o.la_dap_an_dung),
                    la_dap_an_dung: o.la_dap_an_dung || (o.is_correct ? 1 : 0)
                }));
                q.is_official_bank_question = true;
            }
            return qs;
        },

        deleteOfficialBank: async (bankId) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                const [banks] = await connection.query(`SELECT * FROM question_banks WHERE id = ?`, [bankId]);
                const bank = banks[0];

                const [qs] = await connection.query(`SELECT id FROM questions WHERE bank_id = ?`, [bankId]);
                
                // Tìm các session liên quan đến ngân hàng này
                let sessionIds = [];
                if (qs.length > 0) {
                    const [sRows] = await connection.query(`SELECT DISTINCT session_id FROM ai_generated_questions WHERE bank_question_id IN (${qs.map(q => q.id).join(',')})`);
                    sessionIds = sRows.map(r => r.session_id).filter(Boolean);
                }
                if (bank) {
                    const [matchS] = await connection.query(`SELECT s.id FROM ai_generation_sessions s LEFT JOIN documents d ON s.document_id = d.id WHERE d.tieu_de = ? OR d.tieu_de LIKE ?`, [bank.tieu_de, `%${bank.tieu_de}%`]);
                    for (const ms of matchS) {
                        if (!sessionIds.includes(ms.id)) sessionIds.push(ms.id);
                    }
                }

                // Xóa toàn bộ session AI, câu hỏi nháp và tài liệu upload liên quan
                if (sessionIds.length > 0) {
                    const [genQs] = await connection.query(`SELECT id FROM ai_generated_questions WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`, sessionIds);
                    if (genQs.length > 0) {
                        await connection.query(`DELETE FROM ai_generated_options WHERE question_id IN (${genQs.map(q => q.id).join(',')})`);
                    }
                    await connection.query(`DELETE FROM ai_generated_questions WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`, sessionIds);
                    
                    const [docs] = await connection.query(`SELECT DISTINCT document_id FROM ai_generation_sessions WHERE id IN (${sessionIds.map(() => '?').join(',')})`, sessionIds);
                    await connection.query(`DELETE FROM ai_generation_sessions WHERE id IN (${sessionIds.map(() => '?').join(',')})`, sessionIds);
                    
                    const docIds = docs.map(d => d.document_id).filter(Boolean);
                    if (docIds.length > 0) {
                        await connection.query(`DELETE FROM documents WHERE id IN (${docIds.map(() => '?').join(',')})`, docIds);
                    }
                }

                for (const q of qs) {
                    await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [q.id]);
                }
                await connection.query(`DELETE FROM questions WHERE bank_id = ?`, [bankId]);
                await connection.query(`DELETE FROM question_banks WHERE id = ?`, [bankId]);

                await connection.commit();
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        },

        updateOfficialBank: async (bankId, { tieu_de }) => {
            await dbPromise.query(`UPDATE question_banks SET tieu_de = ? WHERE id = ?`, [tieu_de, bankId]);
        },

        updateQuestion: async (id, { noi_dung, giai_thich, do_kho, chu_de, options }) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                const [checkStaging] = await connection.query(`SELECT id, bank_question_id, trang_thai FROM ai_generated_questions WHERE id = ?`, [id]);
                if (checkStaging.length > 0) {
                    await connection.query(
                        `UPDATE ai_generated_questions SET noi_dung = ?, giai_thich = ?, do_kho = ?, chu_de = ? WHERE id = ?`,
                        [noi_dung, giai_thich, do_kho || 'Medium', chu_de || 'Chung', id]
                    );

                    if (options && Array.isArray(options)) {
                        await connection.query(`DELETE FROM ai_generated_options WHERE question_id = ?`, [id]);
                        for (const opt of options) {
                            await connection.query(
                                `INSERT INTO ai_generated_options (question_id, noi_dung, la_dap_an_dung) VALUES (?, ?, ?)`,
                                [id, opt.text || opt.noi_dung, opt.is_correct || opt.la_dap_an_dung ? 1 : 0]
                            );
                        }
                    }

                    if (checkStaging[0].trang_thai === 'APPROVED' && checkStaging[0].bank_question_id) {
                        const realId = checkStaging[0].bank_question_id;
                        await connection.query(
                            `UPDATE questions SET chu_de = ?, noi_dung = ?, giai_thich = ?, do_kho = ? WHERE id = ?`,
                            [chu_de || 'Chung', noi_dung, giai_thich, do_kho || 'Medium', realId]
                        );
                        if (options && Array.isArray(options)) {
                            await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [realId]);
                            for (const opt of options) {
                                await connection.query(
                                    `INSERT INTO question_options (question_id, noi_dung, la_dap_an_dung) VALUES (?, ?, ?)`,
                                    [realId, opt.text || opt.noi_dung, opt.is_correct || opt.la_dap_an_dung ? 1 : 0]
                                );
                            }
                        }
                    }
                } else {
                    const [checkProd] = await connection.query(`SELECT id, bank_id FROM questions WHERE id = ?`, [id]);
                    if (checkProd.length > 0) {
                        await connection.query(
                            `UPDATE questions SET chu_de = ?, noi_dung = ?, giai_thich = ?, do_kho = ? WHERE id = ?`,
                            [chu_de || 'Chung', noi_dung, giai_thich, do_kho || 'Medium', id]
                        );
                        if (options && Array.isArray(options)) {
                            await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [id]);
                            for (const opt of options) {
                                await connection.query(
                                    `INSERT INTO question_options (question_id, noi_dung, la_dap_an_dung) VALUES (?, ?, ?)`,
                                    [id, opt.text || opt.noi_dung, opt.is_correct || opt.la_dap_an_dung ? 1 : 0]
                                );
                            }
                        }
                    } else {
                        throw new Error('Không tìm thấy câu hỏi để chỉnh sửa');
                    }
                }

                await connection.commit();
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        },

        deleteQuestion: async (id) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                const [qs] = await connection.query(`SELECT bank_question_id, session_id FROM ai_generated_questions WHERE id = ?`, [id]);
                if (qs.length > 0) {
                    if (qs[0].bank_question_id) {
                        const [prodQ] = await connection.query(`SELECT bank_id FROM questions WHERE id = ?`, [qs[0].bank_question_id]);
                        await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [qs[0].bank_question_id]);
                        await connection.query(`DELETE FROM questions WHERE id = ?`, [qs[0].bank_question_id]);
                        if (prodQ[0] && prodQ[0].bank_id) {
                            await connection.query(`UPDATE question_banks SET tong_so_cau = (SELECT COUNT(*) FROM questions WHERE bank_id = ? AND trang_thai = 'Approved') WHERE id = ?`, [prodQ[0].bank_id, prodQ[0].bank_id]);
                        }
                    }
                    await connection.query(`DELETE FROM ai_generated_options WHERE question_id = ?`, [id]);
                    await connection.query(`DELETE FROM ai_generated_questions WHERE id = ?`, [id]);

                    const sessionId = qs[0].session_id;
                    await connection.query(
                        `UPDATE ai_generation_sessions SET so_cau_da_sinh = (SELECT COUNT(*) FROM ai_generated_questions WHERE session_id = ?) WHERE id = ?`,
                        [sessionId, sessionId]
                    );
                } else {
                    const [prodQ] = await connection.query(`SELECT id, bank_id FROM questions WHERE id = ?`, [id]);
                    if (prodQ.length > 0) {
                        await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [id]);
                        await connection.query(`DELETE FROM questions WHERE id = ?`, [id]);
                        await connection.query(`UPDATE ai_generated_questions SET trang_thai = 'PENDING', bank_question_id = NULL WHERE bank_question_id = ?`, [id]);
                        if (prodQ[0].bank_id) {
                            await connection.query(`UPDATE question_banks SET tong_so_cau = (SELECT COUNT(*) FROM questions WHERE bank_id = ? AND trang_thai = 'Approved') WHERE id = ?`, [prodQ[0].bank_id, prodQ[0].bank_id]);
                        }
                    } else {
                        throw new Error('Không tìm thấy câu hỏi để xóa');
                    }
                }

                await connection.commit();
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        }
    };
};
