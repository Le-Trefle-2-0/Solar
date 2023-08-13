import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { PropsWithChildren, useState } from "react";
import Select from 'react-select';
import { accounts, roles } from "@prisma/client";
import fetcher from "../../../../src/utils/fetcher";
import { yupResolver } from "@hookform/resolvers/yup";
import { putSchema } from "../../../schemas/account";
import { postSchema } from './../../../schemas/account';

interface ServersideProps{
    accountsSSR: accounts[]
}

type FormProps = PropsWithChildren<{
    roles: roles[],
    account: Omit<accounts, "password"> & {password ?: string} | null,
    onCancel?: () => void,
    onSuccess?: () => void
}>

export default function SettingsForm({roles, account, onCancel, onSuccess}: FormProps){
    const {register, handleSubmit, formState: { errors }, control, setValue} = useForm({resolver: yupResolver(account?putSchema:postSchema), defaultValues:{
        name: account?.name,
        password: "",
        email: account?.email
    }});
    const [showPostResult, setShowPostResult] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const router = useRouter();
    
    const onSubmit = async (data: any) => {
        setLoading(true);
        let res = await fetcher<string>(`/api/accounts${account ? '/'+account.id : ""}`, account ? 'PUT' : 'POST', data).catch((e)=>{
            //setError()
            setLoading(false);
        })
        if(res){
            setShowPostResult(true);
            setTimeout(() => {
                onSuccess?.call(undefined)
            }, 2000)
        }
    };

    return (
        <>
            {showPostResult && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">Compte(s) correctement {account ? "modifié" : "ajouté"}</div>}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                    <label>Nom de compte</label>
                    <input className={`field ${errors.name?.message ? "error" : ""}`}
                    type="text" {...register("name")}/>
                    <div className="text-red-500">{errors.name?.message}</div>
                </div>
                <div className="mb-4">
                    <label>Adresse courriel</label>
                    <input className={`field ${errors.email?.message ? "error" : ""}`}
                    type="text" {...register("email")}/>
                    <div className="text-red-500">{errors.email?.message}</div>
                </div>
                <div className="flex justify-end">
                    <input type="button" value="Annuler" className="btn fake-white mr-2" onClick={()=> {onCancel?.call(undefined)}}/>
                    <input type="submit" value={"Ajouter"} className={`btn ${loading ? "opacity-50 pointer-events-none" : ""}`}/>
                </div>
            </form>
        </>
    )
}

/*


*/