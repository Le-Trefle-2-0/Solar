import React from "react";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";
import {cn} from "@/lib/utils";

interface PageProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    hideHeader?: boolean;
    /** Link back to the parent page, above the title. */
    back?: { href: string; label: string };
}

export function Page({
                         title,
                         description,
                         children,
                         className,
                         containerClassName,
                         hideHeader = false,
                         back,
                     }: PageProps) {
    return (
        <div className={cn("flex flex-col w-full", containerClassName)}>
            {!hideHeader && (title || description) && (
                <div className="flex flex-col gap-1 p-6 pl-14 pb-2">
                    {back && (
                        <Link href={back.href}
                              className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <ArrowLeft className="size-4" aria-hidden/> {back.label}
                        </Link>
                    )}
                    {title && (
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    )}
                    {description && (
                        <p className="text-muted-foreground">{description}</p>
                    )}
                </div>
            )}
            <div className={cn("p-6 pt-0", hideHeader && "pt-6", className)}>
                {children}
            </div>
        </div>
    );
}
