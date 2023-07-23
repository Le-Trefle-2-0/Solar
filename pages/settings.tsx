import { useRouter } from "next/router";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import getSession from "../src/utils/get_session";
import { getRoles } from "./api/roles";
import { Line, Bar } from "react-chartjs-2";
import { useContext, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { accounts, calendar_events, roles } from "@prisma/client";
import fetcher from "../src/utils/fetcher";
import AccountForm from "../src/components/form/accounts";

export default function Settings(props){
    const router = useRouter();
    const session = useRef(getSession());
    let [selectedAccountToEdit, setSelectedAccountToEdit] = useState<(Omit<accounts, "password"> & {roles: roles})|null>();
    const accountsSWR = useSWR<(Omit<accounts, "password"> & {roles: roles})[]|null>("/api/accounts", fetcher);
    let accounts = accountsSWR.data || [];
  
    return (
        <AuthenticatedLayout>
            <div className="flex items-center mb-8 justify-between">
                <h2>Parametres</h2>
                <button className="btn py-0.5 -my-1" onClick={() => {router.back()}}>Retour</button>
            </div>
            <div className="flex flex-col items-center mb-8 justify-between">
                
            </div>
        </AuthenticatedLayout>
    );
}