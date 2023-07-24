import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { ReferenceActualEventContext } from "../../src/contexts/ReferenceGlobalCHatContext";
import session from "../../src/interfaces/session";
import RecoverLayout from "../../src/layouts/recover-layout";
import fetcher from "../../src/utils/fetcher";

export default function login(){
    const [email, setEmail] = useState("");
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const activeEventCtx = useContext(ReferenceActualEventContext);

    async function handleRecover(e: React.SyntheticEvent){
        e.preventDefault();
        if(email == "") {setError(true); return;}
        let data = await fetcher<session>("/api/auth/recover", "POST", {email:email}).catch(()=>null);
        if(data == null){setError(true);} else {
            setSuccess(true);
        }
    }

    return(
        <RecoverLayout>
            <h2>Récupération de mot de passe</h2>
            <form onSubmit={handleRecover} className="flex flex-col items-center w-full">
                <input 
                    type="text"
                    defaultValue={email}
                    onChange={({currentTarget:{value}})=>{setEmail(value);setError(false)}}
                    className={`field mt-8 ${success?"hidden":""}`}
                    placeholder="Adresse courriel" 
                />
                <small className={`text-red-500 ${error?"opacity-100":"opacity-0"}`}>Une erreur est survenue... Merci de réessayer !</small>
                <small className={`text-green-500 ${success?"opacity-100":"opacity-0"}`}>Un courriel de confirmation vous á été envoyé, merci de vérifier votre messagerie !</small>
                <input type="submit" value="Continuer" className="btn mt-4"/>
            </form>
        </RecoverLayout>
    )
}