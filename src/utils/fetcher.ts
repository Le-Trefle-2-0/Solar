import { getCookie, removeCookies, setCookies } from "cookies-next";
import { useRouter } from "next/router";
import { Exception } from "sass";
import session from "../interfaces/session";
import getSession from "./get_session";
import { parseParams } from "./helper";

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
    let ses = getSession();
    let jwt = ses?.jwt;
    if(!jwt) {
      window.location.href = '/auth/login';
      return null;
    }
    options.headers["Authorization"] = `Bearer ${jwt}`;
  }
  let data = await fetch(url, options)
    .catch(e=>{
      throw new Error(e);
    })
    .then(
      (res) => {
        if(res.status == 401){
          removeCookies("session");
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
