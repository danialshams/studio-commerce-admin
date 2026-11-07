import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'دایرا CRM | مدیریت ارتباط با مشتری',description:'نرم‌افزار مدیریت مشتریان و فروش دایرا',manifest:'/manifest.webmanifest'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="fa" dir="rtl"><body>{children}</body></html> }
