import { useRouter } from "next/router";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import TwoFactorAuthModal from "../src/components/form/2fa/enable";
import random from "rand-token"
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
    const [otpModalOpened, setOtpModalOpened] = useState<boolean>(false);
    const b32 = random.generator({
        chars: "base32"
    });
    const qrData = b32.generate(32);
    let [selectedAccountToEdit, setSelectedAccountToEdit] = useState<(Omit<accounts, "password">)|null>();
    const accountsSWR = useSWR<(Omit<accounts, "password"> & {roles: roles})[]|null>("/api/accounts", fetcher);
    let accounts = accountsSWR.data || [];
    
    async function disable2FA() {
        const disable2FA = await fetcher<string>('/api/2fa/disable', 'POST', {}).catch((e) => {
            console.error(e);
        });
        if (disable2FA) {
            router.push('/auth/login');
        }
    }
  
    return (
        <AuthenticatedLayout>
            <div className="flex items-center mb-8 justify-between">
                <h2>Parametres</h2>
                <button className="btn py-0.5 -my-1" onClick={() => {router.back()}}>Retour</button>
            </div>
            <div className="flex flex-row items-center mb-8 justify-between gap-8">
                <div className="flex flex-col mb-8 justify-between gap-8">
                    <h3>Informations du compte</h3>
                    <input type="text" className="input" value={session.current?.user?.email} readOnly/>
                    <input type="text" className="input" value={session.current?.user?.name} readOnly/>
                    
                    <button className="btn py-0.5 -my-1 mr-2" onClick={()=>setSelectedAccountToEdit(session.current?.user)}>Modifier</button>
                </div>
                <div className="flex flex-col items-left mb-8 justify-between gap-8">
                    <h3>Authentification</h3>
                    <button className="btn py-0.5 -my-1 mr-2" onClick={()=>router.push("/settings/password")}>Modifier le mot de passe</button>
                    { session.current?.otp ?
                        <div>
                            <h4>Authentification á deux facteurs activée !</h4>
                            <button className="btn py-0.5 -my-1 mr-2" onClick={()=>disable2FA()}>Désactiver l'authentification á deux facteurs</button>
                        </div>
                        :
                        <div>
                            <h4>Authentification á deux facteurs désactivée.<br/>Pour plus de sécurité, il est conseillé de l'activer.</h4>
                            <button className="btn py-0.5 -my-1 mr-2" onClick={() => setOtpModalOpened(true)}>Activer l'authentification á deux facteurs</button>
                        </div>
                    }
                </div>
            </div>
            <Modal isOpened={selectedAccountToEdit !== undefined} title={`${selectedAccountToEdit != null ? "Modifier" : "Créer"} un compte`} onClose={()=>setSelectedAccountToEdit(undefined)}>
                <div className="p-8">
                    <SettingsForm key={Math.random()} account={selectedAccountToEdit ?? null} roles={rolesSSR} onCancel={()=>setSelectedAccountToEdit(undefined)} onSuccess={() => {setSelectedAccountToEdit(undefined); accountsSWR.mutate()}}/>
                </div>
            </Modal>
            <Modal isOpened={otpModalOpened} title="Activer l'authentification á deux facteurs" onClose={()=>setOtpModalOpened(false)}>
                <TwoFactorAuthModal isOpen={true} onClose={()=>{}} qrData={qrData} userID={session.current?.user.id}/>
            </Modal>
        </AuthenticatedLayout>
    );
}

export async function getServerSideProps(){
    return {props: {rolesSSR: JSON.parse(JSON.stringify(await getRoles()))} as ServersideProps};
}