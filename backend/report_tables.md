### Danh sách C — API có lỗ hổng IDOR (Sử dụng URL params định danh)

| # | Method | Route | File | Line | Lỗi |
|---|--------|-------|------|------|------|
| 1 | GET | /api/sinhvien/:mssv/tong-quan | server.js | 790 | IDOR |
| 2 | PUT | /api/users/:taiKhoan | server.js | 818 | IDOR |
| 3 | DELETE | /api/users/:taiKhoan | server.js | 831 | IDOR |
| 4 | PUT | /api/users/:taiKhoan/reset-password | server.js | 832 | IDOR |
| 5 | PUT | /api/users/:taiKhoan/status | server.js | 843 | IDOR |
| 6 | PUT | /api/students/:mssv | server.js | 1028 | IDOR |
| 7 | DELETE | /api/students/:mssv | server.js | 1203 | IDOR |
| 8 | PUT | /api/students/:mssv/clear-uid | server.js | 1214 | IDOR |
| 9 | GET | /api/students/next-code/:maLop | server.js | 1221 | IDOR |
| 10 | GET | /api/students/:mssv/details | server.js | 1256 | IDOR |
| 11 | GET | /api/students/:mssv/schedule | server.js | 1257 | IDOR |
| 12 | GET | /api/teachers/next-code/:maKhoa | server.js | 1268 | IDOR |
| 13 | PUT | /api/teachers/:maGV | server.js | 1290 | IDOR |
| 14 | DELETE | /api/teachers/:maGV | server.js | 1336 | IDOR |
| 15 | GET | /api/teachers/:maGV/details | server.js | 1338 | IDOR |
| 16 | GET | /api/teachers/:maGV/teaching-schedule | server.js | 1339 | IDOR |
| 17 | GET | /api/teachers/:maGV/teaching-load | server.js | 1340 | IDOR |
| 18 | GET | /api/teachers/:maGV/subjects | server.js | 1341 | IDOR |
| 19 | PUT | /api/faculties/:maKhoa | server.js | 1346 | IDOR |
| 20 | DELETE | /api/faculties/:maKhoa | server.js | 1377 | IDOR |
| 21 | GET | /api/faculties/:maKhoa/teachers | server.js | 1378 | IDOR |
| 22 | GET | /api/faculties/:maKhoa/students | server.js | 1379 | IDOR |
| 23 | GET | /api/faculties/:maKhoa/classes | server.js | 1380 | IDOR |
| 24 | GET | /api/subjects/next-code/:maKhoa | server.js | 1384 | IDOR |
| 25 | DELETE | /api/subjects/:maMH | server.js | 1406 | IDOR |
| 26 | GET | /api/subjects/:maMH/classes | server.js | 1407 | IDOR |
| 27 | GET | /api/subjects/:maMH/teachers | server.js | 1408 | IDOR |
| 28 | GET | /api/subjects/:maMH/grade-stats | server.js | 1409 | IDOR |
| 29 | GET | /api/classes/next-code/:startYear/:maKhoa | server.js | 1426 | IDOR |
| 30 | GET | /api/classes/next-name/:tenLop/:maKhoa/:nienKhoa | server.js | 1437 | IDOR |
| 31 | PUT | /api/classes/:maLop | server.js | 1485 | IDOR |
| 32 | DELETE | /api/classes/:maLop | server.js | 1489 | IDOR |
| 33 | GET | /api/classes/:maLop/details | server.js | 1490 | IDOR |
| 34 | GET | /api/classes/:maLop/students | server.js | 1511 | IDOR |
| 35 | GET | /api/classes/:maLop/schedule | server.js | 1512 | IDOR |
| 36 | GET | /api/classes/:maLop/grade-stats | server.js | 1513 | IDOR |
| 37 | GET | /api/lophocphan/teacher/:maGV | server.js | 1535 | IDOR |
| 38 | GET | /api/course-sections/teacher/:maGV | server.js | 1536 | IDOR |
| 39 | GET | /api/course-sections/:maLhp/students | server.js | 1537 | IDOR |
| 40 | PUT | /api/teaching-assignments/:id/toggle-lock | server.js | 1612 | IDOR |
| 41 | PUT | /api/teaching-assignments/:id | server.js | 1628 | IDOR |
| 42 | DELETE | /api/teaching-assignments/:id | server.js | 1676 | IDOR |
| 43 | GET | /api/enrollment/available/:mssv | server.js | 1727 | IDOR |
| 44 | GET | /api/enrollment/my-courses/:mssv | server.js | 1831 | IDOR |
| 45 | DELETE | /api/enrollment/phases/:id | server.js | 2071 | IDOR |
| 46 | DELETE | /api/enrollment/:mssv/:maLhp | server.js | 2085 | IDOR |
| 47 | POST | /api/enrollment/:mssv/:maLhp/xac-nhan-thanh-toan | server.js | 2139 | IDOR |
| 48 | POST | /api/enrollment/:mssv/:maLhp/tu-choi-thanh-toan | server.js | 2172 | IDOR |
| 49 | POST | /api/enrollment/phases/:id/auto-huy-qua-han | server.js | 2183 | IDOR |
| 50 | GET | /api/enrollment/phases/:id/thong-ke | server.js | 2220 | IDOR |
| 51 | PUT | /api/enrollment/phases/:id | server.js | 2304 | IDOR |
| 52 | POST | /api/enrollment/phases/:id/close | server.js | 2346 | IDOR |
| 53 | GET | /student/tuitions/:maSinhVien | server.js | 2423 | IDOR |
| 54 | GET | /api/students/:mssv/schedule | server.js | 2503 | IDOR |
| 55 | GET | /api/schedule/student/:mssv | server.js | 2525 | IDOR |
| 56 | PUT | /api/schedules/:maLichHoc | server.js | 2564 | IDOR |
| 57 | DELETE | /api/schedules/:maLichHoc | server.js | 2587 | IDOR |
| 58 | DELETE | /api/schedules/lophocphan/:maLHP | server.js | 2591 | IDOR |
| 59 | PUT | /api/schedules/lophocphan/:maLHP/reschedule | server.js | 2602 | IDOR |
| 60 | PUT | /api/admin/tuitions/:id/status | server.js | 2717 | IDOR |
| 61 | GET | /api/grades/student/:mssv | server.js | 2731 | IDOR |
| 62 | PUT | /api/grades/:maDiem | server.js | 2745 | IDOR |
| 63 | DELETE | /api/grades/:maDiem | server.js | 2746 | IDOR |
| 64 | GET | /api/grades/statistics/:maLopHocPhan | server.js | 2748 | IDOR |
| 65 | GET | /api/grades/class-averages/:hocKy | server.js | 2759 | IDOR |
| 66 | GET | /api/academic/gpa/:mssv | server.js | 2771 | IDOR |
| 67 | GET | /api/academic/transcript/:mssv | server.js | 2786 | IDOR |
| 68 | PUT | /api/attendance/:id | server.js | 2803 | IDOR |
| 69 | DELETE | /api/attendance/:id | server.js | 2804 | IDOR |
| 70 | GET | /api/attendance/course/:maLhp/date/:ngay | server.js | 2805 | IDOR |
| 71 | GET | /api/attendance/course/:maLhp/history-dates | server.js | 2821 | IDOR |
| 72 | POST | /api/attendance/course/:maLhp/date/:ngay | server.js | 2822 | IDOR |
| 73 | GET | /api/attendance/course/:id/session/:date | server.js | 2880 | IDOR |
| 74 | POST | /api/attendance/course/:id/open/:date | server.js | 2899 | IDOR |
| 75 | POST | /api/attendance/course/:id/close/:date | server.js | 2922 | IDOR |
| 76 | GET | /api/rfid/:uid | server.js | 3110 | IDOR |
| 77 | GET | /api/attendance/student/:mssv | server.js | 3136 | IDOR |
| 78 | GET | /api/attendance/percentage/:mssv | server.js | 3156 | IDOR |
| 79 | PUT | /api/announcements/:id | server.js | 3189 | IDOR |
| 80 | DELETE | /api/announcements/:id | server.js | 3190 | IDOR |
| 81 | GET | /api/announcements/student/:mssv | server.js | 3191 | IDOR |
| 82 | PUT | /api/admin/training-periods/:id/status | server.js | 3231 | IDOR |
| 83 | PUT | /api/admin/training-points/:id | server.js | 3257 | IDOR |
| 84 | GET | /api/admin/training-points/:id/logs | server.js | 3290 | IDOR |
| 85 | PUT | /api/admin/support-requests/:id | server.js | 3317 | IDOR |
| 86 | DELETE | /api/admin/support-requests/:id | server.js | 3322 | IDOR |
| 87 | GET | /api/training-points/:id/details | server.js | 3327 | IDOR |
| 88 | GET | /api/training-points/student/:mssv | server.js | 3333 | IDOR |
| 89 | PUT | /api/training-points/:id | server.js | 3381 | IDOR |
| 90 | GET | /api/support/student/:mssv | server.js | 3411 | IDOR |
| 91 | GET | /api/support/teacher/:maGV | server.js | 3423 | IDOR |
| 92 | GET | /documents/teacher/:ma_giang_vien | ai-exam/routes.js | 24 | IDOR |
| 93 | POST | /sessions/:id/resume | ai-exam/routes.js | 27 | IDOR |
| 94 | GET | /sessions/teacher/:ma_giang_vien | ai-exam/routes.js | 28 | IDOR |
| 95 | GET | /sessions/:id/questions | ai-exam/routes.js | 30 | IDOR |
| 96 | PUT | /questions/:id/status | ai-exam/routes.js | 31 | IDOR |
| 97 | PUT | /questions/:id | ai-exam/routes.js | 32 | IDOR |
| 98 | POST | /sessions/:id/approve-all | ai-exam/routes.js | 33 | IDOR |
| 99 | DELETE | /questions/:id | ai-exam/routes.js | 34 | IDOR |
| 100 | GET | /banks/teacher/:ma_giang_vien | ai-exam/routes.js | 37 | IDOR |
| 101 | GET | /banks/:id/questions | ai-exam/routes.js | 38 | IDOR |
| 102 | DELETE | /banks/:id | ai-exam/routes.js | 39 | IDOR |
| 103 | PUT | /banks/:id | ai-exam/routes.js | 40 | IDOR |
| 104 | GET | /exams/teacher/:ma_giang_vien | ai-exam/routes.js | 59 | IDOR |
| 105 | GET | /exams/student/:mssv | ai-exam/routes.js | 76 | IDOR |
| 106 | POST | /exams/:exam_id/start | ai-exam/routes.js | 94 | IDOR |
| 107 | GET | /exams/history/student/:mssv | ai-exam/routes.js | 215 | IDOR |
| 108 | DELETE | /exams/:id | ai-exam/routes.js | 233 | IDOR |
| 109 | PUT | /exams/:id | ai-exam/routes.js | 245 | IDOR |
| 110 | GET | /exams/:id/results | ai-exam/routes.js | 263 | IDOR |
| 111 | GET | /attempts/:attempt_id/details | ai-exam/routes.js | 295 | IDOR |


