import { setCookies } from "cookies-next";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { ReferenceActualEventContext } from "../../src/contexts/ReferenceGlobalCHatContext";
import TwoFactorAuthForm from "../../src/components/form/2fa";
import session from "../../src/interfaces/session";
import LoginLayout from "../../src/layouts/login-layout";
import fetcher from "../../src/utils/fetcher";

export default function login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const router = useRouter();
    const activeEventCtx = useContext(ReferenceActualEventContext);

    async function authCookie(data: { user: {
        otp_enabled: boolean; is_admin: boolean; roles: { name: string; }; is_ref: boolean; is_bot: boolean; is_listener: boolean; is_training: boolean; 
    }; }) {
        data.user.is_admin = (["admin"].includes(data.user.roles.name) && data.user.otp_enabled);
        data.user.is_ref = (["admin", "be_ref"].includes(data.user.roles.name) && data.user.otp_enabled);
        data.user.is_bot = ["bot"].includes(data.user.roles.name);
        data.user.is_listener = ["be"].includes(data.user.roles.name);
        data.user.is_training = ["training"].includes(data.user.roles.name);
        setCookies("session", data);
        activeEventCtx.update();
        router.push("/");
    }

    async function handleLogin(e: React.SyntheticEvent){
        e.preventDefault();
        if(email == "" || password == "") {setError(true); return;}
        let data = await fetcher<session>("/api/auth/login", "POST", {email:email, password:password}).catch(()=>null);
        console.log(data)
        if(data == null) {
            setError(true);
        } else if (data.user.otp_enabled) {
            setIsPopupOpen(true);
        } else {
            authCookie(data);
        }
    }

    async function handle2FA(code: string){
        let data = await fetcher<session>("/api/auth/login", "POST", {email:email, password:password, otp: code}).catch(()=>null);
        if(data == null) {
            setError(true);
        } else {
            authCookie(data);
        }
    }

    return(
        <div>
            <LoginLayout>
                <h2>Le Trèfle 2.0</h2>
                <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
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
                    <small className={`text-red-500 ${error?"opacity-100":"opacity-0"}`}>Email ou mot de passe invalide !</small>
                    <input type="submit" value="Se connecter" className="btn mt-8"/>
                    <a href="/auth/recover" className="mt-8 h-4">Mot de passe oublié ?</a>
                </form>

            </LoginLayout>
            <TwoFactorAuthForm isOpen={isPopupOpen} submit={handle2FA} />
        </div>
    )
}