import { setCookies } from "cookies-next";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { ReferenceActualEventContext } from "../../src/contexts/ReferenceGlobalCHatContext";
import session from "../../src/interfaces/session";
import LoginLayout from "../../src/layouts/login-layout";
import fetcher from "../../src/utils/fetcher";

export default function login(){
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const router = useRouter();
    const activeEventCtx = useContext(ReferenceActualEventContext);

    async function handleLogin(e: React.SyntheticEvent){
        e.preventDefault();
        if(name == "" || password == "") {setError(true); return;}
        let data = await fetcher<session>("/api/auth/login", "POST", {name:name, password:password}).catch(()=>null);
        if(data == null || !data.jwt){setError(true);} else {
            data.user.is_admin = ["admin"].includes(data.user.roles.name);
            data.user.is_ref = ["admin", "be_ref"].includes(data.user.roles.name);
            data.user.is_bot = ["bot"].includes(data.user.roles.name);
            setCookies("session", data);
            activeEventCtx.update();
            router.push("/");
        }
    }

    return(
        <LoginLayout>
            <h2>Le Trèfle 2.0</h2>
            <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
                <input 
                    type="text"
                    defaultValue={name}
                    onChange={({currentTarget:{value}})=>{setName(value);setError(false)}}
                    className="field mt-8"
                    placeholder="Identifiant" 
                />
                <input 
                    type="password"
                    defaultValue={password}
                    onChange={({currentTarget:{value}})=>{setPassword(value);setError(false)}}
                    className="field mt-8"
                    placeholder="Mot de passe"
                />
                <small className={`text-red-500 ${error?"opacity-100":"opacity-0"}`}>Les identifiants sont invalides</small>
                <input type="submit" value="Se connecter" className="btn mt-8"/>
            </form>
        </LoginLayout>
    )
}