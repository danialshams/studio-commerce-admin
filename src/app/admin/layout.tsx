import {redirect} from "next/navigation";
import {currentAdmin} from "@/lib/security";
import {AdminShell} from "@/components/AdminShell";
export const dynamic="force-dynamic";
export default async function Layout({children}:{children:React.ReactNode}){
 if(process.env.NEXT_PUBLIC_STUDIO_DEMO === "1")return <AdminShell email="demo@studio.local">{children}</AdminShell>;
 const admin=await currentAdmin();if(!admin)redirect("/login");
 return <AdminShell email={admin.email}>{children}</AdminShell>;
}
