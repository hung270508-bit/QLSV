---
name: testing-qlsv
description: Test the QLSV (Quan ly sinh vien) app end-to-end. Use when verifying frontend/backend changes, especially the centralized axios baseURL / API config in frontend/src/lib/api.js.
---

# Testing QLSV end-to-end

Stack: backend Express + MySQL (`backend/server.js`, port 5000), frontend React + Vite
(port 5173 dev). Frontend talks to backend via relative paths `/api/...` resolved by
`axios.defaults.baseURL` set in `frontend/src/lib/api.js` (configurable via `VITE_API_URL`).

## Why the baseURL test matters
FE (:5173) and BE (:5000) run on different ports. If the baseURL config is broken, axios
requests hit the Vite origin (:5173) and the UI shows "Khong the ket noi den server!".
A successful login + dashboard data load therefore proves the baseURL routing works.

## Environment setup (Windows, no Docker)
MySQL is not preinstalled. Install via Chocolatey (choco is available):
```
choco install mysql -y --no-progress
```
The MySQL service (`MySQL`) starts automatically; root has NO password initially.
`backend/.env` expects `DB_PASSWORD=1234` / `DB_NAME=qlsv`, so align them:
```
export PATH="$PATH:/c/tools/mysql/current/bin"
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '1234'; FLUSH PRIVILEGES;"
mysql -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS qlsv CHARACTER SET utf8mb4;"
mysql -u root -p1234 qlsv < quanlysv.sql
```
Note: `quanlysv.sql` has no CREATE DATABASE, so create `qlsv` first and import into it.
(`docker-compose.yaml` uses DB name `quanlysv`; the backend default `.env` uses `qlsv` —
match whichever the running backend expects.)

## Run the app
```
(cd backend && node server.js)      # logs: "Da ket noi thanh cong den co so du lieu MySQL"
(cd frontend && npm run dev)        # serves http://localhost:5173
```
Quick API smoke test:
```
curl -s -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin@123"}'
curl -s http://localhost:5000/api/dashboard/stats
```

## Seed login accounts (from quanlysv.sql)
- admin / `admin@123`  (role admin -> AdminDashboard)
- GV001 / `gv@123`     (role teacher -> TeacherDashboard)
- SV001 / `123456aA@`  (role student -> StudentDashboard)

## Expected admin dashboard values (current seed)
Tong sinh vien=2, Tong mon hoc=3, Tong lop hoc=1, Tong giang vien=3, Tong khoa=3.
These match `GET /api/dashboard/stats` = {totalStudents:2,totalSubjects:3,totalClasses:1,totalTeachers:3}.
Values may change if the seed changes — re-check against the API response.

## Computer-use gotcha (important)
The desktop `type` action may DROP the characters `:` and `@`. Symptoms: URL becomes
`http//localhost5173` and passwords lose the `@`, causing a false "Sai thong tin dang nhap!".
Workaround: type those characters with explicit key presses — `:` via key `shift+semicolon`,
`@` via key `shift+2`. Build URLs/passwords in segments around these keys.

## Golden-path test
1. Open http://localhost:5173/ -> login form "He Thong Quan Ly".
2. Login admin / `admin@123` (mind the `@` gotcha) -> Admin Dashboard loads.
3. Verify the 5 stat cards match the DB (see expected values).
4. Open "Quan ly sinh vien" -> table lists the seeded students (proves post-login
   `/api/...` requests also route through baseURL).

## Devin Secrets Needed
None. The local MySQL root password (`1234`) is a dev-only credential defined in
`backend/.env`, not a real secret.
