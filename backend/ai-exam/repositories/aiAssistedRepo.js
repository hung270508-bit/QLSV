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

        getLatestDocumentBySubjectAndTeacher: async (ma_mon_hoc, ma_giang_vien) => {
            const [rows] = await dbPromise.query(
                `SELECT d.*, m.TenMonHoc 
                 FROM documents d 
                 JOIN monhoc m ON d.ma_mon_hoc = m.MaMonHoc 
                 WHERE d.ma_mon_hoc = ? AND d.ma_giang_vien = ? 
                 ORDER BY d.id DESC LIMIT 1`,
                [ma_mon_hoc, ma_giang_vien]
            );
            return rows[0] || null;
        },

        getLatestDocumentBySubject: async (ma_mon_hoc) => {
            const [rows] = await dbPromise.query(
                `SELECT d.*, m.TenMonHoc 
                 FROM documents d 
                 JOIN monhoc m ON d.ma_mon_hoc = m.MaMonHoc 
                 WHERE d.ma_mon_hoc = ? 
                 ORDER BY d.id DESC LIMIT 1`,
                [ma_mon_hoc]
            );
            return rows[0] || null;
        },

        getSubjectById: async (ma_mon_hoc) => {
            const [rows] = await dbPromise.query(`SELECT MaMonHoc, TenMonHoc FROM monhoc WHERE MaMonHoc = ?`, [ma_mon_hoc]);
            return rows[0] || null;
        },

        // 2. Quản lý phiên gợi ý AI (Advisor Sessions - TTL 30 phút)
        saveSuggestionSession: async ({ id, giangvien_id, tieu_chi, goi_y, expires_at }) => {
            const tieuChiJson = typeof tieu_chi === 'string' ? tieu_chi : JSON.stringify(tieu_chi);
            const goiYJson = typeof goi_y === 'string' ? goi_y : JSON.stringify(goi_y);
            await dbPromise.query(
                `INSERT INTO ai_suggestion_sessions (id, giangvien_id, tieu_chi, goi_y, created_at, expires_at) 
                 VALUES (?, ?, ?, ?, NOW(), ?)`,
                [id, giangvien_id, tieuChiJson, goiYJson, expires_at]
            );
        },

        getSuggestionSessionById: async (id) => {
            const [rows] = await dbPromise.query(
                `SELECT * FROM ai_suggestion_sessions WHERE id = ?`,
                [id]
            );
            return rows[0] || null;
        },

        saveSuggestionAuditLog: async ({ giangvien_id, mon_hoc_id, so_cau_goi_y }) => {
            await dbPromise.query(
                `INSERT INTO ai_suggestion_audit_log (giangvien_id, mon_hoc_id, so_cau_goi_y, thoi_gian) 
                 VALUES (?, ?, ?, NOW())`,
                [giangvien_id, mon_hoc_id || null, so_cau_goi_y]
            );
        },

        cleanExpiredSuggestions: async () => {
            try {
                await dbPromise.query(`DELETE FROM ai_suggestion_sessions WHERE expires_at < NOW()`);
            } catch (err) {
                console.error('[Repo] Lỗi dọn dẹp TTL ai_suggestion_sessions:', err.message);
            }
        },

        // 3. Knowledge Graph Cache (tiết kiệm token)
        getKnowledgeGraphByDocument: async (documentId) => {
            try {
                const [rows] = await dbPromise.query(
                    `SELECT kg_json FROM document_knowledge_graph WHERE document_id = ?`,
                    [documentId]
                );
                if (rows.length === 0) return null;
                const raw = rows[0].kg_json;
                return typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (err) {
                if (err.code === 'ER_NO_SUCH_TABLE') return null;
                console.error('[Repo] getKnowledgeGraphByDocument error:', err.message);
                return null;
            }
        },

        saveKnowledgeGraph: async (documentId, kg) => {
            try {
                const kgJson = typeof kg === 'string' ? kg : JSON.stringify(kg);
                await dbPromise.query(
                    `INSERT INTO document_knowledge_graph (document_id, kg_json)
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE kg_json = VALUES(kg_json)`,
                    [documentId, kgJson]
                );
            } catch (err) {
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.warn('[Repo] document_knowledge_graph chưa tồn tại');
                    return;
                }
                console.error('[Repo] saveKnowledgeGraph error:', err.message);
            }
        },

        // 4. Kiểm tra câu hỏi trong Ngân hàng chính thức (dùng cho hậu kiểm AI Content Validator)
        getBankQuestionsBySubject: async (ma_mon_hoc) => {
            const [rows] = await dbPromise.query(
                `SELECT q.noi_dung FROM questions q
                 JOIN question_banks b ON q.bank_id = b.id
                 WHERE b.ma_mon_hoc = ? AND q.trang_thai = 'Approved'`,
                [ma_mon_hoc]
            );
            return rows;
        },

        // 5. Quản lý Ngân hàng câu hỏi chính thức (tương thích ExamManagement)
        getTeacherQuestionBanks: async (ma_giang_vien) => {
            await dbPromise.query(`UPDATE question_banks SET tieu_de = REGEXP_REPLACE(tieu_de, ' \\\\((Phiên|Đề) #[0-9]+\\\\)$', '') WHERE tieu_de REGEXP ' \\\\((Phiên|Đề) #[0-9]+\\\\)$'`).catch(()=>{});

            await dbPromise.query(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_banks' AND COLUMN_NAME = 'ma_lop_hoc_phan'
            `).then(async ([cols]) => {
                if (cols.length === 0) {
                    await dbPromise.query(`ALTER TABLE question_banks ADD COLUMN ma_lop_hoc_phan VARCHAR(255) NULL`);
                }
            }).catch(()=>{});

            const [rows] = await dbPromise.query(
                `SELECT b.*, m.TenMonHoc
                 FROM question_banks b
                 JOIN monhoc m ON b.ma_mon_hoc = m.MaMonHoc
                 WHERE b.ma_giang_vien = ? 
                 ORDER BY b.created_at DESC`,
                [ma_giang_vien]
            );
            return rows;
        },

        getBankQuestions: async (bankId) => {
            const [qs] = await dbPromise.query(`SELECT id, chu_de, noi_dung, giai_thich, do_kho, trang_thai, ai_generated, nguon FROM questions WHERE bank_id = ? ORDER BY id ASC`, [bankId]);
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

                const [qs] = await connection.query(`SELECT id FROM questions WHERE bank_id = ?`, [bankId]);
                for (const q of qs) {
                    await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [q.id]);
                }
                await connection.query(`DELETE FROM questions WHERE bank_id = ?`, [bankId]);
                await connection.query(`DELETE FROM question_banks WHERE id = ?`, [bankId]);

                const [maxB] = await connection.query(`SELECT MAX(id) as maxId FROM question_banks`);
                await connection.query(`ALTER TABLE question_banks AUTO_INCREMENT = ${(maxB[0].maxId || 0) + 1}`).catch(()=>{});

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

        createOfficialBank: async ({ ma_mon_hoc, ma_giang_vien, tieu_de, ma_lop_hoc_phan, questions = [] }) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                const [res] = await connection.query(
                    `INSERT INTO question_banks (ma_mon_hoc, ma_giang_vien, tieu_de, ma_lop_hoc_phan, tong_so_cau, trang_thai, created_at)
                     VALUES (?, ?, ?, ?, 0, 'Approved', NOW())`,
                    [ma_mon_hoc, ma_giang_vien, tieu_de, ma_lop_hoc_phan || null]
                );
                const bankId = res.insertId;

                let addedCount = 0;
                if (questions && Array.isArray(questions) && questions.length > 0) {
                    for (const q of questions) {
                        const [qRes] = await connection.query(
                            `INSERT INTO questions (bank_id, chu_de, noi_dung, giai_thich, do_kho, ai_generated, trang_thai, created_at, nguon, creator_id)
                             VALUES (?, ?, ?, ?, ?, 0, 'Approved', NOW(), ?, ?)`,
                            [
                                bankId,
                                q.chu_de || 'Chung',
                                q.noi_dung || q.cauhoi || '',
                                q.giai_thich || '',
                                q.do_kho || 'Medium',
                                q.nguon || 'GV',
                                ma_giang_vien || null
                            ]
                        );
                        const qId = qRes.insertId;
                        const opts = q.options || [];
                        for (const opt of opts) {
                            await connection.query(
                                `INSERT INTO question_options (question_id, noi_dung, la_dap_an_dung)
                                 VALUES (?, ?, ?)`,
                                [qId, opt.text || opt.noi_dung || '', (opt.is_correct || opt.la_dap_an_dung) ? 1 : 0]
                            );
                        }
                        addedCount++;
                    }
                    if (addedCount > 0) {
                        await connection.query(
                            `UPDATE question_banks SET tong_so_cau = ? WHERE id = ?`,
                            [addedCount, bankId]
                        );
                    }
                }

                await connection.commit();
                return { id: bankId, ma_mon_hoc, ma_giang_vien, tieu_de, ma_lop_hoc_phan, tong_so_cau: addedCount, trang_thai: 'Approved' };
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        },

        addQuestionToBank: async (bankId, { chu_de, noi_dung, giai_thich, do_kho, options, nguon, creator_id, ai_generated }) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                const isAi = (ai_generated || nguon === 'AI' || nguon === 'AI Gợi ý' || String(nguon).includes('AI')) ? 1 : 0;
                const sourceText = isAi ? 'AI Gợi ý' : (nguon || 'GV');

                if (isAi) {
                    const [countRes] = await connection.query(
                        `SELECT COUNT(*) as count FROM questions WHERE bank_id = ? AND (ai_generated = 1 OR nguon LIKE '%AI%') AND trang_thai = 'Approved'`,
                        [bankId]
                    );
                    if ((countRes[0]?.count || 0) >= 10) {
                        const err = new Error('Mỗi Ngân hàng/Bộ đề chỉ được phép sử dụng tối đa 10 câu hỏi do AI gợi ý.');
                        err.statusCode = 400;
                        throw err;
                    }
                }

                const [res] = await connection.query(
                    `INSERT INTO questions (bank_id, chu_de, noi_dung, giai_thich, do_kho, ai_generated, trang_thai, created_at, nguon, creator_id)
                     VALUES (?, ?, ?, ?, ?, ?, 'Approved', NOW(), ?, ?)`,
                    [bankId, chu_de || 'Chung', noi_dung, giai_thich || '', do_kho || 'Medium', isAi, sourceText, creator_id || null]
                );
                const qId = res.insertId;

                if (options && Array.isArray(options)) {
                    for (const opt of options) {
                        await connection.query(
                            `INSERT INTO question_options (question_id, noi_dung, la_dap_an_dung)
                             VALUES (?, ?, ?)`,
                            [qId, opt.text || opt.noi_dung, (opt.is_correct || opt.la_dap_an_dung) ? 1 : 0]
                        );
                    }
                }

                await connection.query(
                    `UPDATE question_banks SET tong_so_cau = (SELECT COUNT(*) FROM questions WHERE bank_id = ? AND trang_thai = 'Approved') WHERE id = ?`,
                    [bankId, bankId]
                );

                await connection.commit();
                return qId;
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        },

        addQuestionsBatchToBank: async (bankId, questions = [], creator_id = null) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

                const incomingAiCount = (questions || []).filter(q => q.ai_generated || q.nguon === 'AI' || q.nguon === 'AI Gợi ý' || String(q.nguon).includes('AI')).length;
                if (incomingAiCount > 0) {
                    const [countRes] = await connection.query(
                        `SELECT COUNT(*) as count FROM questions WHERE bank_id = ? AND (ai_generated = 1 OR nguon LIKE '%AI%') AND trang_thai = 'Approved'`,
                        [bankId]
                    );
                    const existingAi = countRes[0]?.count || 0;
                    if (existingAi + incomingAiCount > 10) {
                        const err = new Error(`Mỗi Ngân hàng/Bộ đề chỉ được phép sử dụng tối đa 10 câu hỏi do AI gợi ý. Ngân hàng này đã có ${existingAi} câu AI (chỉ có thể thêm tối đa ${Math.max(0, 10 - existingAi)} câu AI nữa).`);
                        err.statusCode = 400;
                        throw err;
                    }
                }

                let addedIds = [];
                if (questions && Array.isArray(questions)) {
                    for (const q of questions) {
                        const isAi = (q.ai_generated || q.nguon === 'AI' || q.nguon === 'AI Gợi ý' || String(q.nguon).includes('AI')) ? 1 : 0;
                        const sourceText = isAi ? 'AI Gợi ý' : (q.nguon || 'GV');

                        const [res] = await connection.query(
                            `INSERT INTO questions (bank_id, chu_de, noi_dung, giai_thich, do_kho, ai_generated, trang_thai, created_at, nguon, creator_id)
                             VALUES (?, ?, ?, ?, ?, ?, 'Approved', NOW(), ?, ?)`,
                            [
                                bankId,
                                q.chu_de || 'Chung',
                                q.noi_dung || q.cauhoi || '',
                                q.giai_thich || '',
                                q.do_kho || 'Medium',
                                isAi,
                                sourceText,
                                creator_id || null
                            ]
                        );
                        const qId = res.insertId;
                        addedIds.push(qId);

                        const opts = q.options || [];
                        for (const opt of opts) {
                            await connection.query(
                                `INSERT INTO question_options (question_id, noi_dung, la_dap_an_dung)
                                 VALUES (?, ?, ?)`,
                                [qId, opt.text || opt.noi_dung || '', (opt.is_correct || opt.la_dap_an_dung) ? 1 : 0]
                            );
                        }
                    }
                }

                await connection.query(
                    `UPDATE question_banks SET tong_so_cau = (SELECT COUNT(*) FROM questions WHERE bank_id = ? AND trang_thai = 'Approved') WHERE id = ?`,
                    [bankId, bankId]
                );

                await connection.commit();
                return addedIds;
            } catch (error) {
                if (connection) await connection.rollback();
                throw error;
            } finally {
                if (connection) connection.release();
            }
        },

        updateQuestion: async (id, { noi_dung, giai_thich, do_kho, chu_de, options }) => {
            let connection;
            try {
                connection = await dbPromise.getConnection();
                await connection.beginTransaction();

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
                    throw new Error('Không tìm thấy câu hỏi chính thức để chỉnh sửa');
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

                const [prodQ] = await connection.query(`SELECT id, bank_id FROM questions WHERE id = ?`, [id]);
                if (prodQ.length > 0) {
                    await connection.query(`DELETE FROM question_options WHERE question_id = ?`, [id]);
                    await connection.query(`DELETE FROM questions WHERE id = ?`, [id]);
                    if (prodQ[0].bank_id) {
                        await connection.query(`UPDATE question_banks SET tong_so_cau = (SELECT COUNT(*) FROM questions WHERE bank_id = ? AND trang_thai = 'Approved') WHERE id = ?`, [prodQ[0].bank_id, prodQ[0].bank_id]);
                    }
                } else {
                    throw new Error('Không tìm thấy câu hỏi để xóa');
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
