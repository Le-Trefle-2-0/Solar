"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import {cn} from "@/lib/utils"

function Tabs({
                  className,
                  ...props
              }: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            className={cn("flex flex-col gap-2", className)}
            {...props}
        />
    )
}

function TabsList({
                      className,
                      ...props
                  }: React.ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                "bg-muted/50 text-muted-foreground inline-flex h-10 w-fit items-center justify-center rounded-lg p-1 border shadow-sm",
                className
            )}
            {...props}
        />
    )
}

function TabsTrigger({
                         className,
                         ...props
                     }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            className={cn(
                "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 text-muted-foreground/80 hover:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                className
            )}
            {...props}
        />
    )
}

function TabsContent({
                         className,
                         ...props
                     }: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn("flex-1 outline-none", className)}
            {...props}
        />
    )
}

export {Tabs, TabsList, TabsTrigger, TabsContent}