### Danh sách A — API thiếu Authentication (Không có verifyToken)

| # | Method | Route | File | Line | Lỗi |
|---|--------|-------|------|------|------|
| 1 | GET | /api/health | server.js | 27 | Thiếu Authentication |
| 2 | POST | /api/login | server.js | 268 | Thiếu Authentication |
| 3 | POST | /api/forgot-password | server.js | 402 | Thiếu Authentication |
| 4 | POST | /api/student/change-password | server.js | 577 | Thiếu Authentication |
| 5 | POST | /api/teacher/change-password | server.js | 623 | Thiếu Authentication |
| 6 | POST | /api/reset-password | server.js | 680 | Thiếu Authentication |
| 7 | GET | /api/dashboard/stats | server.js | 736 | Thiếu Authentication |
| 8 | GET | /api/dashboard/stats-by-faculty | server.js | 748 | Thiếu Authentication |
| 9 | GET | /api/dashboard/academic-standing | server.js | 753 | Thiếu Authentication |
| 10 | GET | /api/dashboard/attendance-stats | server.js | 772 | Thiếu Authentication |
| 11 | GET | /api/dashboard/recent-students | server.js | 781 | Thiếu Authentication |
| 12 | GET | /api/dashboard/lecturer-workload | server.js | 785 | Thiếu Authentication |
| 13 | GET | /api/sinhvien/:mssv/tong-quan | server.js | 790 | Thiếu Authentication |
| 14 | GET | /api/users | server.js | 793 | Thiếu Authentication |
| 15 | GET | /api/roles | server.js | 808 | Thiếu Authentication |
| 16 | POST | /api/users | server.js | 809 | Thiếu Authentication |
| 17 | PUT | /api/users/:taiKhoan | server.js | 818 | Thiếu Authentication |
| 18 | DELETE | /api/users/:taiKhoan | server.js | 831 | Thiếu Authentication |
| 19 | PUT | /api/users/:taiKhoan/reset-password | server.js | 832 | Thiếu Authentication |
| 20 | PUT | /api/users/:taiKhoan/status | server.js | 843 | Thiếu Authentication |
| 21 | GET | /api/students | server.js | 851 | Thiếu Authentication |
| 22 | POST | /api/students | server.js | 878 | Thiếu Authentication |
| 23 | PUT | /api/students/:mssv | server.js | 1028 | Thiếu Authentication |
| 24 | DELETE | /api/students/:mssv | server.js | 1203 | Thiếu Authentication |
| 25 | PUT | /api/students/:mssv/clear-uid | server.js | 1214 | Thiếu Authentication |
| 26 | GET | /api/students/next-code/:maLop | server.js | 1221 | Thiếu Authentication |
| 27 | GET | /api/students/:mssv/details | server.js | 1256 | Thiếu Authentication |
| 28 | GET | /api/students/:mssv/schedule | server.js | 1257 | Thiếu Authentication |
| 29 | GET | /api/teachers | server.js | 1267 | Thiếu Authentication |
| 30 | GET | /api/teachers/next-code/:maKhoa | server.js | 1268 | Thiếu Authentication |
| 31 | POST | /api/teachers | server.js | 1277 | Thiếu Authentication |
| 32 | PUT | /api/teachers/:maGV | server.js | 1290 | Thiếu Authentication |
| 33 | DELETE | /api/teachers/:maGV | server.js | 1336 | Thiếu Authentication |
| 34 | GET | /api/teachers/:maGV/details | server.js | 1338 | Thiếu Authentication |
| 35 | GET | /api/teachers/:maGV/teaching-schedule | server.js | 1339 | Thiếu Authentication |
| 36 | GET | /api/teachers/:maGV/teaching-load | server.js | 1340 | Thiếu Authentication |
| 37 | GET | /api/teachers/:maGV/subjects | server.js | 1341 | Thiếu Authentication |
| 38 | GET | /api/faculties | server.js | 1344 | Thiếu Authentication |
| 39 | POST | /api/faculties | server.js | 1345 | Thiếu Authentication |
| 40 | PUT | /api/faculties/:maKhoa | server.js | 1346 | Thiếu Authentication |
| 41 | DELETE | /api/faculties/:maKhoa | server.js | 1377 | Thiếu Authentication |
| 42 | GET | /api/faculties/:maKhoa/teachers | server.js | 1378 | Thiếu Authentication |
| 43 | GET | /api/faculties/:maKhoa/students | server.js | 1379 | Thiếu Authentication |
| 44 | GET | /api/faculties/:maKhoa/classes | server.js | 1380 | Thiếu Authentication |
| 45 | GET | /api/subjects | server.js | 1383 | Thiếu Authentication |
| 46 | GET | /api/subjects/next-code/:maKhoa | server.js | 1384 | Thiếu Authentication |
| 47 | POST | /api/subjects | server.js | 1394 | Thiếu Authentication |
| 48 | DELETE | /api/subjects/:maMH | server.js | 1406 | Thiếu Authentication |
| 49 | GET | /api/subjects/:maMH/classes | server.js | 1407 | Thiếu Authentication |
| 50 | GET | /api/subjects/:maMH/teachers | server.js | 1408 | Thiếu Authentication |
| 51 | GET | /api/subjects/:maMH/grade-stats | server.js | 1409 | Thiếu Authentication |
| 52 | GET | /api/classes | server.js | 1425 | Thiếu Authentication |
| 53 | GET | /api/classes/next-code/:startYear/:maKhoa | server.js | 1426 | Thiếu Authentication |
| 54 | GET | /api/classes/next-name/:tenLop/:maKhoa/:nienKhoa | server.js | 1437 | Thiếu Authentication |
| 55 | POST | /api/classes | server.js | 1481 | Thiếu Authentication |
| 56 | PUT | /api/classes/:maLop | server.js | 1485 | Thiếu Authentication |
| 57 | DELETE | /api/classes/:maLop | server.js | 1489 | Thiếu Authentication |
| 58 | GET | /api/classes/:maLop/details | server.js | 1490 | Thiếu Authentication |
| 59 | GET | /api/classes/:maLop/students | server.js | 1511 | Thiếu Authentication |
| 60 | GET | /api/classes/:maLop/schedule | server.js | 1512 | Thiếu Authentication |
| 61 | GET | /api/classes/:maLop/grade-stats | server.js | 1513 | Thiếu Authentication |
| 62 | GET | /api/teaching-assignments | server.js | 1519 | Thiếu Authentication |
| 63 | GET | /api/lophocphan/teacher/:maGV | server.js | 1535 | Thiếu Authentication |
| 64 | GET | /api/course-sections/teacher/:maGV | server.js | 1536 | Thiếu Authentication |
| 65 | GET | /api/course-sections/:maLhp/students | server.js | 1537 | Thiếu Authentication |
| 66 | GET | /api/course-sections | server.js | 1539 | Thiếu Authentication |
| 67 | POST | /api/teaching-assignments | server.js | 1562 | Thiếu Authentication |
| 68 | PUT | /api/teaching-assignments/:id/toggle-lock | server.js | 1612 | Thiếu Authentication |
| 69 | PUT | /api/teaching-assignments/:id | server.js | 1628 | Thiếu Authentication |
| 70 | DELETE | /api/teaching-assignments/:id | server.js | 1676 | Thiếu Authentication |
| 71 | GET | /api/enrollment/available/:mssv | server.js | 1727 | Thiếu Authentication |
| 72 | GET | /api/enrollment/my-courses/:mssv | server.js | 1831 | Thiếu Authentication |
| 73 | GET | /api/enrollments/all | server.js | 1869 | Thiếu Authentication |
| 74 | POST | /api/enrollment | server.js | 1877 | Thiếu Authentication |
| 75 | POST | /api/enrollment/batch | server.js | 1954 | Thiếu Authentication |
| 76 | DELETE | /api/enrollment/phases/:id | server.js | 2071 | Thiếu Authentication |
| 77 | DELETE | /api/enrollment/:mssv/:maLhp | server.js | 2085 | Thiếu Authentication |
| 78 | POST | /api/enrollment/:mssv/:maLhp/xac-nhan-thanh-toan | server.js | 2139 | Thiếu Authentication |
| 79 | POST | /api/enrollment/:mssv/:maLhp/tu-choi-thanh-toan | server.js | 2172 | Thiếu Authentication |
| 80 | POST | /api/enrollment/phases/:id/auto-huy-qua-han | server.js | 2183 | Thiếu Authentication |
| 81 | GET | /api/enrollment/thong-ke-lop-hoc-phan | server.js | 2194 | Thiếu Authentication |
| 82 | GET | /api/enrollment/phases/:id/thong-ke | server.js | 2220 | Thiếu Authentication |
| 83 | GET | /api/enrollment/phases | server.js | 2248 | Thiếu Authentication |
| 84 | POST | /api/enrollment/phases | server.js | 2267 | Thiếu Authentication |
| 85 | PUT | /api/enrollment/phases/:id | server.js | 2304 | Thiếu Authentication |
| 86 | POST | /api/enrollment/phases/:id/close | server.js | 2346 | Thiếu Authentication |
| 87 | POST | /api/admin/confirm-tuition | server.js | 2367 | Thiếu Authentication |
| 88 | GET | /student/tuitions/:maSinhVien | server.js | 2423 | Thiếu Authentication |
| 89 | POST | /api/dang-ky | server.js | 2454 | Thiếu Authentication |
| 90 | POST | /api/admin/duyet-dang-ky | server.js | 2464 | Thiếu Authentication |
| 91 | GET | /api/schedule-configs | server.js | 2473 | Thiếu Authentication |
| 92 | GET | /api/schedules | server.js | 2482 | Thiếu Authentication |
| 93 | GET | /api/students/:mssv/schedule | server.js | 2503 | Thiếu Authentication |
| 94 | GET | /api/schedule/student/:mssv | server.js | 2525 | Thiếu Authentication |
| 95 | POST | /api/schedules | server.js | 2537 | Thiếu Authentication |
| 96 | PUT | /api/schedules/:maLichHoc | server.js | 2564 | Thiếu Authentication |
| 97 | DELETE | /api/schedules/:maLichHoc | server.js | 2587 | Thiếu Authentication |
| 98 | DELETE | /api/schedules/lophocphan/:maLHP | server.js | 2591 | Thiếu Authentication |
| 99 | PUT | /api/schedules/lophocphan/:maLHP/reschedule | server.js | 2602 | Thiếu Authentication |
| 100 | GET | /api/admin/tuitions | server.js | 2691 | Thiếu Authentication |
| 101 | PUT | /api/admin/tuitions/:id/status | server.js | 2717 | Thiếu Authentication |
| 102 | GET | /api/grades | server.js | 2729 | Thiếu Authentication |
| 103 | GET | /api/grades/student/:mssv | server.js | 2731 | Thiếu Authentication |
| 104 | POST | /api/grades | server.js | 2744 | Thiếu Authentication |
| 105 | PUT | /api/grades/:maDiem | server.js | 2745 | Thiếu Authentication |
| 106 | DELETE | /api/grades/:maDiem | server.js | 2746 | Thiếu Authentication |
| 107 | GET | /api/grades/statistics/:maLopHocPhan | server.js | 2748 | Thiếu Authentication |
| 108 | GET | /api/grades/class-averages/:hocKy | server.js | 2759 | Thiếu Authentication |
| 109 | GET | /api/academic/gpa/:mssv | server.js | 2771 | Thiếu Authentication |
| 110 | GET | /api/academic/transcript/:mssv | server.js | 2786 | Thiếu Authentication |
| 111 | POST | /api/attendance | server.js | 2802 | Thiếu Authentication |
| 112 | PUT | /api/attendance/:id | server.js | 2803 | Thiếu Authentication |
| 113 | DELETE | /api/attendance/:id | server.js | 2804 | Thiếu Authentication |
| 114 | GET | /api/attendance/course/:maLhp/date/:ngay | server.js | 2805 | Thiếu Authentication |
| 115 | GET | /api/attendance/course/:maLhp/history-dates | server.js | 2821 | Thiếu Authentication |
| 116 | POST | /api/attendance/course/:maLhp/date/:ngay | server.js | 2822 | Thiếu Authentication |
| 117 | GET | /api/rfid/status | server.js | 2846 | Thiếu Authentication |
| 118 | POST | /api/rfid/activate-register | server.js | 2856 | Thiếu Authentication |
| 119 | POST | /api/rfid/reset-status | server.js | 2870 | Thiếu Authentication |
| 120 | GET | /api/attendance/course/:id/session/:date | server.js | 2880 | Thiếu Authentication |
| 121 | POST | /api/attendance/course/:id/open/:date | server.js | 2899 | Thiếu Authentication |
| 122 | POST | /api/attendance/course/:id/close/:date | server.js | 2922 | Thiếu Authentication |
| 123 | POST | /api/attendance/uid | server.js | 2966 | Thiếu Authentication |
| 124 | GET | /api/rfid/:uid | server.js | 3110 | Thiếu Authentication |
| 125 | POST | /api/rfid | server.js | 3118 | Thiếu Authentication |
| 126 | GET | /api/attendance/student/:mssv | server.js | 3136 | Thiếu Authentication |
| 127 | GET | /api/attendance/percentage/:mssv | server.js | 3156 | Thiếu Authentication |
| 128 | GET | /api/announcements | server.js | 3187 | Thiếu Authentication |
| 129 | POST | /api/announcements | server.js | 3188 | Thiếu Authentication |
| 130 | PUT | /api/announcements/:id | server.js | 3189 | Thiếu Authentication |
| 131 | DELETE | /api/announcements/:id | server.js | 3190 | Thiếu Authentication |
| 132 | GET | /api/announcements/student/:mssv | server.js | 3191 | Thiếu Authentication |
| 133 | POST | /api/grades/bulk | server.js | 3208 | Thiếu Authentication |
| 134 | POST | /api/attendance/bulk | server.js | 3209 | Thiếu Authentication |
| 135 | GET | /api/admin/training-periods | server.js | 3214 | Thiếu Authentication |
| 136 | POST | /api/admin/training-periods | server.js | 3218 | Thiếu Authentication |
| 137 | PUT | /api/admin/training-periods/:id/status | server.js | 3231 | Thiếu Authentication |
| 138 | GET | /api/training-periods/active | server.js | 3236 | Thiếu Authentication |
| 139 | GET | /api/admin/training-points | server.js | 3245 | Thiếu Authentication |
| 140 | PUT | /api/admin/training-points/:id | server.js | 3257 | Thiếu Authentication |
| 141 | GET | /api/admin/training-points/logs | server.js | 3279 | Thiếu Authentication |
| 142 | GET | /api/admin/training-points/:id/logs | server.js | 3290 | Thiếu Authentication |
| 143 | GET | /api/admin/support-requests | server.js | 3296 | Thiếu Authentication |
| 144 | PUT | /api/admin/support-requests/:id | server.js | 3317 | Thiếu Authentication |
| 145 | DELETE | /api/admin/support-requests/:id | server.js | 3322 | Thiếu Authentication |
| 146 | GET | /api/training-points/:id/details | server.js | 3327 | Thiếu Authentication |
| 147 | GET | /api/training-points/student/:mssv | server.js | 3333 | Thiếu Authentication |
| 148 | POST | /api/training-points | server.js | 3344 | Thiếu Authentication |
| 149 | PUT | /api/training-points/:id | server.js | 3381 | Thiếu Authentication |
| 150 | GET | /api/support/student/:mssv | server.js | 3411 | Thiếu Authentication |
| 151 | POST | /api/support | server.js | 3416 | Thiếu Authentication |
| 152 | GET | /api/support/teacher/:maGV | server.js | 3423 | Thiếu Authentication |
| 153 | POST | /api/support/teacher | server.js | 3428 | Thiếu Authentication |
| 154 | POST | /documents/upload | ai-exam/routes.js | 23 | Thiếu Authentication |
| 155 | GET | /documents/teacher/:ma_giang_vien | ai-exam/routes.js | 24 | Thiếu Authentication |
| 156 | POST | /sessions/start | ai-exam/routes.js | 26 | Thiếu Authentication |
| 157 | POST | /sessions/:id/resume | ai-exam/routes.js | 27 | Thiếu Authentication |
| 158 | GET | /sessions/teacher/:ma_giang_vien | ai-exam/routes.js | 28 | Thiếu Authentication |
| 159 | GET | /sessions/:id/questions | ai-exam/routes.js | 30 | Thiếu Authentication |
| 160 | PUT | /questions/:id/status | ai-exam/routes.js | 31 | Thiếu Authentication |
| 161 | PUT | /questions/:id | ai-exam/routes.js | 32 | Thiếu Authentication |
| 162 | POST | /sessions/:id/approve-all | ai-exam/routes.js | 33 | Thiếu Authentication |
| 163 | DELETE | /questions/:id | ai-exam/routes.js | 34 | Thiếu Authentication |
| 164 | GET | /banks/teacher/:ma_giang_vien | ai-exam/routes.js | 37 | Thiếu Authentication |
| 165 | GET | /banks/:id/questions | ai-exam/routes.js | 38 | Thiếu Authentication |
| 166 | DELETE | /banks/:id | ai-exam/routes.js | 39 | Thiếu Authentication |
| 167 | PUT | /banks/:id | ai-exam/routes.js | 40 | Thiếu Authentication |
| 168 | POST | /exams | ai-exam/routes.js | 43 | Thiếu Authentication |
| 169 | GET | /exams/teacher/:ma_giang_vien | ai-exam/routes.js | 59 | Thiếu Authentication |
| 170 | GET | /exams/student/:mssv | ai-exam/routes.js | 76 | Thiếu Authentication |
| 171 | POST | /exams/:exam_id/start | ai-exam/routes.js | 94 | Thiếu Authentication |
| 172 | POST | /exams/submit | ai-exam/routes.js | 185 | Thiếu Authentication |
| 173 | GET | /exams/history/student/:mssv | ai-exam/routes.js | 215 | Thiếu Authentication |
| 174 | DELETE | /exams/:id | ai-exam/routes.js | 233 | Thiếu Authentication |
| 175 | PUT | /exams/:id | ai-exam/routes.js | 245 | Thiếu Authentication |
| 176 | GET | /exams/:id/results | ai-exam/routes.js | 263 | Thiếu Authentication |
| 177 | GET | /attempts/:attempt_id/details | ai-exam/routes.js | 295 | Thiếu Authentication |


