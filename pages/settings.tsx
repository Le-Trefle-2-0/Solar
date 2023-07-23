import { useRouter } from "next/router";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import getSession from "../src/utils/get_session";
import { getRoles } from "./api/roles";
import { Line, Bar } from "react-chartjs-2";
import { useContext, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { accounts, calendar_events, roles } from "@prisma/client";
import fetcher from "../src/utils/fetcher";
import SettingsForm from "../src/components/form/settings";
import Modal from "../src/components/modal";
import { InferGetServerSidePropsType } from "next";

interface ServersideProps{
    rolesSSR: roles[]
}

export default function Settings({rolesSSR}: InferGetServerSidePropsType<typeof getServerSideProps>){
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
                <h3>Informations du compte</h3>
                
                <button className="btn py-0.5 -my-1 mr-2" onClick={()=>setSelectedAccountToEdit(session.current?.user || null)}>Modifier</button>
            </div>
            <Modal isOpened={selectedAccountToEdit !== undefined} title={`${selectedAccountToEdit != null ? "Modifier" : "Créer"} un compte`} onClose={()=>setSelectedAccountToEdit(undefined)}>
                <div className="p-8">
                    <SettingsForm key={Math.random()} account={selectedAccountToEdit ?? null} roles={rolesSSR} onCancel={()=>setSelectedAccountToEdit(undefined)} onSuccess={() => {setSelectedAccountToEdit(undefined); accountsSWR.mutate()}}/>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

export async function getServerSideProps(){
    return {props: {rolesSSR: JSON.parse(JSON.stringify(await getRoles()))} as ServersideProps};
}