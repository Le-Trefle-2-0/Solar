import { accounts } from "@prisma/client";
import { useRouter } from "next/router";
import { FormEventHandler, useState } from "react";
import LoginLayout from "../../src/layouts/login-layout";
import fetcher from "../../src/utils/fetcher";

interface ApiLoginReturnValues{
    jwt: string,
    user: accounts
}

export default function login(){
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.SyntheticEvent){
        e.preventDefault();
        let data: ApiLoginReturnValues|null = await fetcher<ApiLoginReturnValues>("/api/auth/login", "POST", {name:name, password:password}).catch(()=>null);
        if(data == null){setError(true);} else {
            localStorage.setItem("session_jwt", data.jwt);
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