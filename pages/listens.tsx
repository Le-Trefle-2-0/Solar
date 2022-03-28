import react, {useEffect, useState} from "react";
import useSWR from "swr";
import fetcher from "../src/utils/fetcher";
import { NextRequest, NextResponse } from "next/server";
import AuthenticatedLayout from "../src/layouts/authenticated-layout";


export default function Listens(){
  //const valSwr = useSWR<{data: string}>("/api/val", fetcher);

  //let valData: {data: string} = valSwr.data || val;
  return (
    <AuthenticatedLayout>
      test
    </AuthenticatedLayout>
  );
}

// SSR
/*
export async function getServerSideProps(req: NextRequest, res: NextResponse){
  return null;
}
*/