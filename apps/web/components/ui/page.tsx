import React from "react";
import {cn} from "@/lib/utils";

interface PageProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
}

export function Page({
                         title,
                         description,
                         children,
                         className,
                         containerClassName,
                     }: PageProps) {
    return (
        <div className={cn("flex flex-col w-full h-full min-h-0", containerClassName)}>
            {(title || description) && (
                <div className="flex flex-col gap-1 p-6 pb-2 shrink-0">
                    {title && (
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    )}
                    {description && (
                        <p className="text-muted-foreground">{description}</p>
                    )}
                </div>
            )}
            <div className={cn("flex-1 p-6 pt-0 overflow-y-auto", className)}>
                {children}
            </div>
        </div>
    );
}
