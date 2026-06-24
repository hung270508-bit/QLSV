const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'frontend/src'), function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/1c1c1e/gi, '152238')
      .replace(/F0E929/gi, 'F4C542')
      .replace(/d7af17/gi, 'F59E0B')
      .replace(/2c2c2e/gi, '1e2f4c')
      .replace(/#1c1c1e/gi, '#152238')
      .replace(/#F0E929/gi, '#F4C542')
      .replace(/#d7af17/gi, '#F59E0B')
      .replace(/#2c2c2e/gi, '#1e2f4c');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
