import { useRouter } from "next/router";
import { useContext, useState } from "react";
import session from "../../../../src/interfaces/session";
import RecoverLayout from "../../../../src/layouts/recover-layout";
import fetcher from "../../../../src/utils/fetcher";
import useSWR from "swr";

export default function reset(){  
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    let checkToken = useSWR<null>(`/api/auth/checkrecover/?token=${router.query.token}`, fetcher);
    let accountName = checkToken.data || "";
    
    async function handleRecover(e: React.SyntheticEvent){
        e.preventDefault();
        if(password == "") setError(true);
        let data = await fetcher<session>("/api/auth/resetpassword", "POST", {password, token: router.query.token as string}).catch(()=>null);
        if(data == null){setError(true);} else {
            setSuccess(true);
        }
    }

    return(
        <RecoverLayout>
            <h2>{'Récupération de mot de passe - ' + accountName}</h2>
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
                    defaultValue={router.query.token as string}
                    className="hidden"
                />
                <small className={`text-red-500 ${error?"opacity-100":"opacity-0"}`}>Une erreur est survenue... Merci de réessayer !</small>
                <small className={`text-green-500 ${success?"opacity-100":"opacity-0"}`}>Votre mot de passe est bien modifié, vous pouvez maintenant vous connecter !</small>
                <input type="submit" value="Continuer" className="btn mt-4"/>
            </form>
        </RecoverLayout>
    )
}
