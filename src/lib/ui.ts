export function formatValue(value:number){return new Intl.NumberFormat("fa-IR").format(value);}
export function formatMoney(value:number){return formatValue(value)+" تومان";}
export function formatDate(value:unknown){if(!value)return "—";const date=new Date(String(value));return isNaN(date.getTime())?"—":new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(date);}
export const statusLabels:Record<string,string>={ACTIVE:"منتشرشده",ARCHIVED:"آرشیوشده",DRAFT:"پیش‌نویس",PUBLISHED:"منتشرشده",PENDING:"در انتظار",CONFIRMED:"تأییدشده",PACKING:"آماده‌سازی",SHIPPED:"ارسال‌شده",DELIVERED:"تحویل‌شده",CANCELLED:"لغوشده",RETURNED:"مرجوعی",APPROVED:"تأییدشده",REJECTED:"ردشده",PAID:"پرداخت‌شده",FAILED:"ناموفق",REFUNDED:"بازپرداخت‌شده",NEW:"جدید",CONTACTED:"تماس گرفته شد",CLOSED:"بسته شد",PERCENT:"درصدی",FIXED:"مبلغ ثابت"};
export function humanize(value:unknown){if(value==null||value==="")return "—";if(typeof value==="boolean")return value?"فعال":"غیرفعال";const s=String(value);return statusLabels[s]||s;}
export function slugify(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9\s-]+/g,"").replace(/\s+/g,"-").replace(/--+/g,"-").replace(/^-|-$/g,"");}
