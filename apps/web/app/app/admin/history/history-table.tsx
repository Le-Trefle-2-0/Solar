"use client";

import * as React from "react";
import {useEffect, useState} from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import {ArrowUpDown, ExternalLink} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {apiFetch} from "@/lib/api";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {Skeleton} from "@/components/ui/skeleton";
import Link from "next/link";

interface TicketHistory {
    id: number;
    channelId: string;
    createdAt: string;
    updatedAt: string;
    duration: number;
    statusName: string;
    statusLabel: string;
    problematic?: string;
    observations?: string;
    info?: string;
    user?: {
        id: string;
        name: string;
        displayUsername?: string;
    };
}

export function HistoryTable({userId}: { userId?: string }) {
    const [data, setData] = useState<TicketHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([]);

    useEffect(() => {
        apiFetch("/v1/tickets/history")
            .then((res) => {
                if (res.success) {
                    let tickets = res.tickets;
                    if (userId) {
                        tickets = tickets.filter((t: TicketHistory) => t.user?.id === userId);
                    }
                    setData(tickets);
                }
            })
            .finally(() => setLoading(false));
    }, [userId]);


    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
    };

    const columns: ColumnDef<TicketHistory>[] = [
        {
            accessorKey: "id",
            header: ({column}) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    ID <ArrowUpDown className="ml-2 h-4 w-4"/>
                </Button>
            ),
            cell: ({row}) => <div className="ml-4 font-medium">#{row.getValue("id")}</div>,
        },
        {
            accessorKey: "createdAt",
            header: "Date",
            cell: ({row}) => format(new Date(row.getValue("createdAt")), "d MMMM yyyy HH:mm", {locale: fr}),
        },
        {
            accessorKey: "duration",
            header: "Durée",
            cell: ({row}) => formatDuration(row.getValue("duration")),
        },
        {
            id: "volunteer",
            header: "Bénévole",
            cell: ({row}) => {
                const user = row.original.user;
                return user ? (user.displayUsername || user.name) : "Non attribué";
            },
        },
        {
            id: "actions",
            cell: ({row}) => {
                return (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/app/admin/history/${row.original.channelId}`}>
                            <ExternalLink className="mr-2 h-4 w-4"/> Voir
                        </Link>
                    </Button>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });


    if (loading) {
        return <div className="space-y-4">
            <Skeleton className="h-10 w-full"/>
            <Skeleton className="h-64 w-full"/>
        </div>;
    }

    return (
        <div className="w-full">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Aucun résultat.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Précédent
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Suivant
                </Button>
            </div>
        </div>
    );
}
