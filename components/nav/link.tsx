"use client";

import {usePathname} from "next/navigation";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {IconProp} from "@fortawesome/fontawesome-svg-core";

export default function NavLink(props: { link: string, name: string, icon: IconProp }) {
    const pathname = usePathname();
    if (pathname == props.link) {
        return (
            <li>
                <a href={props.link}
                   className="flex items-center gap-2 border-s-[3px] border-main bg-fill px-4 py-3 text-main">
                    <FontAwesomeIcon icon={props.icon}/>
                    <span className="text-sm font-medium"> {props.name} </span>
                </a>
            </li>
        )
    } else return (
        <li>
            <a href={props.link}
               className="flex items-center gap-2 border-s-[3px] border-transparent px-4 py-3 text-gray-500 hover:border-gray-100 hover:bg-gray-50 hover:text-gray-700">
                <FontAwesomeIcon icon={props.icon}/>
                <span className="text-sm font-medium"> {props.name} </span>
            </a>
        </li>
    )
}