import useSWR from "swr";
import fetcher from "../../src/utils/fetcher";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import React, { useRef, useState } from "react";
import moment from "moment"
import { ListenWithStatusAndAccounts } from "../../src/interfaces/listens";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import getSession from "../../src/utils/get_session";
import Modal from "../../src/components/modal";

export default function Listens(){
  const router = useRouter();
  const listensSwr = useSWR<ListenWithStatusAndAccounts[]|null>("/api/listens?not_done=true&with_users=true", fetcher);
  let listens = listensSwr.data || [];
  if(typeof listensSwr.data == "string") listens = [];
  const session =  useRef(getSession());
  let [selectedListenToAssign, setSelectedListenForAssign] = useState<ListenWithStatusAndAccounts>();

  return (
    <AuthenticatedLayout>
    <div className="flex items-center mb-8 justify-between">
      <h2 className="">ÉCOUTES</h2>
    </div>
      <table>
        <thead> 
          <tr>
            <th>Numéro</th>
            <th>Age de l'utilisateur</th>
            <th>Date début</th>
            <th>Status</th>
            { session.current?.user.is_ref ? <th>Nombre de bénévoles assignés</th> : null }
            <th></th>
          </tr>
        </thead>
        <tbody>
          { !!listens && listens.length > 0 ? listens.map((l,k)=>(
            <tr key={"listen" + l.id} className={`${k%2 == 1 ? "odd":""} ${l.account_listen.length<=0 ? "text-red-500" : ""}`}>
              <td>{l.id}</td>
              <td>{l.is_user_minor ? "mineur" : "majeur"}</td>
              <td>{moment(l.date_time_start).format("DD/MM/YYYY HH:mm")}</td>
              <td>{l.listen_status.label}</td>
              { session.current?.user.is_ref ? <td>{l.account_listen.length}</td> : null }
              <td className="flex justify-end">
                {session.current?.user.is_ref ?
                  <button className="btn py-0.5 -my-1 mr-2" onClick={()=>setSelectedListenForAssign(l)}>Assigner bénévoles</button>
                : null}
                <button className="btn py-0.5 -my-1" onClick={()=>router.push(`/listens/${l.id}`)}>Go <FontAwesomeIcon icon={faAngleRight} className="text-sm"/></button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4}>Aucune écoute n'a été trouvé</td>
            </tr>
          )}
        </tbody>
      </table>
      <Modal isOpened={selectedListenToAssign != undefined} title={`Assigner bénévole à l'écoute ${selectedListenToAssign?.id}`} onClose={()=>setSelectedListenForAssign(undefined)}>
        <div className="p-8">
          
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
