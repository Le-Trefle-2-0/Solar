"use client";

import {HiInbox} from "react-icons/hi";
import {usePathname} from "next/navigation";

export default function NavLink(props: { link: string, name: string, icon: string }) {
    const pathname = usePathname();
    if (pathname == props.link) {
        return (
            <li>
                <a href={props.link}
                   className="flex items-center gap-2 border-s-[3px] border-main bg-fill px-4 py-3 text-main">
                    <HiInbox/>
                    <span className="text-sm font-medium"> {props.name} </span>
                </a>
            </li>
        )
    } else return (
        <li>
            <a href={props.link}
               className="flex items-center gap-2 border-s-[3px] border-transparent px-4 py-3 text-gray-500 hover:border-gray-100 hover:bg-gray-50 hover:text-gray-700">
                <HiInbox/>

                <span className="text-sm font-medium"> {props.name} </span>
            </a>
        </li>
    )
}