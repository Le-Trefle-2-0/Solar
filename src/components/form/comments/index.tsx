import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/router";
import { useContext, PropsWithChildren, useEffect, useState } from "react";
import Select from 'react-select';
import { accounts, calendar_events, roles } from "@prisma/client";
import useSWR from "swr";
import fetcher from "../../../../src/utils/fetcher";
import { ReferenceActualEventContext } from "../../../contexts/ReferenceGlobalCHatContext";
import { SocketState } from "../../../interfaces/socketState";
import { yupResolver } from "@hookform/resolvers/yup";
import { ListenWithStatusAndAccounts } from "../../../interfaces/listens";
import { putSchema } from "../../../schemas/listensSchemas";

interface ServersideProps{
    accountsSSR: accounts[]
}

type FormProps = PropsWithChildren<{
    listen: ListenWithStatusAndAccounts | undefined
    onCancel?: () => void,
    onSuccess?: () => void,
}>

export default function CommentsForm({ listen, onCancel, onSuccess}: FormProps){
    const {register, handleSubmit, formState: { errors }} = useForm({resolver: yupResolver(putSchema), defaultValues:{
        volunteer_notes_encrypted: listen?.volunteer_notes_encrypted,
        volunteer_main_observations_encrypted: listen?.volunteer_main_observations_encrypted
    }});
    const [showPostResult, setShowPostResult] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    
    const onSubmit = async (data: any) => {
        setLoading(true);
        let res = await fetcher<string>(`/api/listens/${listen?.id}`, 'PUT', data).catch((e)=>{
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
            {showPostResult && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">Commentaires correctement ajouté</div>}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                    <label>Notes</label>
                    <textarea className={`field  ${errors.volunteer_notes_encrypted ? "error" : ""}`}
                    {...register("volunteer_notes_encrypted")} rows={4}></textarea>
                    <div className="text-red-500">{errors.volunteer_notes_encrypted?.message}</div>
                </div>
                <div className="mb-4">
                    <label>Observations</label>
                    <textarea className={`field ${errors.volunteer_main_observations_encrypted ? "error" : ""}`}
                    {...register("volunteer_main_observations_encrypted")} rows={4}></textarea>
                    <div className="text-red-500">{errors.volunteer_main_observations_encrypted?.message}</div>
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