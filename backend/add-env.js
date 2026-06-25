const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('backend/.env', 'utf8');
const lines = envFile.split('\n');

for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const value = values.join('=').trim().replace(/['"]/g, '');
            console.log(`Adding ${key} to Vercel...`);
            
            try {
                execSync(`npx vercel env rm ${key} production --yes --cwd d:\\QLSV`, { stdio: 'ignore' });
            } catch (e) {}
            
            try {
                fs.writeFileSync(`temp_${key}.txt`, value, 'utf8');
                execSync(`cmd.exe /c "npx vercel env add ${key} production --cwd d:\\QLSV < temp_${key}.txt"`, { stdio: 'inherit' });
                fs.unlinkSync(`temp_${key}.txt`);
                console.log(`Successfully added ${key}`);
            } catch (e) {
                console.log(`Error running vercel add for ${key}`, e.message);
            }
        }
    }
}
console.log('Done syncing env vars!');
