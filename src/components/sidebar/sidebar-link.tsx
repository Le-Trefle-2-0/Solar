import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";

interface NavLinkProps{
  text: string,
  icon: IconProp,
  path: string
}

export default function NavLink({text, icon, path} : NavLinkProps){
  const router = useRouter();
  return (
    <div 
      className={`sidebar-link ${router.pathname.startsWith(path) ? "active" : ""}`}
      onClick={()=>{if(!router.pathname.startsWith(path)) router.push(path)}}
    >
      <FontAwesomeIcon icon={icon} className="mr-3"/>
      {text}
    </div>
  );
}