import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import CRM from '@/components/CRM';
export const dynamic='force-dynamic';
export default async function Dashboard(){const s=await getSession();if(!s)redirect('/login');return <CRM userName={s.name}/>}
