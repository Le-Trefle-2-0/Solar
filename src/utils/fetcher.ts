import { useRouter } from "next/router";
import { Exception } from "sass";
import { parseParams } from "./helper";
import SessionStorage from "./session_storage";

export default async function fetcher<T>(url: string, method?:string, body?: any, query?: any, authenticated?:boolean) : Promise<T|null>  {
  let options = {
    method: method || "GET",
    headers: {},
  } as {method: string, body: any, headers:any};
  if(body != undefined) {
    options.body = JSON.stringify(body);
    options.headers["Content-Type"] = `application/json`;
  }
  if(query != undefined) url += parseParams(query);
  if(!!authenticated){
    const session = SessionStorage.session;
    let jwt = session?.jwt || localStorage.getItem("session_jwt");
    if(!jwt) return null;
    options.headers["Authorization"] = `Bearer ${jwt}`;
  }
  let data = await fetch(url, options)
    .catch(e=>{
      throw new Error(e);
    })
    .then(
      (res) => {
        if(res.status == 401){
          SessionStorage.session = null;
          localStorage.removeItem("session_jwt");
          window.location.href = '/auth/login';
          return null;
        }
        if(res.headers.get('content-type')?.includes('application/json')){
          return res.json()
        } else {
          return res.text();
        }
      }
    );
  return data as T || null;
}
export function fetcherAuth<T>(url: string, method?:string, body?: any, query?: any) : Promise<T|null> {
  return fetcher<T>(url, method, body, query, true);
}
