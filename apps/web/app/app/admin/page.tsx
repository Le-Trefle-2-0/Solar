import {redirect} from "next/navigation";

export default function AdminIndexRedirect() {
    redirect("/app/admin/users");
    return null;
}