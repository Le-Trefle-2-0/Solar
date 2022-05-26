import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { accounts, calendar_events, roles } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import { useContext, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import AccountForm from "../src/components/form/accounts";
import ListensForm from "../src/components/form/listens";
import Modal from "../src/components/modal";
import { ReferenceActualEventContext } from "../src/contexts/ReferenceGlobalCHatContext";
import { ListenWithStatusAndAccounts } from "../src/interfaces/listens";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import fetcher from "../src/utils/fetcher";
import getSession from "../src/utils/get_session";
import { getRoles } from "./api/roles";

interface ServersideProps{
    rolesSSR: roles[]
}

export default function Listens({rolesSSR}: ServersideProps){
    const router = useRouter();
    const session = useRef(getSession());
    let [selectedAccountToEdit, setSelectedAccountToEdit] = useState<(Omit<accounts, "password"> & {roles: roles})|null>();
    const accountsSWR = useSWR<(Omit<accounts, "password"> & {roles: roles})[]|null>("/api/accounts", fetcher);
    let accounts = accountsSWR.data || [];
    if(typeof accountsSWR.data == "string") accounts = [];
      
    useEffect(()=>{
        if(!session.current?.user.is_admin) router.push("/");
    }, []);
  
  
    return (
        <AuthenticatedLayout>
            <div className="flex items-center mb-8 justify-between">
                <h2 className="">COMPTES</h2>
                <button className="btn py-0.5 -my-1" onClick={()=>setSelectedAccountToEdit(null)}>Ajouter</button>
            </div>
            <table>
            <thead> 
                <tr>
                    <th>identifiant</th>
                    <th>Nom</th>
                    <th>Tel</th>
                    <th>Role</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                { !!accounts && accounts.length > 0 ? accounts.map((a,k)=>(
                <tr key={"listen" + a.id} className={`${k%2 == 1 ? "odd":""}`}>
                    <td>{a.id}</td>
                    <td>{a.name}</td>
                    <td>{a.tel}</td>
                    <td>{a.roles.label}</td>
                    <td className="flex justify-end">
                        <button className="btn py-0.5 -my-1 mr-2" onClick={()=>setSelectedAccountToEdit(a)}>Modifier</button>
                        <button className="btn py-0.5 -my-1" onClick={async ()=>{
                            if(confirm("Êtes-vous sur de vouloir supprimer cet utilisateur?\nCette action est irréversible!")){
                                await fetcher(`/api/accounts/${a.id}`, 'DELETE');
                                accountsSWR.mutate();
                            }
                        }}>Supprimer</button>
                    </td>
                </tr>
                )) : (
                <tr>
                    <td colSpan={4}>Aucune écoute n'a été trouvé</td>
                </tr>
                )}
            </tbody>
            </table>
            <Modal isOpened={selectedAccountToEdit !== undefined} title={`${selectedAccountToEdit != null ? "Modifier" : "Créer"} un compte`} onClose={()=>setSelectedAccountToEdit(undefined)}>
                <div className="p-8">
                    <AccountForm key={Math.random()} account={selectedAccountToEdit ?? null} roles={rolesSSR} onCancel={()=>setSelectedAccountToEdit(undefined)} onSuccess={() => {setSelectedAccountToEdit(undefined); accountsSWR.mutate()}}/>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
  }

  export async function getServerSideProps(){
      return {props: {rolesSSR: JSON.parse(JSON.stringify(await getRoles()))} as ServersideProps};
  }