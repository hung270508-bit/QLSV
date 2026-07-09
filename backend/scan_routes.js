const fs = require('fs');

const serverFile = fs.readFileSync('c:/New folder (2)/QLSV/backend/server.js', 'utf8');

const routeRegex = /app\.(get|post|put|delete)\(['"]([^'"]+)['"]\s*,/g;
let routes = [];
let match;
while ((match = routeRegex.exec(serverFile)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[2];
    
    // get a substring around this to check for verifyToken etc.
    const start = match.index;
    const end = serverFile.indexOf('{', start); // approximate handler start
    const block = serverFile.substring(start, end + 200); // 200 chars to peek inside
    
    const hasVerifyToken = block.includes('verifyToken');
    const hasAuthorizeRole = block.includes('authorizeRole') || block.includes('checkRole') || block.includes('role ==='); // check common patterns
    
    routes.push({ method, route, hasVerifyToken, hasAuthorizeRole });
}

console.log('--- ROUTE SCANNER ---');
console.log('Total routes:', routes.length);
const withoutAuth = routes.filter(r => !r.hasVerifyToken);
console.log('Routes without verifyToken:', withoutAuth.length);
console.log(withoutAuth.map(r => r.method + ' ' + r.route).join('\n'));

console.log('\n--- IDOR CANDIDATES (URL Params) ---');
const idor = routes.filter(r => r.route.includes('/:'));
console.log(idor.map(r => r.method + ' ' + r.route).join('\n'));

console.log('\n--- SQL INJECTION CANDIDATES ---');
const sqlQueries = serverFile.match(/query\([^,]+,\s*([^)]+)\)/g) || [];
// Let's just do a simpler search for string concatenation in queries
const lines = serverFile.split('\n');
let sqlInjectLines = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if ((line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE') || line.includes('DELETE')) && line.includes('WHERE') && line.includes('${')) {
        sqlInjectLines.push((i + 1) + ': ' + line.trim());
    }
}
console.log(sqlInjectLines.join('\n'));
