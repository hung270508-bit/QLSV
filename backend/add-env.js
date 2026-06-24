const { execSync } = require('child_process');
const envs = {
  DB_HOST: 'mysql-d508c3a-hung270508-ae5d.h.aivencloud.com',
  DB_USER: 'avnadmin',
  DB_PASSWORD: 'AVNS_tlxTooyMoOQJira1gwy',
  DB_NAME: 'defaultdb',
  DB_PORT: '18628'
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Adding ${key}...`);
  try {
    execSync(`npx vercel env rm ${key} production -y`);
  } catch (e) {}
  execSync(`npx vercel env add ${key} production`, {
    input: value
  });
  console.log(`Added ${key}`);
}
