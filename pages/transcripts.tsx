import { listens } from "@prisma/client";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import useSWR from "swr";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import fetcher from "../src/utils/fetcher";
import getSession from "../src/utils/get_session";
import { getListens } from './api/listens/index';

interface ServersideProps{
    listensSSR: listens[]
}

export default function Listens({listensSSR}: ServersideProps){
    const router = useRouter();
    const session = useRef(getSession());
    const listensSWR = useSWR<listens[]|null>(`/api/listens?for_transcript=true`, fetcher);
    let listens = listensSWR.data || listensSSR;
    if(typeof listensSWR.data == "string") listens = [];
    let basePath = "";
    if(typeof window !== 'undefined') basePath = window.location.protocol+"//"+window.location.host
    
    useEffect(()=>{
        if(!session.current?.user.is_admin) router.push("/");
    }, []);
  
  
    return (
        <AuthenticatedLayout>
            <div className="flex items-center mb-8 justify-between">
                <h2 className="">TRANSCRIPTS</h2>
            </div>
            <table>
                <thead> 
                    <tr>
                        <th>Numéro</th>
                        <th>Age de l'utilisateur</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    { !!listens && listens.length > 0 ? listens.map((l,k)=>(
                        <tr key={"listen" + l.id} className={`${k%2 == 1 ? "odd":""}`}>
                            <td>{l.id}</td>
                            <td>{l.is_user_minor ? "mineur" : "majeur"}</td>
                            <td className="flex justify-end">
                                <a href={`${basePath}/api/listens/${l.id}/getTranscript`} target="_blank" className="btn py-0.5 -my-1 mr-2">
                                    Récupérer transcript
                                </a>
                                <button className="btn py-0.5 -my-1" onClick={async()=>{
                                    if(confirm("Voulez-vous vraiment supprimer l'historique des messages de cette écoute?\nVeillez à bien avoir enregistré le transcript.\nCette action est irréversible!")){
                                        await fetcher(`/api/listens/${l.id}/deleteHistory`, 'DELETE')
                                        listensSWR.mutate()
                                    }
                                }}>Supprimer historique des messages</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={4}>Aucun transcript n'a été trouvé</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </AuthenticatedLayout>
    );
  }

  export async function getServerSideProps(){
      return {props: {listensSSR: JSON.parse(JSON.stringify(await getListens({listen_status:{name:{in:["commented","closed"]}}, listen_message:{some:{message_id:{gt:0}}}})))} as ServersideProps};
  }