import type {Metadata} from "next";
import "./globals.css";
import "./edition-two-admin.css";
export const metadata:Metadata={title:"مدیریت سایت | استودیو",description:"پنل مدیریت فارسی فروشگاه و سایت شرکتی"};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
