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
    account: Omit<accounts, "password"> & {password ?: string, roles: roles} | null,
    onCancel?: () => void,
    onSuccess?: () => void
}>

export default function AccountForm({roles, account, onCancel, onSuccess}: FormProps){
    const {register, handleSubmit, formState: { errors }, control, setValue} = useForm({resolver: yupResolver(account?putSchema:postSchema), defaultValues:{
        role_id: account? parseInt(account.role_id.toString()) : null,
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
                    <label>Courriel</label>
                    <input className={`field ${errors.email?.message ? "error" : ""}`}
                    type="text" {...register("email")}/>
                    <div className="text-red-500">{errors.email?.message}</div>
                </div>
                <div className="mb-4">
                    <label>Rôle</label>
                    <Controller
                        control={control}
                        name="role_id"
                        render={({ field: {onChange, value, ref} })=>(   
                            <Select
                                ref={ref}
                                options={roles?.map(r=>({label: r.label, value: parseInt(r.id.toString())}))}
                                onChange={v => {onChange(v?.value)}}
                                defaultValue={roles?.filter(r=>parseInt(r.id.toString()) == value).map(r=>({label: r.label, value: parseInt(r.id.toString())}))[0]}
                                className={`field react-select ${ !!errors.role_id ? "error" : ""}`}
                                classNamePrefix="react-select"
                                placeholder="Sélectionnez..."
                            />
                        )}
                    />
                    <div className="text-red-500">{errors.role_id?.message}</div>
                </div>
                <div className="mb-4">
                    <label>{account ? "Changer le mot de passe ?" : "Mot de passe"}</label>
                    <input className={`field ${errors.password?.message ? "error" : ""}`}
                    type="text" {...register("password")}/>
                    {account ? <div>Ne replissez ce champ que si vous souhaitez changer le mot de passe du compte!</div> : null}
                    <div className="text-red-500">{errors.password?.message}</div>
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