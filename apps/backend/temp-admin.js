const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  connectionString: 'postgresql://khaled:123456@localhost:5432/nest-monorepo',
});

(async () => {
  await client.connect();
  const email = 'temp.admin.test@gmail.com';
  const password = 'TestAdmin123!';
  const hash = await bcrypt.hash(password, 10);
  const res = await client.query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin'`,
    ['Temp Admin', email, hash]
  );
  console.log('Temp admin ready:', email, '/', password);
  await client.end();
})().catch(async (e) => { console.error('ERROR:', e.message); try { await client.end(); } catch {} process.exit(1); });
