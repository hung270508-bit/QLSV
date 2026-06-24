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
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      // 1. Sidebar dim text -> lighter text
      .replace(/text-\[\#6B7280\]\/70/g, 'text-gray-300')
      
      // 2. Pale yellow gradient -> Solid Gold
      .replace(/bg-gradient-to-r from-\[\#F4C542\] to-\[\#F4C542\]\/90/g, 'bg-[#F4C542]')
      
      // 3. Header text contrast
      .replace(/className="text-3xl font-bold text-white mb-1"/g, 'className="text-3xl font-bold text-[#152238] mb-1"')
      .replace(/className="text-3xl font-bold text-white mb-2"/g, 'className="text-3xl font-bold text-[#152238] mb-2"')
      .replace(/className="text-2xl font-bold text-white mb-2"/g, 'className="text-2xl font-bold text-[#152238] mb-2"')
      .replace(/className="text-2xl font-bold text-white mb-1"/g, 'className="text-2xl font-bold text-[#152238] mb-1"')
      
      // 4. Header subtitle contrast
      .replace(/text-orange-100/g, 'text-[#152238]/70')
      
      // 5. Header icons contrast
      .replace(/w-10 h-10 text-white/g, 'w-10 h-10 text-[#152238]')
      .replace(/w-8 h-8 text-white/g, 'w-8 h-8 text-[#152238]')
      
      // 6. Icon backgrounds in Header
      .replace(/bg-\[\#FFFFFF\]\/20/g, 'bg-white/40');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed contrast in', filePath);
    }
  }
});
