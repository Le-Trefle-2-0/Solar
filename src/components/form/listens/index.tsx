import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { useContext, PropsWithChildren, useEffect, useState } from "react";
import Select from 'react-select';
import { accounts, calendar_events, roles } from "@prisma/client";
import { ListenWithStatusAndAccounts } from "../../../interfaces/listens";
import useSWR from "swr";
import fetcher from "../../../../src/utils/fetcher";
import { ReferenceActualEventContext } from "../../../contexts/ReferenceGlobalCHatContext";
import { SocketState } from "../../../interfaces/socketState";
import { yupResolver } from "@hookform/resolvers/yup";
import { assignSchema } from "../../../../src/schemas/listensSchemas";

interface ServersideProps{
    accountsSSR: accounts[]
}

type FormProps = PropsWithChildren<{
    event?: calendar_events,
    listen: ListenWithStatusAndAccounts | undefined
    onCancel?: () => void,
    onSuccess?: () => void,
}>

export default function ListensForm({event, listen, onCancel, onSuccess}: FormProps){
    const {register, handleSubmit, formState: { errors }, control, setValue} = useForm({resolver: yupResolver(assignSchema), defaultValues:{
        account_ids: listen?.account_listen.map(al=>(al.accounts.id))
    }});
    const [showPostResult, setShowPostResult] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const router = useRouter();
    const accountsSwr = useSWR<accounts[]|null>(event ? `/api/events/${event?.id}/getAccounts?role_names=be` : null, fetcher);
    

    let accounts = accountsSwr.data || [];
    if(typeof accountsSwr.data == "string") accounts = [];
    
    const onSubmit = async (data: any) => {
        setLoading(true);
        let res = await fetcher<string>(`/api/listens/${listen?.id}/assignAccounts`, 'PUT', data).catch((e)=>{
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
            {showPostResult && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">Bénévole correctement ajouté</div>}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                    <label> Bénévole</label>
                    <Controller
                        control={control}
                        name="account_ids"
                        render={({ field: {onChange, value, ref} })=>(   
                            <Select
                                ref={ref}
                                options={accounts?.map(a=>({label: a.name, value: parseInt(a.id.toString())}))}
                                onChange={val => {onChange(val.map(v=>v.value))}}
                                defaultValue={accounts?.filter(a=>value?.includes(a.id)).map(a=>({label: a.name, value: parseInt(a.id.toString())}))}
                                isMulti
                                className={`field react-select ${ !!errors.account_ids?.length ? "error" : ""}`}
                                classNamePrefix="react-select"
                                placeholder="Sélectionnez..."
                            />
                        )}
                    />
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