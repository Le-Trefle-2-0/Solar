import {UsersTable} from "./users-table"
import {DisplayAccount} from "@/lib/interface";
import prisma from "@/lib/prisma";

async function getData(): Promise<DisplayAccount[]> {
    // Fetch data from your API here.
    const accounts = await prisma.user.findMany();
    const accMap = accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        username: acc.username as string,
        email: acc.email,
        role: acc.role as string,
    }));
    return accMap;
}

export default async function Admin() {
    const data = await getData()

    return (
        <div className="container mx-auto p-6">
            <UsersTable data={data}/>
        </div>
    )
}