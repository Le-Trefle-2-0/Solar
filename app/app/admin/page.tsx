import {DataTable} from "./data-table"
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
    }))
    console.log(accMap)
    return accMap;
}

export default async function DemoPage() {
    const data = await getData()

    return (
        <div className="container mx-auto p-6">
            <DataTable data={data}/>
        </div>
    )
}