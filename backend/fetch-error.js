const https = require('https');

console.log('Bắt đầu kiểm tra API chẩn đoán...');

function checkAPI() {
    https.get('https://qlsv-huq1.onrender.com/api/test-email-error', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 404) {
                console.log('Render đang sử dụng phiên bản cũ (404 Not Found). Đang thử lại sau 10 giây...');
                setTimeout(checkAPI, 10000);
            } else {
                console.log(`Mã HTTP: ${res.statusCode}`);
                console.log('Kết quả chẩn đoán từ Render:');
                console.log(data);
                process.exit(0);
            }
        });
    }).on('error', (e) => {
        console.error('Lỗi kết nối tới Render:', e.message);
        setTimeout(checkAPI, 10000);
    });
}

checkAPI();
