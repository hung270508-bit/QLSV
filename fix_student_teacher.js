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

    // Fix container text color
    newContent = newContent.replace(/bg-\[\#F4C542\]([^>]*)text-white/g, 'bg-[#F4C542]$1text-[#152238]');
    newContent = newContent.replace(/bg-gradient-to-r from-\[\#F4C542\] to-\[\#F4C542\]\/90([^>]*)text-white/g, 'bg-[#F4C542]$1text-[#152238]');
    
    // We only want to replace text-white with text-[#152238] if they are closely related to a Gold background.
    // However, since we already did a replace in fix_contrast.js for Admin, let's just do a specific replace for Student and Teacher
    // where we know the headers are Gold.
    
    // Actually, StudentProfile uses text-white on the container, which is fixed above.
    // StudentCourseRegistration also uses text-white on the container.
    // StudentAnnouncements uses text-white on the container.
    // Let's also fix subtitles and icons safely:
    newContent = newContent.replace(/text-orange-100/g, 'text-[#152238]/70');
    newContent = newContent.replace(/text-orange-50/g, 'text-[#152238]/70');
    newContent = newContent.replace(/bg-\[\#FFFFFF\]\/20/g, 'bg-white/40');
    newContent = newContent.replace(/bg-white\/20/g, 'bg-white/40');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed', filePath);
    }
  }
}

walkDir(path.join(__dirname, 'frontend/src/components/student'), processFile);
walkDir(path.join(__dirname, 'frontend/src/components/teacher'), processFile);
walkDir(path.join(__dirname, 'frontend/src/components/admin'), processFile);
