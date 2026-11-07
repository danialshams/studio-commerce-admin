import { Pool, type PoolClient } from 'pg';
export function postgresUrl(raw:string){
 const url=new URL(raw);
 const mode=url.searchParams.get('sslmode');
 if(mode&&['prefer','require','verify-ca'].includes(mode))url.searchParams.set('sslmode','verify-full');
 return url.toString();
}
const globalForPg = globalThis as unknown as { pool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  if (!globalForPg.pool) globalForPg.pool = new Pool({connectionString: postgresUrl(process.env.DATABASE_URL), max: 5, idleTimeoutMillis: 20000, connectionTimeoutMillis: 10000});
  return globalForPg.pool;
}
export async function transaction<T>(fn: (c: PoolClient)=>Promise<T>) {
  const client=await db().connect(); try { await client.query('BEGIN'); const result=await fn(client); await client.query('COMMIT'); return result; } catch(e) { await client.query('ROLLBACK'); throw e; } finally {client.release();}
}
