import useSWR from "swr";
import { fetcherAuth } from "../../src/utils/fetcher";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import React from "react";
import moment from "moment"
import { ListenWithStatus } from "../../src/interfaces/listens";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";

export default function Listens(){
  const router = useRouter();
  const listensSwr = useSWR<ListenWithStatus[]|null>("/api/listens?not_done=true", fetcherAuth);
  const listens = listensSwr.data || [];

  return (
    <AuthenticatedLayout>
      <table>
        <thead> 
          <tr>
            <th>Numéro</th>
            <th>Age de l'utilisateur</th>
            <th>Date début</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          { listens && listens.length > 0 ? listens.map((l,k)=>(
            <tr key={"listen" + l.id} className={k%2 == 1 ? "odd":""}>
              <td>{l.id}</td>
              <td>{l.is_user_minor ? "mineur" : "majeur"}</td>
              <td>{moment(l.date_time_start).format("DD/MM/YYYY HH:mm")}</td>
              <td>{l.listen_status.label}</td>
              <td className="flex justify-end">
                <button className="btn" onClick={()=>router.push(`/listens/${l.id}`)}>Go <FontAwesomeIcon icon={faAngleRight} className="text-sm"/></button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4}>Aucune écoute n'a été trouvé</td>
            </tr>
          )}
        </tbody>
      </table>
    </AuthenticatedLayout>
  );
}