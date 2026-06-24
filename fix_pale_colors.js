const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // 1. Table Headers: th with text-[#F4C542] -> text-[#152238] (Navy)
    newContent = newContent.replace(/<th([^>]*)text-\[\#F4C542\]([^>]*)>/g, '<th$1text-[#152238]$2>');

    // 2. Badges & Ghost Buttons (Gold/Yellow): bg-[#FFF7D6] text-[#F4C542] -> bg-[#F4C542]/20 text-[#B45309]
    newContent = newContent.replace(/bg-\[\#FFF7D6\] text-\[\#F4C542\]/g, 'bg-[#F4C542]/20 text-[#B45309]');
    
    // 3. Ghost Delete Buttons (Red): bg-[#EF4444]/10 text-[#EF4444] -> bg-red-100 text-[#DC2626]
    newContent = newContent.replace(/bg-\[\#EF4444\]\/10 text-\[\#EF4444\]/g, 'bg-red-100 text-[#DC2626]');
    
    // 4. Ghost Delete Button Hovers & Borders
    newContent = newContent.replace(/hover:bg-\[\#EF4444\]\/20/g, 'hover:bg-red-200');
    newContent = newContent.replace(/border-red-100/g, 'border-red-200');

    // 5. Pale Blue Ghost Buttons (Info): bg-blue-50 text-blue-500 -> bg-blue-100 text-blue-700
    newContent = newContent.replace(/bg-blue-50 text-blue-500/g, 'bg-blue-100 text-blue-700');
    newContent = newContent.replace(/bg-blue-50 text-blue-400/g, 'bg-blue-100 text-blue-700');
    
    // 6. Pale Green Ghost Buttons (Success): bg-green-50 text-green-500 -> bg-green-100 text-green-700
    newContent = newContent.replace(/bg-green-50 text-green-500/g, 'bg-green-100 text-green-700');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed pale colors in', filePath);
    }
  }
}

walkDir(path.join(__dirname, 'frontend/src/components'), processFile);
