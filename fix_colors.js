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
      .replace(/primary-gold/g, '[#F4C542]')
      .replace(/sidebar-navy/g, '[#152238]')
      .replace(/primary-light/g, '[#FFF7D6]')
      .replace(/app-bg/g, '[#F7F8FA]')
      .replace(/card-bg/g, '[#FFFFFF]')
      .replace(/app-border/g, '[#E5E7EB]')
      .replace(/text-primary/g, '[#1F2937]')
      .replace(/text-secondary/g, '[#6B7280]')
      .replace(/app-success/g, '[#22C55E]')
      .replace(/app-warning/g, '[#F59E0B]')
      .replace(/app-danger/g, '[#EF4444]')
      .replace(/app-info/g, '[#3B82F6]');

    // Special fix for arbitrary brackets overlapping (e.g., text-[[#1F2937]])
    newContent = newContent
      .replace(/\[\[/g, '[')
      .replace(/\]\]/g, ']');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
