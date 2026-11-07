import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/access';
import CRM from '@/components/CRM';
export const dynamic='force-dynamic';
export default async function Dashboard(){const s=await currentSession();if(!s)redirect('/');return <CRM userName={s.name} role={s.role}/>}
