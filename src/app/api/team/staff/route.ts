import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireSession,fail} from '@/lib/common';
export async function GET(){const s=await requireSession();if(!s)return fail('ورود لازم است.',401);
 const r=await db().query('SELECT id,name,role,is_active FROM users WHERE org_id=$1 AND is_active=true ORDER BY name LIMIT 200',[s.orgId]);
 return NextResponse.json({members:r.rows});}
