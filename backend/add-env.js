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
                execSync(`echo ${value} | npx vercel env rm ${key} production --yes`, { stdio: 'ignore' });
            } catch (e) {}
            try {
                execSync(`echo ${value} | npx vercel env add ${key} production`, { stdio: 'pipe' });
                console.log(`Successfully added ${key}`);
            } catch (e) {
                console.log(`Failed to add ${key}`);
            }
        }
    }
}
console.log('Done syncing env vars!');
