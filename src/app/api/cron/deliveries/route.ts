import {NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {processOutbox} from '@/lib/outbox';
export const runtime='nodejs';
async function execute(req:Request){
 const secret=process.env.CRON_SECRET,authorization=req.headers.get('authorization');
 if(!secret||secret.length<32||!authorization?.startsWith('Bearer '))return NextResponse.json({error:'Unauthorized'},{status:401});
 const a=Buffer.from(secret),b=Buffer.from(authorization.slice(7));
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json({ok:true,...await processOutbox(20)})}
 catch(e){console.error('outbox cron',e);return NextResponse.json({error:'Delivery job failed'},{status:500})}
}
export const GET=execute;
export const POST=execute;
