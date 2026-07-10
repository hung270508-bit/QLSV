const fs = require('fs');
const serverFile = fs.readFileSync('c:/New folder (2)/QLSV/backend/server.js', 'utf8');

const lines = serverFile.split('\n');
let sqlInjectLines = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('db.query(') || line.includes('executeQuery(') || line.includes('executeDelete(')) {
        // Look for string concatenation in SQL
        if (line.match(/[\+\$]/) && !line.includes('LIKE ?') && line.includes('WHERE')) {
             sqlInjectLines.push((i + 1) + ': ' + line.trim());
        }
    }
}
console.log('SQL Injection candidates in server.js:');
console.log(sqlInjectLines.join('\n'));
