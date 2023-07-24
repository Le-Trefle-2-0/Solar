import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { ReferenceActualEventContext } from "../../../src/contexts/ReferenceGlobalCHatContext";
import session from "../../../src/interfaces/session";
import RecoverLayout from "../../../src/layouts/recover-layout";
import fetcher from "../../../src/utils/fetcher";
import useSWR from "swr";
import axios from "axios";

async function get(url: string, data: any) {
    await axios.get(url, data).then((res) =>  {
        return res.data
    });
}

export default async function reset(){
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const activeEventCtx = useContext(ReferenceActualEventContext);
    const token = router.query.token as string;
    let accountName = '';
    await axios.post(`/api/auth/recover/`, {
        token: token
    }).then((res) =>  {
        accountName = res.data
    });
    console.log(accountName)

    if (!accountName) {
        return router.push("/auth/login");
    }

    async function handleRecover(e: React.SyntheticEvent){
        e.preventDefault();
        if(password == "") {setError(true); return;}
        let data = await fetcher<session>("/api/auth/recover", "POST", {password:password}).catch(()=>null);
        if(data == null){setError(true);} else {
            setSuccess(true);
        }
    }

    return(
        <RecoverLayout>
            <h2>{'Récupération de mot de passe - ' + accountName.toString()}</h2>
            <form onSubmit={handleRecover} className="flex flex-col items-center w-full">
                <input 
                    type="text"
                    defaultValue={password}
                    onChange={({currentTarget:{value}})=>{setPassword(value);setError(false)}}
                    className={`field mt-8 ${success?"hidden":""}`}
                    placeholder="Nouvau mot de passe" 
                />
                <input
                    type="text"
                    defaultValue={token}
                    className="hidden"
                />
                <small className={`text-red-500 ${error?"opacity-100":"opacity-0"}`}>Une erreur est survenue... Merci de réessayer !</small>
                <small className={`text-green-500 ${success?"opacity-100":"opacity-0"}`}>Un courriel de confirmation vous á été envoyé, merci de vérifier votre messagerie !</small>
                <input type="submit" value="Continuer" className="btn mt-4"/>
            </form>
        </RecoverLayout>
    )
}