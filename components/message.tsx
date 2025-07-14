"use client";
import type {Reaction} from "@/generated/prisma";
import React, {RefObject, useEffect, useState} from "react";
import {
    Badge,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui";
import {EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch} from "@/components/ui/emoji-picker";
import {Bot, Ellipsis, IdCardLanyard, Reply, SmilePlus, Trash2} from "lucide-react";
import Image from "next/image";
import {Socket} from "socket.io-client";
import {toast} from "sonner";

export function Message(props: {
    prevDate: number,
    currentDate: number,
    timestamp: number,
    reactions: Reaction[],
    isLastInBlock: boolean,
    showAuthorInfo: boolean,
    isAuthor: boolean,
    profilePicture: string,
    authorRole: string,
    authorName: string,
    content: string,
    userID: string,
    socket: RefObject<Socket | null>,
    id: number,
    channelId: string,
}) {
    const {
        prevDate,
        currentDate,
        timestamp,
        reactions,
        isLastInBlock,
        showAuthorInfo,
        isAuthor,
        profilePicture,
        authorRole,
        authorName,
        content,
        userID,
        socket,
        id,
        channelId
    } = props;

    const tenorGifRegex = /^https:\/\/media\.tenor\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.gif$/;

    const showDateSeparator = prevDate !== null && new Date(currentDate).toDateString() !== new Date(prevDate).toDateString()

    const dateObj = new Date(timestamp)
    const now = new Date()
    const yesterday = new Date()
    yesterday.setDate(now.getDate() - 1)
    const [reactionList, setReactionList] = useState<Reaction[]>(reactions);

    const isToday = dateObj.toDateString() === now.toDateString()
    const isYesterday = dateObj.toDateString() === yesterday.toDateString()

    const formattedDate = isToday
        ? dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
        : isYesterday
            ? `Hier ${dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`
            : dateObj.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })

    const [reactionMap, setReactionMap] = useState<{ [emoji: string]: Reaction[] }>();

    useEffect(() => {
        const map: { [emoji: string]: Reaction[] } = {};
        (reactionList ?? []).forEach(r => {
            if (!map[r.emoji]) map[r.emoji] = [];
            map[r.emoji].push(r);
        });
        setReactionMap(map);
    }, [reactionList]);

    const [isOpen, setIsOpen] = useState(false);

    socket.current?.on('reactionAdd', (data) => {
        console.log(data);
        setReactionList((reactions) => [...reactions, data]);
    });

    socket.current?.on('reactionRemove', (data) => {
        console.log(data);
        setReactionList(prev =>
            (prev ?? []).filter(r => r.id !== data)
        );
    })

    const sendReaction = (emoji: string) => {
        fetch('/api/reaction', {
            method: "POST",
            body: JSON.stringify({
                emoji,
                messageID: id,
                authorID: userID,
                reaction: emoji,
                option: "add"
            }),
        }).then(res => res.json()).then(res => {
            if (!res.success) return toast("Erreur lors de l'ajout de la réaction")
            socket.current?.emit("reaction", {channelId, reaction: res.reaction});
            setReactionList((reactions) => [...reactions, res.reaction]);
        });
    }

    const removeReaction = (reactionID: string, reaction: string) => {
        fetch('/api/reaction', {
            method: "POST",
            body: JSON.stringify({
                id: reactionID,
                messageID: id,
                reaction,
                authorID: userID,
                option: "remove"
            })
        }).then(res => res.json())
            .then(res => {
                if (res.success) {
                    socket.current?.emit("reactionRemove", {channelId, reactionID});
                    setReactionList(prev =>
                        (prev ?? []).filter(r => r.id !== reactionID)
                    );
                }
            })
            .catch(err => {
                console.error("Erreur", err);
            });
    }

    return (
        <React.Fragment>
            {showDateSeparator && (
                <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-4 text-xs text-gray-500">
                        {new Date(currentDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
            )}
            <div
                className={`relative group w-full flex flex-row gap-2 ${isLastInBlock ? 'mb-6' : ''} hover:bg-gray-100 rounded-lg px-2`}>
                <div
                    className="absolute -top-4 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Popover onOpenChange={setIsOpen} open={isOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <SmilePlus/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-fit p-0">
                            <EmojiPicker
                                className="h-[342px]"
                                onEmojiSelect={({emoji}) => {
                                    setIsOpen(false);
                                    sendReaction(emoji);
                                }}
                                locale="fr"
                            >
                                <EmojiPickerSearch/>
                                <EmojiPickerContent/>
                                <EmojiPickerFooter/>
                            </EmojiPicker>
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Ellipsis/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <Reply/> Répondre
                            </DropdownMenuItem>
                            {
                                isAuthor ?
                                    <DropdownMenuItem>
                                        <Trash2/> Supprimer
                                    </DropdownMenuItem> : null
                            }
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(id.toString())}>
                                <IdCardLanyard/> Copier l'identifiant
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="w-12 flex-shrink-0 flex flex-col items-center justify-start pt-1">
                    {showAuthorInfo ? (
                        <Image
                            src={profilePicture ? profilePicture : '/logo.svg'}
                            alt="Image de profil"
                            width={48}
                            height={48}
                            className="rounded-xl max-h-[48px]"
                        />
                    ) : (
                        <span className="hidden group-hover:block text-xs text-gray-500">
                            {dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </span>
                    )}
                </div>
                <div>
                    {showAuthorInfo && (
                        <div className="flex flex-row items-center gap-4 mb-1">
                            <span
                                className={
                                    authorRole === 'bot'
                                        ? 'font-semibold text-sm text-blue-800 flex flex-row gap-3'
                                        : 'font-semibold text-sm text-gray-900 flex flex-row gap-3'
                                }
                            >
                              {authorName}
                                {authorRole === 'bot' &&
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-600 text-white dark:bg-blue-800"
                                    >
                                        <Bot/>
                                        BOT
                                    </Badge>}
                            </span>
                            <span className="font-light text-sm text-gray-900">{formattedDate}</span>
                        </div>
                    )}
                    <h3 className="text-lg text-gray-900 whitespace-pre-wrap break-words max-w-full">
                        {tenorGifRegex.test(content) ? (
                            <Image src={content} alt="gif" height={256} width={256} unoptimized
                                   className="rounded-xl p-2"/>
                        ) : (
                            content
                        )}
                    </h3>
                    {Object.entries(reactionMap ?? {}).length > 0 && (
                        <div className="flex flex-row gap-2 mt-2">
                            {Object.entries(reactionMap ?? {}).map(([emoji, list]) => (
                                <Badge
                                    key={emoji}
                                    variant={list.some(r => r.userID === userID) ? "secondary" : "outline"}
                                    className={list.some(r => r.userID === userID) ? "text-base bg-blue-300 dark:bg-blue-800 cursor-pointer" : "text-base cursor-pointer"}
                                    onClick={() => {
                                        if (list.some(r => r.userID === userID)) {
                                            const reaction = list.find(r => r.userID === userID);
                                            if (!reaction) return;
                                            removeReaction(reaction.id, emoji)
                                        } else sendReaction(emoji);
                                    }}
                                >
                                    {emoji} {list.length}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    )
}