import { Exception } from "sass";
import { parseParams } from "./helper";

export default async function fetcher<T>(url: string, method?:string, body?: BodyInit, query?: any, authenticated?:boolean) : Promise<T|null>  {
  let options = {
    method: method || "GET",
    headers: {},
  } as {method: string, body: BodyInit|null, headers:any};
  if(body != undefined) {
    options.body = JSON.stringify(body);
    options.headers["Content-Type"] = `application/json`;
  }
  if(query != undefined) url += parseParams(query);
  if(!!authenticated){
    let jwt = localStorage.getItem("session_jwt");
    if(!jwt) return null;
    options.headers["Authorization"] = `Bearer ${jwt}`;
  }
  let data = await fetch(url, options)
    .catch(e=>{console.log(e);throw new Error(e)})
    .then(
      (res) => {
        if(res.headers.get("Content-Type") == "application/json"){
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
