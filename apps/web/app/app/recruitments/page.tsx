import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getRecruitments} from "@/app/actions/recruitments";
import {RecruitmentClient} from "@/components/recruitments/recruitment-client";

export default async function RecruitmentsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/app");
    }

    const userRoles = ((session.user as any).role || "").split(",").map((r: string) => r.trim());
    if (!userRoles.includes("admin") && !userRoles.includes("manager")) {
        redirect("/app");
    }

    const recruitments = await getRecruitments();

    return (
        <div className="flex-1 space-y-4 p-8 pt-16 overflow-auto h-full">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Recrutements</h2>
            </div>
            <RecruitmentClient initialData={recruitments as any}/>
        </div>
    );
}
