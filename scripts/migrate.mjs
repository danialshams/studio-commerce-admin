import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import pg from 'pg';

// Run explicitly before deployment; acquires one transaction-level lock so
// simultaneous builds never run schema changes against the same database.
if (!process.env.DATABASE_URL) {
 console.error('DATABASE_URL is required for migrations.');
 process.exit(1);
}
const url=new URL(process.env.DATABASE_URL);
if(['prefer','require','verify-ca'].includes(url.searchParams.get('sslmode')||''))
 url.searchParams.set('sslmode','verify-full');
const client=new pg.Client({connectionString:url.toString(),connectionTimeoutMillis:15000});
try {
 await client.connect();
 await client.query('BEGIN');
 await client.query("SET LOCAL lock_timeout = '20s'");
 await client.query('SELECT pg_advisory_xact_lock(537181293)');
 for (const name of ['database/schema.sql','database/003_integrations.sql','database/004_demo_data.sql']) {
  const sql=readFileSync(resolve(process.cwd(),name),'utf8');
  await client.query(sql);
  console.log('Applied additive schema: '+name);
 }
 await client.query('COMMIT');
 console.log('CRM database migration complete.');
} catch(error) {
 try {await client.query('ROLLBACK')}catch{}
 console.error('CRM database migration failed:',error instanceof Error?error.message:'unknown error');
 process.exitCode=1;
} finally {
 await client.end().catch(()=>{});
}
