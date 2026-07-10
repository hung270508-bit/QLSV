const fs = require('fs');
const serverFile = fs.readFileSync('c:/New folder (2)/QLSV/backend/server.js', 'utf8');
const lines = serverFile.split('\n');

const findRouteLines = (route) => {
    let start = -1;
    let end = -1;
    for(let i=0; i<lines.length; i++){
        if(lines[i].includes("app.post('" + route) || lines[i].includes("app.get('" + route)){
            start = i;
            break;
        }
    }
    if(start !== -1){
        for(let i=start; i<lines.length; i++){
            if(lines[i] === '});'){
                end = i;
                break;
            }
        }
    }
    if(start !== -1 && end !== -1){
        console.log('--- ' + route + ' ---');
        console.log(lines.slice(start, end + 1).join('\n'));
    }
}

findRouteLines('/api/rfid/activate-register');
findRouteLines('/api/attendance/uid');
