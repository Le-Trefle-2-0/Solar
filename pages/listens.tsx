import useSWR from "swr";
import { fetcherAuth } from "../src/utils/fetcher";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";
import React, { useEffect, useState } from "react";
import { listens } from "@prisma/client";
import JoiDate from "@joi/date";
import moment from "moment"
import { NextRequest, NextResponse } from "next/server";
import { getListens } from "./api/listens";
import { ListenWithStatus } from "../src/interfaces/listens";

interface ListensPageProps{
  listensSSR: ListenWithStatus[]
}

export default function Listens({listensSSR} : ListensPageProps){
  const listensSwr = useSWR<ListenWithStatus[]|null>("/api/listens?not_done=true", fetcherAuth);
  const listens = listensSwr.data || listensSSR;
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
              <td>action</td>
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

export async function getServerSideProps(req: NextRequest, res: NextResponse){
  return {props: {listensSSR: JSON.parse(JSON.stringify(await getListens({NOT:{listen_status:{name:"commented"}}}))) as ListenWithStatus[]}};
}