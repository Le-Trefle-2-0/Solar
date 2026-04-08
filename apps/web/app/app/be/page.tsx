"use client";
import {Chat} from "@/components/chat"
import {Page} from "@/components/ui"

export default function MainChat() {

    return (
        <Page title="Chat d'écoute" description="Espace d'écoute active et de soutien" className="p-0">
            <Chat channelID={"1"} statusID={0}/>
        </Page>
    );
}