### Danh sách B — API thiếu Authorization (Không có authorizeRole)

| # | Method | Route | File | Line | Lỗi |
|---|--------|-------|------|------|------|
| 1 | GET | /api/health | server.js | 27 | Thiếu Authorization |
| 2 | POST | /api/login | server.js | 268 | Thiếu Authorization |
| 3 | POST | /api/forgot-password | server.js | 402 | Thiếu Authorization |
| 4 | GET | /api/verify-token | server.js | 513 | Thiếu Authorization |
| 5 | POST | /api/users/avatar | server.js | 518 | Thiếu Authorization |
| 6 | POST | /api/change-password | server.js | 530 | Thiếu Authorization |
| 7 | POST | /api/student/change-password | server.js | 577 | Thiếu Authorization |
| 8 | POST | /api/teacher/change-password | server.js | 623 | Thiếu Authorization |
| 9 | POST | /api/reset-password | server.js | 680 | Thiếu Authorization |
| 10 | GET | /api/dashboard/stats | server.js | 736 | Thiếu Authorization |
| 11 | GET | /api/dashboard/stats-by-faculty | server.js | 748 | Thiếu Authorization |
| 12 | GET | /api/dashboard/academic-standing | server.js | 753 | Thiếu Authorization |
| 13 | GET | /api/dashboard/attendance-stats | server.js | 772 | Thiếu Authorization |
| 14 | GET | /api/dashboard/recent-students | server.js | 781 | Thiếu Authorization |
| 15 | GET | /api/dashboard/lecturer-workload | server.js | 785 | Thiếu Authorization |
| 16 | GET | /api/sinhvien/:mssv/tong-quan | server.js | 790 | Thiếu Authorization |
| 17 | GET | /api/users | server.js | 793 | Thiếu Authorization |
| 18 | GET | /api/roles | server.js | 808 | Thiếu Authorization |
| 19 | POST | /api/users | server.js | 809 | Thiếu Authorization |
| 20 | PUT | /api/users/:taiKhoan | server.js | 818 | Thiếu Authorization |
| 21 | DELETE | /api/users/:taiKhoan | server.js | 831 | Thiếu Authorization |
| 22 | PUT | /api/users/:taiKhoan/reset-password | server.js | 832 | Thiếu Authorization |
| 23 | PUT | /api/users/:taiKhoan/status | server.js | 843 | Thiếu Authorization |
| 24 | GET | /api/students | server.js | 851 | Thiếu Authorization |
| 25 | POST | /api/students | server.js | 878 | Thiếu Authorization |
| 26 | PUT | /api/students/:mssv | server.js | 1028 | Thiếu Authorization |
| 27 | DELETE | /api/students/:mssv | server.js | 1203 | Thiếu Authorization |
| 28 | PUT | /api/students/:mssv/clear-uid | server.js | 1214 | Thiếu Authorization |
| 29 | GET | /api/students/next-code/:maLop | server.js | 1221 | Thiếu Authorization |
| 30 | GET | /api/students/:mssv/details | server.js | 1256 | Thiếu Authorization |
| 31 | GET | /api/students/:mssv/schedule | server.js | 1257 | Thiếu Authorization |
| 32 | GET | /api/teachers | server.js | 1267 | Thiếu Authorization |
| 33 | GET | /api/teachers/next-code/:maKhoa | server.js | 1268 | Thiếu Authorization |
| 34 | POST | /api/teachers | server.js | 1277 | Thiếu Authorization |
| 35 | PUT | /api/teachers/:maGV | server.js | 1290 | Thiếu Authorization |
| 36 | DELETE | /api/teachers/:maGV | server.js | 1336 | Thiếu Authorization |
| 37 | GET | /api/teachers/:maGV/details | server.js | 1338 | Thiếu Authorization |
| 38 | GET | /api/teachers/:maGV/teaching-schedule | server.js | 1339 | Thiếu Authorization |
| 39 | GET | /api/teachers/:maGV/teaching-load | server.js | 1340 | Thiếu Authorization |
| 40 | GET | /api/teachers/:maGV/subjects | server.js | 1341 | Thiếu Authorization |
| 41 | GET | /api/faculties | server.js | 1344 | Thiếu Authorization |
| 42 | POST | /api/faculties | server.js | 1345 | Thiếu Authorization |
| 43 | PUT | /api/faculties/:maKhoa | server.js | 1346 | Thiếu Authorization |
| 44 | DELETE | /api/faculties/:maKhoa | server.js | 1377 | Thiếu Authorization |
| 45 | GET | /api/faculties/:maKhoa/teachers | server.js | 1378 | Thiếu Authorization |
| 46 | GET | /api/faculties/:maKhoa/students | server.js | 1379 | Thiếu Authorization |
| 47 | GET | /api/faculties/:maKhoa/classes | server.js | 1380 | Thiếu Authorization |
| 48 | GET | /api/subjects | server.js | 1383 | Thiếu Authorization |
| 49 | GET | /api/subjects/next-code/:maKhoa | server.js | 1384 | Thiếu Authorization |
| 50 | POST | /api/subjects | server.js | 1394 | Thiếu Authorization |
| 51 | DELETE | /api/subjects/:maMH | server.js | 1406 | Thiếu Authorization |
| 52 | GET | /api/subjects/:maMH/classes | server.js | 1407 | Thiếu Authorization |
| 53 | GET | /api/subjects/:maMH/teachers | server.js | 1408 | Thiếu Authorization |
| 54 | GET | /api/subjects/:maMH/grade-stats | server.js | 1409 | Thiếu Authorization |
| 55 | GET | /api/classes | server.js | 1425 | Thiếu Authorization |
| 56 | GET | /api/classes/next-code/:startYear/:maKhoa | server.js | 1426 | Thiếu Authorization |
| 57 | GET | /api/classes/next-name/:tenLop/:maKhoa/:nienKhoa | server.js | 1437 | Thiếu Authorization |
| 58 | POST | /api/classes | server.js | 1481 | Thiếu Authorization |
| 59 | PUT | /api/classes/:maLop | server.js | 1485 | Thiếu Authorization |
| 60 | DELETE | /api/classes/:maLop | server.js | 1489 | Thiếu Authorization |
| 61 | GET | /api/classes/:maLop/details | server.js | 1490 | Thiếu Authorization |
| 62 | GET | /api/classes/:maLop/students | server.js | 1511 | Thiếu Authorization |
| 63 | GET | /api/classes/:maLop/schedule | server.js | 1512 | Thiếu Authorization |
| 64 | GET | /api/classes/:maLop/grade-stats | server.js | 1513 | Thiếu Authorization |
| 65 | GET | /api/teaching-assignments | server.js | 1519 | Thiếu Authorization |
| 66 | GET | /api/lophocphan/teacher/:maGV | server.js | 1535 | Thiếu Authorization |
| 67 | GET | /api/course-sections/teacher/:maGV | server.js | 1536 | Thiếu Authorization |
| 68 | GET | /api/course-sections/:maLhp/students | server.js | 1537 | Thiếu Authorization |
| 69 | GET | /api/course-sections | server.js | 1539 | Thiếu Authorization |
| 70 | POST | /api/teaching-assignments | server.js | 1562 | Thiếu Authorization |
| 71 | PUT | /api/teaching-assignments/:id/toggle-lock | server.js | 1612 | Thiếu Authorization |
| 72 | PUT | /api/teaching-assignments/:id | server.js | 1628 | Thiếu Authorization |
| 73 | DELETE | /api/teaching-assignments/:id | server.js | 1676 | Thiếu Authorization |
| 74 | GET | /api/enrollment/available/:mssv | server.js | 1727 | Thiếu Authorization |
| 75 | GET | /api/enrollment/my-courses/:mssv | server.js | 1831 | Thiếu Authorization |
| 76 | GET | /api/enrollments/all | server.js | 1869 | Thiếu Authorization |
| 77 | POST | /api/enrollment | server.js | 1877 | Thiếu Authorization |
| 78 | POST | /api/enrollment/batch | server.js | 1954 | Thiếu Authorization |
| 79 | DELETE | /api/enrollment/phases/:id | server.js | 2071 | Thiếu Authorization |
| 80 | DELETE | /api/enrollment/:mssv/:maLhp | server.js | 2085 | Thiếu Authorization |
| 81 | POST | /api/enrollment/:mssv/:maLhp/xac-nhan-thanh-toan | server.js | 2139 | Thiếu Authorization |
| 82 | POST | /api/enrollment/:mssv/:maLhp/tu-choi-thanh-toan | server.js | 2172 | Thiếu Authorization |
| 83 | POST | /api/enrollment/phases/:id/auto-huy-qua-han | server.js | 2183 | Thiếu Authorization |
| 84 | GET | /api/enrollment/thong-ke-lop-hoc-phan | server.js | 2194 | Thiếu Authorization |
| 85 | GET | /api/enrollment/phases/:id/thong-ke | server.js | 2220 | Thiếu Authorization |
| 86 | GET | /api/enrollment/phases | server.js | 2248 | Thiếu Authorization |
| 87 | POST | /api/enrollment/phases | server.js | 2267 | Thiếu Authorization |
| 88 | PUT | /api/enrollment/phases/:id | server.js | 2304 | Thiếu Authorization |
| 89 | POST | /api/enrollment/phases/:id/close | server.js | 2346 | Thiếu Authorization |
| 90 | POST | /api/admin/confirm-tuition | server.js | 2367 | Thiếu Authorization |
| 91 | GET | /student/tuitions/:maSinhVien | server.js | 2423 | Thiếu Authorization |
| 92 | POST | /api/dang-ky | server.js | 2454 | Thiếu Authorization |
| 93 | POST | /api/admin/duyet-dang-ky | server.js | 2464 | Thiếu Authorization |
| 94 | GET | /api/schedule-configs | server.js | 2473 | Thiếu Authorization |
| 95 | GET | /api/schedules | server.js | 2482 | Thiếu Authorization |
| 96 | GET | /api/students/:mssv/schedule | server.js | 2503 | Thiếu Authorization |
| 97 | GET | /api/schedule/student/:mssv | server.js | 2525 | Thiếu Authorization |
| 98 | POST | /api/schedules | server.js | 2537 | Thiếu Authorization |
| 99 | PUT | /api/schedules/:maLichHoc | server.js | 2564 | Thiếu Authorization |
| 100 | DELETE | /api/schedules/:maLichHoc | server.js | 2587 | Thiếu Authorization |
| 101 | DELETE | /api/schedules/lophocphan/:maLHP | server.js | 2591 | Thiếu Authorization |
| 102 | PUT | /api/schedules/lophocphan/:maLHP/reschedule | server.js | 2602 | Thiếu Authorization |
| 103 | GET | /api/admin/tuitions | server.js | 2691 | Thiếu Authorization |
| 104 | PUT | /api/admin/tuitions/:id/status | server.js | 2717 | Thiếu Authorization |
| 105 | GET | /api/grades | server.js | 2729 | Thiếu Authorization |
| 106 | GET | /api/grades/student/:mssv | server.js | 2731 | Thiếu Authorization |
| 107 | POST | /api/grades | server.js | 2744 | Thiếu Authorization |
| 108 | PUT | /api/grades/:maDiem | server.js | 2745 | Thiếu Authorization |
| 109 | DELETE | /api/grades/:maDiem | server.js | 2746 | Thiếu Authorization |
| 110 | GET | /api/grades/statistics/:maLopHocPhan | server.js | 2748 | Thiếu Authorization |
| 111 | GET | /api/grades/class-averages/:hocKy | server.js | 2759 | Thiếu Authorization |
| 112 | GET | /api/academic/gpa/:mssv | server.js | 2771 | Thiếu Authorization |
| 113 | GET | /api/academic/transcript/:mssv | server.js | 2786 | Thiếu Authorization |
| 114 | POST | /api/attendance | server.js | 2802 | Thiếu Authorization |
| 115 | PUT | /api/attendance/:id | server.js | 2803 | Thiếu Authorization |
| 116 | DELETE | /api/attendance/:id | server.js | 2804 | Thiếu Authorization |
| 117 | GET | /api/attendance/course/:maLhp/date/:ngay | server.js | 2805 | Thiếu Authorization |
| 118 | GET | /api/attendance/course/:maLhp/history-dates | server.js | 2821 | Thiếu Authorization |
| 119 | POST | /api/attendance/course/:maLhp/date/:ngay | server.js | 2822 | Thiếu Authorization |
| 120 | GET | /api/rfid/status | server.js | 2846 | Thiếu Authorization |
| 121 | POST | /api/rfid/activate-register | server.js | 2856 | Thiếu Authorization |
| 122 | POST | /api/rfid/reset-status | server.js | 2870 | Thiếu Authorization |
| 123 | GET | /api/attendance/course/:id/session/:date | server.js | 2880 | Thiếu Authorization |
| 124 | POST | /api/attendance/course/:id/open/:date | server.js | 2899 | Thiếu Authorization |
| 125 | POST | /api/attendance/course/:id/close/:date | server.js | 2922 | Thiếu Authorization |
| 126 | POST | /api/attendance/uid | server.js | 2966 | Thiếu Authorization |
| 127 | GET | /api/rfid/:uid | server.js | 3110 | Thiếu Authorization |
| 128 | POST | /api/rfid | server.js | 3118 | Thiếu Authorization |
| 129 | GET | /api/attendance/student/:mssv | server.js | 3136 | Thiếu Authorization |
| 130 | GET | /api/attendance/percentage/:mssv | server.js | 3156 | Thiếu Authorization |
| 131 | GET | /api/announcements | server.js | 3187 | Thiếu Authorization |
| 132 | POST | /api/announcements | server.js | 3188 | Thiếu Authorization |
| 133 | PUT | /api/announcements/:id | server.js | 3189 | Thiếu Authorization |
| 134 | DELETE | /api/announcements/:id | server.js | 3190 | Thiếu Authorization |
| 135 | GET | /api/announcements/student/:mssv | server.js | 3191 | Thiếu Authorization |
| 136 | POST | /api/grades/bulk | server.js | 3208 | Thiếu Authorization |
| 137 | POST | /api/attendance/bulk | server.js | 3209 | Thiếu Authorization |
| 138 | GET | /api/admin/training-periods | server.js | 3214 | Thiếu Authorization |
| 139 | POST | /api/admin/training-periods | server.js | 3218 | Thiếu Authorization |
| 140 | PUT | /api/admin/training-periods/:id/status | server.js | 3231 | Thiếu Authorization |
| 141 | GET | /api/training-periods/active | server.js | 3236 | Thiếu Authorization |
| 142 | GET | /api/admin/training-points | server.js | 3245 | Thiếu Authorization |
| 143 | PUT | /api/admin/training-points/:id | server.js | 3257 | Thiếu Authorization |
| 144 | GET | /api/admin/training-points/logs | server.js | 3279 | Thiếu Authorization |
| 145 | GET | /api/admin/training-points/:id/logs | server.js | 3290 | Thiếu Authorization |
| 146 | GET | /api/admin/support-requests | server.js | 3296 | Thiếu Authorization |
| 147 | PUT | /api/admin/support-requests/:id | server.js | 3317 | Thiếu Authorization |
| 148 | DELETE | /api/admin/support-requests/:id | server.js | 3322 | Thiếu Authorization |
| 149 | GET | /api/training-points/:id/details | server.js | 3327 | Thiếu Authorization |
| 150 | GET | /api/training-points/student/:mssv | server.js | 3333 | Thiếu Authorization |
| 151 | POST | /api/training-points | server.js | 3344 | Thiếu Authorization |
| 152 | PUT | /api/training-points/:id | server.js | 3381 | Thiếu Authorization |
| 153 | GET | /api/support/student/:mssv | server.js | 3411 | Thiếu Authorization |
| 154 | POST | /api/support | server.js | 3416 | Thiếu Authorization |
| 155 | GET | /api/support/teacher/:maGV | server.js | 3423 | Thiếu Authorization |
| 156 | POST | /api/support/teacher | server.js | 3428 | Thiếu Authorization |
| 157 | POST | /documents/upload | ai-exam/routes.js | 23 | Thiếu Authorization |
| 158 | GET | /documents/teacher/:ma_giang_vien | ai-exam/routes.js | 24 | Thiếu Authorization |
| 159 | POST | /sessions/start | ai-exam/routes.js | 26 | Thiếu Authorization |
| 160 | POST | /sessions/:id/resume | ai-exam/routes.js | 27 | Thiếu Authorization |
| 161 | GET | /sessions/teacher/:ma_giang_vien | ai-exam/routes.js | 28 | Thiếu Authorization |
| 162 | GET | /sessions/:id/questions | ai-exam/routes.js | 30 | Thiếu Authorization |
| 163 | PUT | /questions/:id/status | ai-exam/routes.js | 31 | Thiếu Authorization |
| 164 | PUT | /questions/:id | ai-exam/routes.js | 32 | Thiếu Authorization |
| 165 | POST | /sessions/:id/approve-all | ai-exam/routes.js | 33 | Thiếu Authorization |
| 166 | DELETE | /questions/:id | ai-exam/routes.js | 34 | Thiếu Authorization |
| 167 | GET | /banks/teacher/:ma_giang_vien | ai-exam/routes.js | 37 | Thiếu Authorization |
| 168 | GET | /banks/:id/questions | ai-exam/routes.js | 38 | Thiếu Authorization |
| 169 | DELETE | /banks/:id | ai-exam/routes.js | 39 | Thiếu Authorization |
| 170 | PUT | /banks/:id | ai-exam/routes.js | 40 | Thiếu Authorization |
| 171 | POST | /exams | ai-exam/routes.js | 43 | Thiếu Authorization |
| 172 | GET | /exams/teacher/:ma_giang_vien | ai-exam/routes.js | 59 | Thiếu Authorization |
| 173 | GET | /exams/student/:mssv | ai-exam/routes.js | 76 | Thiếu Authorization |
| 174 | POST | /exams/:exam_id/start | ai-exam/routes.js | 94 | Thiếu Authorization |
| 175 | POST | /exams/submit | ai-exam/routes.js | 185 | Thiếu Authorization |
| 176 | GET | /exams/history/student/:mssv | ai-exam/routes.js | 215 | Thiếu Authorization |
| 177 | DELETE | /exams/:id | ai-exam/routes.js | 233 | Thiếu Authorization |
| 178 | PUT | /exams/:id | ai-exam/routes.js | 245 | Thiếu Authorization |
| 179 | GET | /exams/:id/results | ai-exam/routes.js | 263 | Thiếu Authorization |
| 180 | GET | /attempts/:attempt_id/details | ai-exam/routes.js | 295 | Thiếu Authorization |
