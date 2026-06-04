import React from "react";
import {cn} from "@/lib/utils";

interface PageProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
    hideHeader?: boolean;
}

export function Page({
                         title,
                         description,
                         children,
                         className,
                         containerClassName,
                         hideHeader = false,
                     }: PageProps) {
    return (
        <div className={cn("flex flex-col w-full", containerClassName)}>
            {!hideHeader && (title || description) && (
                <div className="flex flex-col gap-1 p-6 pl-14 pb-2">
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
