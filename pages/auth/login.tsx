import { setCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { ReferenceActualEventContext } from "../../src/contexts/ReferenceGlobalCHatContext";
import TwoFactorAuthForm from "../../src/components/form/2fa";
import session from "../../src/interfaces/session";
import LoginLayout from "../../src/layouts/login-layout";
import fetcher from "../../src/utils/fetcher";
// import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { auth, signIn } from "@/auth";

type data = { 
    jwt: string,
    otp: boolean,
    user: {
        json: {
            otp_enabled: boolean;
            roles: { name: string; };
            is_admin: boolean;
            is_ref: boolean;
            is_bot: boolean;
            is_listener: boolean;
            is_training: boolean; 
        }
    }
}

export default function login(){
    useEffect(()=>{
        (async()=>{
            let ses = await auth();
            if(ses){
                router.push("/events");
            }
        })()
    },[])

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const router = useRouter();
    const activeEventCtx = useContext(ReferenceActualEventContext);

    async function authCookie(data: data) {
        data.user.json.otp_enabled = true;
        data.user.json.is_admin = (["admin"].includes(data.user.json.roles.name) && data.user.json.otp_enabled);
        data.user.json.is_ref = (["admin", "be_ref"].includes(data.user.json.roles.name) && data.user.json.otp_enabled);
        data.user.json.is_bot = ["bot"].includes(data.user.json.roles.name);
        data.user.json.is_listener = ["be"].includes(data.user.json.roles.name);
        data.user.json.is_training = ["training"].includes(data.user.json.roles.name);
        setCookie("session", data);
        activeEventCtx.update();
        router.push("/");
    }

    async function handleLogin(e: React.SyntheticEvent){
        e.preventDefault();
        let res = await signIn("credentials", {
            email,
            password,
            redirectTo: "/events"
        });
        if (res?.ok) {
            console.log("success");
            return;
        } else {
            setError(true);
            console.log("Failed", res);
        }
        return res;
    }

    // async function handle2FA(code: string){
    //     let data = await fetcher<session>("/api/auth/login", "POST", {email:email, password:password, otp: code}).catch(()=>null);
    //     if(data == null) {
    //         setError(true);
    //     } else {
    //         authCookie(data);
    //     }
    // }

    return(
        <div>
            <LoginLayout>
                <h2>Le Trèfle 2.0</h2>
                <form className="flex flex-col items-center w-full" action={async () => {
                    "use server"
                    await signIn("credentials", {
                        email,
                        password,
                        redirectTo: "/events"
                    });
                }}>
                    <input 
                        type="text"
                        defaultValue={email}
                        onChange={({currentTarget:{value}})=>{setEmail(value);setError(false)}}
                        className="field mt-8"
                        placeholder="Adresse courriel" 
                    />
                    <input 
                        type="password"
                        defaultValue={password}
                        onChange={({currentTarget:{value}})=>{setPassword(value);setError(false)}}
                        className="field mt-8"
                        placeholder="Mot de passe"
                    />
                    <input
                        type="text"
                        placeholder="Code A2F"
                        className="invisible field mt-8"
                    />
                    <small className={`text-red-500 ${error?"opacity-100":"opacity-0"}`}>Email ou mot de passe invalide !</small>
                    <input type="submit" value="Se connecter" className="btn mt-8"/>
                    <a href="/auth/recover" className="mt-8 h-4">Mot de passe oublié ?</a>
                </form>

            </LoginLayout>
            {/* <TwoFactorAuthForm isOpen={isPopupOpen} submit={handle2FA} /> */}
        </div>
    )
}
