"use client";

import {Sidebar, SidebarItem, SidebarItemGroup, SidebarItems, SidebarLogo} from "flowbite-react";
import {HiArrowSmRight, HiChartPie, HiInbox, HiShoppingBag, HiTable, HiUser, HiViewBoards} from "react-icons/hi";

export default function Nav() {
    return (
        <Sidebar aria-label="Default sidebar example">
            <SidebarLogo href="#" img="/logo.svg" imgAlt="Le Trèfle 2.0 logo">
                Le Trèfle 2.0
            </SidebarLogo>
            <SidebarItems>
                <SidebarItemGroup>
                    <SidebarItem href="#" icon={HiChartPie}>
                        Dashboard
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiViewBoards} label="Pro" labelColor="dark">
                        Kanban
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiInbox} label="5">
                        Inbox
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiUser}>
                        Users
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiShoppingBag}>
                        Products
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiArrowSmRight}>
                        Sign In
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiTable}>
                        Sign Up
                    </SidebarItem>
                </SidebarItemGroup>
                <SidebarItemGroup>
                    <SidebarItem href="#" icon={HiChartPie}>
                        Upgrade to Pro
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiViewBoards}>
                        Documentation
                    </SidebarItem>
                    <SidebarItem href="#" icon={HiViewBoards}>
                        Help
                    </SidebarItem>
                </SidebarItemGroup>
            </SidebarItems>
        </Sidebar>
    );
}
