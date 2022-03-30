import useSWR from "swr";
import { fetcherAuth } from "../../src/utils/fetcher";
import AuthenticatedLayout from "../../src/layouts/authenticated-layout";
import React, { useEffect, useState } from "react";
import { listens } from "@prisma/client";
import JoiDate from "@joi/date";
import moment from "moment"
import { NextRequest, NextResponse } from "next/server";
import { getListens } from "../api/listens";
import { ListenWithStatus } from "../../src/interfaces/listens";
import { useRouter } from "next/router";

export default function Listens(){
  const router = useRouter();
  const listenSwr = useSWR<ListenWithStatus|null>(`/api/listens/${router.query.id}?not_done=true`, fetcherAuth);
  const listen = listenSwr.data || [];

  console.log(listen)

  return (
    <AuthenticatedLayout>
      
    </AuthenticatedLayout>
  );
}