"use client";

import * as React from "react";
import {useState} from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    Check,
    ChevronDown,
    ChevronsUpDown,
    IdCardLanyard,
    MoreHorizontal,
    Trash,
    UserPen,
    UserPlus
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form"
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {DisplayAccount} from "@/lib/interface";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {cn} from "@/lib/utils";
import {authClient} from "@/lib/auth-client";
import {useRouter} from "next/navigation";

const roles = [
    {label: "Responsable de pôle/Admin", value: "admin"},
    {label: "Référent Bénévoles Écoutants", value: "manager"},
    {label: "Bénévole en Formation", value: "training"},
    {label: "Bénévole Écoutant", value: "volunteer"},
] as const
const FormSchema = z.object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    role: z.enum(["admin", "manager", "training", "volunteer"]),
});

interface DataTableProps {
    data: DisplayAccount[];
}

export function UsersTable({data}: DataTableProps) {
    const [users, setUsers] = useState<DisplayAccount[]>(data);
    const [dialogOpen, setDialogOpen] = useState(false);
    const router = useRouter();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const columns: ColumnDef<DisplayAccount>[] = [
        {
            id: "select",
            header: ({table}) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({row}) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({column}) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Nom
                        <ArrowUpDown/>
                    </Button>
                );
            },
            cell: ({row}) => <div>{row.getValue("name")}</div>,
        },
        {
            accessorKey: "username",
            header: ({column}) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Pseudo
                        <ArrowUpDown/>
                    </Button>
                );
            },
            cell: ({row}) => <div>{row.getValue("username") || 'Non défini'}</div>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({row}) => <div className="lowercase">{row.getValue("email")}</div>,
        },
        {
            accessorKey: "role",
            header: () => <div className="text-right">Role</div>,
            cell: ({row}) => {
                return <div className="text-right">{row.getValue("role")}</div>;
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({row}) => {
                const account = row.original;
                const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
                const [editDialogOpen, setEditDialogOpen] = useState(false);

                const roles = [
                    {label: "Responsable de pôle/Admin", value: "admin"},
                    {label: "Référent Bénévoles Écoutants", value: "manager"},
                    {label: "Bénévole en Formation", value: "training"},
                    {label: "Bénévole Écoutant", value: "volunteer"},
                ] as const
                const FormSchema = z.object({
                    role: z.enum(["admin", "manager", "training", "volunteer"]),
                });

                async function onSubmit(formData: z.infer<typeof FormSchema>) {
                    const user = await authClient.admin.setRole({
                        userId: account.id,
                        role: formData.role,
                    });

                    if (user.error) return toast("Erreur lors de la création", {
                        description: (
                            <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                              <code className="text-white">{JSON.stringify(user.error)}</code>
                            </pre>
                        )
                    })

                    const userData = user.data.user;
                    setUsers((prev) =>
                        prev.map((u) =>
                            u.id === userData.id
                                ? {
                                    ...u,
                                    role: userData.role as string,
                                }
                                : u
                        )
                    );

                    setDialogOpen(false);
                    form.reset();
                }

                const form = useForm<z.infer<typeof FormSchema>>({
                    resolver: zodResolver(FormSchema),
                    defaultValues: {
                        role: account.role as ("admin" | "manager" | "training" | "volunteer"),
                    },
                });

                return (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir le menu</span>
                                    <MoreHorizontal/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => router.push(`/app/admin/user/${account.id}`)}>Voir le
                                    profil</DropdownMenuItem>
                                <DropdownMenuItem>Voir l'historique d'écoute</DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(account.id)}
                                >
                                    <IdCardLanyard/> Copier l'identifiant
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                    <UserPen/> Modifier le rôle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}
                                                  className="text-destructive">
                                    <Trash/> Supprimer l'utilisateur
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr de supprimer le compte
                                        de {account.name} ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible. L'utilisateur sera définitivement supprimé.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <Button
                                        onClick={async () => {
                                            await authClient.admin.removeUser({userId: account.id});
                                            setUsers(prev => prev.filter(user => user.id !== account.id));
                                            toast("Utilisateur supprimé");
                                            setDialogOpen(false);
                                        }}
                                        variant="destructive"
                                    >
                                        Supprimer
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Modifier le rôle de {account.name}</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                                        <div className="grid gap-3">
                                            <FormField
                                                control={form.control}
                                                name="role"
                                                render={({field}) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Rôle</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            "w-full justify-between",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value
                                                                            ? roles.find((role) => role.value === field.value)?.label
                                                                            : "Sélectionner un rôle"}
                                                                        <ChevronsUpDown className="opacity-50"/>
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-full p-0">
                                                                <Command>
                                                                    <CommandList>
                                                                        <CommandGroup>
                                                                            {roles.map((role) => (
                                                                                <CommandItem
                                                                                    value={role.label}
                                                                                    key={role.value}
                                                                                    onSelect={() => {
                                                                                        form.setValue("role", role.value);
                                                                                    }}
                                                                                >
                                                                                    {role.label}
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "ml-auto",
                                                                                            role.value === field.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Annuler</Button>
                                            </DialogClose>
                                            <Button type="submit" className="cursor-pointer">Enregistrer</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </>
                );
            },
        },
    ];

    const table = useReactTable({
        data: users,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "volunteer",
        },
    });

    async function onSubmit(formData: z.infer<typeof FormSchema>) {
        const user = await authClient.admin.createUser({
            email: formData.email,
            name: formData.name,
            password: formData.password,
            role: formData.role,
        });

        if (user.error) return toast("Erreur lors de la création", {
            description: (
                <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(user.error)}</code>
        </pre>
            )
        })

        const userData = user.data.user;
        setUsers((prev) => [
            ...prev,
            {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role as string,
            },
        ]);

        setDialogOpen(false);
        form.reset();
    }

    return (
        <div className="w-full">
            <div className="flex items-center py-4 justify-between">
                <Input
                    placeholder="Rechercher par nom..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <div className="flex items-end gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Colonnes <ChevronDown/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <UserPlus/>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Ajouter un utilisateur</DialogTitle>
                                <DialogDescription>
                                    Merci d'indiquer les informations nécessaires pour la création du compte
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                                    <div className="grid gap-3">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Prénom et nom</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Prénom et nom" {...field} />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Email" {...field} type="email"/>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Mot de passe</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Mot de passe" {...field} type="password"/>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({field}) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Rôle</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value
                                                                        ? roles.find((role) => role.value === field.value)?.label
                                                                        : "Sélectionner un rôle"}
                                                                    <ChevronsUpDown className="opacity-50"/>
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-full p-0">
                                                            <Command>
                                                                <CommandList>
                                                                    <CommandGroup>
                                                                        {roles.map((role) => (
                                                                            <CommandItem
                                                                                value={role.label}
                                                                                key={role.value}
                                                                                onSelect={() => {
                                                                                    form.setValue("role", role.value);
                                                                                }}
                                                                            >
                                                                                {role.label}
                                                                                <Check
                                                                                    className={cn(
                                                                                        "ml-auto",
                                                                                        role.value === field.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Annuler</Button>
                                        </DialogClose>
                                        <Button type="submit" className="cursor-pointer">Ajouter</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Aucun résultat
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} lignes sélectionnée(s)
                    sur {table.getFilteredRowModel().rows.length}
                </div>
                <div className="space-x-2">
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
        </div>
    );
}
