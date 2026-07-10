process.env.JWT_SECRET = 'test-secret';
const assert = require('assert');
const { authenticate } = require('./authenticate');
const requireRole = require('./requireRole');
const requireAttemptOwnership = require('./requireAttemptOwnership');

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

const mockNext = () => {
    let called = false;
    const next = () => { called = true; };
    next.wasCalled = () => called;
    return next;
};

const jwt = require('jsonwebtoken');

console.log('Testing authenticate...');
let validToken = jwt.sign({ id: 'SV01', role: 'student' }, 'test-secret');
let req = { headers: { authorization: `Bearer ${validToken}` } };
let res = mockRes();
let next = mockNext();
authenticate(req, res, next);
assert(next.wasCalled(), 'Should call next on valid token');
assert(req.user.id === 'SV01', 'Should set req.user');

req = { headers: {} };
res = mockRes();
next = mockNext();
authenticate(req, res, next);
assert(!next.wasCalled(), 'Should not call next on missing token');
assert(res.statusCode === 401, 'Should return 401');

req = { headers: { authorization: 'Bearer invalid_token' } };
res = mockRes();
next = mockNext();
authenticate(req, res, next);
assert(!next.wasCalled(), 'Should not call next on invalid token');
assert(res.statusCode === 401, 'Should return 401');

// 2. Test requireRole
console.log('Testing requireRole...');
req = { user: { role: 'student' } };
res = mockRes();
next = mockNext();
requireRole('student')(req, res, next);
assert(next.wasCalled(), 'Should call next if role matches');

req = { user: { role: 'student' } };
res = mockRes();
next = mockNext();
requireRole('teacher')(req, res, next);
assert(!next.wasCalled(), 'Should not call next if role does not match');
assert(res.statusCode === 403, 'Should return 403');

// 3. Test requireAttemptOwnership
console.log('Testing requireAttemptOwnership...');
const mockDb = {
    query: async (sql, params) => {
        if (params[0] === '1') return [[{ ma_sinh_vien: 'SV01' }]];
        if (params[0] === '2') return [[{ ma_sinh_vien: 'SV02' }]];
        return [[]]; // not found
    }
};
const requireAttempt = requireAttemptOwnership(mockDb);

req = { params: { attemptId: '1' }, user: { id: 'SV01' } };
res = mockRes();
next = mockNext();
requireAttempt(req, res, next).then(() => {
    assert(next.wasCalled(), 'Should call next on valid ownership');

    req = { params: { attemptId: '2' }, user: { id: 'SV01' } };
    res = mockRes();
    next = mockNext();
    return requireAttempt(req, res, next);
}).then(() => {
    assert(!next.wasCalled(), 'Should not call next on invalid ownership');
    assert(res.statusCode === 403, 'Should return 403');

    req = { params: { attemptId: '999' }, user: { id: 'SV01' } };
    res = mockRes();
    next = mockNext();
    return requireAttempt(req, res, next);
}).then(() => {
    assert(!next.wasCalled(), 'Should not call next if attempt not found');
    assert(res.statusCode === 404, 'Should return 404');
    
    console.log('All middleware tests passed!');
}).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
