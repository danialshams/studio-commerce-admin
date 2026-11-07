import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession,fail } from '@/lib/common';
import { authorize } from '@/lib/access';

export async function GET(){
 const s=await requireSession();
 if(!s)return fail('لطفاً وارد شوید.',401);
 const canDeals=authorize(s,'deals');
 const canTickets=authorize(s,'tickets');
 const readableEntities=['contacts','deals','tasks','documents','contracts','tickets','interactions','automation_rules'].filter(entity=>authorize(s,entity));
 try {
  const [people,deals,tasks,monthly,activity,org,pipeline,tickets]=await Promise.all([
   db().query("SELECT count(*)::int total, count(*) FILTER(WHERE status='lead')::int leads, count(*) FILTER(WHERE status='customer')::int customers FROM contacts WHERE org_id=$1",[s.orgId]),
   canDeals?db().query("SELECT coalesce(sum(amount) FILTER(WHERE stage='won'),0)::bigint won,coalesce(sum(amount) FILTER(WHERE stage NOT IN('won','lost')),0)::bigint open,count(*)::int total FROM deals WHERE org_id=$1",[s.orgId]):Promise.resolve({rows:[{won:'0',open:'0',total:0}]}),
   db().query("SELECT count(*) FILTER(WHERE status!='done')::int pending,count(*) FILTER(WHERE status!='done' AND due_at<current_date)::int overdue FROM tasks WHERE org_id=$1",[s.orgId]),
   canDeals?db().query("SELECT to_char(date_trunc('month',won_at),'YYYY-MM') month,coalesce(sum(amount),0)::bigint amount FROM deals WHERE org_id=$1 AND stage='won' AND won_at>=date_trunc('month',now())-interval '5 months' GROUP BY 1 ORDER BY 1",[s.orgId]):Promise.resolve({rows:[]}),
   db().query('SELECT id,description,action,created_at FROM activities WHERE org_id=$1 AND entity=ANY($2::text[]) ORDER BY created_at DESC LIMIT 6',[s.orgId,readableEntities]),
   db().query('SELECT name FROM organizations WHERE id=$1',[s.orgId]),
   canDeals?db().query('SELECT stage,count(*)::int total,coalesce(sum(amount),0)::bigint amount FROM deals WHERE org_id=$1 GROUP BY stage ORDER BY stage',[s.orgId]):Promise.resolve({rows:[]}),
   canTickets?db().query('SELECT status,count(*)::int total FROM tickets WHERE org_id=$1 GROUP BY status ORDER BY status',[s.orgId]):Promise.resolve({rows:[]})
  ]);
  return NextResponse.json({
   people:people.rows[0],deals:deals.rows[0],tasks:tasks.rows[0],
   monthly:monthly.rows,pipeline:pipeline.rows,tickets:tickets.rows,
   activity:activity.rows,orgName:org.rows[0]?.name||'',
   permissions:{deals:canDeals,tickets:canTickets}
  });
 } catch(e){console.error('summary',e);return fail('دریافت گزارش ناموفق بود.',500)}
}
