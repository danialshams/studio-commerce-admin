import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/access';
export const fail=(message:string,status=400)=>NextResponse.json({error:message},{status});
export async function requireSession() { const s=await currentSession(); return s; }
export const isoDate=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;
export const textVal=(v:unknown,max=255)=>String(v??'').trim().slice(0,max);
export const moneyVal=(v:unknown)=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=0&&n<=100000000000000?n:0};
export const isUUID=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const actionText:Record<string,string>={contacts:'مخاطب',deals:'فرصت فروش',tasks:'وظیفه',documents:'سند مالی',contracts:'قرارداد',tickets:'تیکت',automation_rules:'قانون خودکار'};
