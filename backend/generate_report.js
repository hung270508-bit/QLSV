const fs = require('fs');

const serverFile = fs.readFileSync('c:/New folder (2)/QLSV/backend/server.js', 'utf8');
const routesFile = fs.readFileSync('c:/New folder (2)/QLSV/backend/ai-exam/routes.js', 'utf8');

const parseRoutes = (content, regex, filename) => {
    let routes = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const route = match[2];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const start = match.index;
        const end = content.indexOf('{', start);
        const block = end !== -1 ? content.substring(start, end + 200) : content.substring(start, start + 300);
        
        const hasVerifyToken = block.includes('verifyToken');
        const hasAuthorizeRole = block.includes('authorizeRole');
        
        routes.push({ method, route, filename, line: lineNumber, hasVerifyToken, hasAuthorizeRole });
    }
    return routes;
}

const allRoutes = [
    ...parseRoutes(serverFile, /app\.(get|post|put|delete)\(['"]([^'"]+)['"]\s*,/g, 'server.js'),
    ...parseRoutes(routesFile, /router\.(get|post|put|delete)\(['"]([^'"]+)['"]\s*,/g, 'ai-exam/routes.js')
];

const idor = allRoutes.filter(r => r.route.includes('/:'));
const noAuth = allRoutes.filter(r => !r.hasVerifyToken);
const noAuthz = allRoutes.filter(r => !r.hasAuthorizeRole);

const formatTable = (routes, title) => {
    let out = '### ' + title + '\n\n';
    out += '| # | Method | Route | File | Line | Lỗi |\n';
    out += '|---|--------|-------|------|------|------|\n';
    routes.forEach((r, i) => {
        let errType = title.includes('IDOR') ? 'IDOR' : (title.includes('Authentication') ? 'Thiếu Authentication' : 'Thiếu Authorization');
        out += '| ' + (i+1) + ' | ' + r.method + ' | ' + r.route + ' | ' + r.filename + ' | ' + r.line + ' | ' + errType + ' |\n';
    });
    return out;
};

let report = formatTable(idor, 'Danh sách C — API có lỗ hổng IDOR (Sử dụng URL params định danh)');
report += '\n\n' + formatTable(noAuth, 'Danh sách A — API thiếu Authentication (Không có verifyToken)');
report += '\n\n' + formatTable(noAuthz, 'Danh sách B — API thiếu Authorization (Không có authorizeRole)');

fs.writeFileSync('report_tables.md', report);
