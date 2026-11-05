import type {Metadata,Viewport} from "next";
import "./globals.css";
import "./edition-two-admin.css";
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover"};
export const metadata:Metadata={title:"ESSENTIAL — مدیریت فروشگاه طرح ۲",description:"پنل اختصاصی مدیریت کالکشن‌ها، محصولات، محتوا و سفارش‌های Essential Edition 02"};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
