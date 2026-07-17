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
import * as Icons from "lucide-react";
import {
    ArrowUpDown,
    Check,
    ChevronDown,
    ChevronsUpDown,
    FileCheck,
    FileClock,
    FileX,
    IdCardLanyard,
    Info,
    MoreHorizontal,
    ShieldCheck,
    Trash,
    UserPen,
    UserPlus
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Badge} from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form"
import {Input} from "@/components/ui/input";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table";
import {DisplayAccount} from "@/lib/interface";
import {
    AlertDialog,
    AlertDialogAction,
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
    Label,
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
import {apiFetch} from "@/lib/api";
import {
    inviteUserAction,
    rejectDocumentAction,
    requestAllRenewalAction,
    requestRenewalAction,
    validateDocumentsAction
} from "@/app/actions/users";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {Textarea} from "@/components/ui/textarea";
import {AdminValidationView} from "@/components/users/admin-validation-view";

const FormSchema = z.object({
    name: z.string(),
    email: z.string(),
    roles: z.array(z.string()).min(1),
});

interface DataTableProps {
    data: DisplayAccount[];
    availableRoles: { id: string, name: string, icon?: string }[];
}

export function UsersTable({data, availableRoles}: DataTableProps) {
    const [users, setUsers] = useState<DisplayAccount[]>(data);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [allRenewalAlertOpen, setAllRenewalAlertOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [validationViewAccount, setValidationViewAccount] = useState<DisplayAccount | null>(null);
    const router = useRouter();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const getRoleIcon = (roleName: string) => {
        const role = availableRoles.find(r => r.name === roleName);
        const Icon = (Icons as any)[role?.icon || "Shield"] || Icons.Shield;
        return <Icon className="h-4 w-4"/>;
    };

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
            accessorKey: "lastTicketTimestamp",
            header: ({column}) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Dernière écoute
                        <ArrowUpDown/>
                    </Button>
                );
            },
            cell: ({row}) =>
                <div>{row.getValue("lastTicketTimestamp") == 0 ? "Aucune écoute récente" : new Date(row.getValue("lastTicketTimestamp")).toLocaleDateString('fr-FR')}</div>,
        },
        {
            accessorKey: "role",
            header: () => <div className="text-center">Rôles</div>,
            cell: ({row}) => {
                const roles = String(row.getValue("role") || "")
                    .split(",")
                    .map((r) => r.trim())
                    .filter(Boolean);
                return (
                    <div className="flex items-center justify-center gap-2">
                        {roles.map((r, idx) => (
                            <span key={r + idx} title={r}
                                  className="inline-flex items-center justify-center rounded-md bg-muted px-1.5 py-1">
                                {getRoleIcon(r)}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            accessorKey: "documentsStatus",
            header: "Documents",
            cell: ({row}) => {
                const status = row.getValue("documentsStatus") as string;
                const user = row.original;

                if (status === 'validated') {
                    return (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <FileCheck size={14}/> Validé
                        </Badge>
                    );
                }
                if (status === 'submitted') {
                    return (
                        <div className="relative inline-block">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                                <FileClock size={14}/> Envoyé
                            </Badge>
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        </div>
                    );
                }
                if (status === 'rejected') {
                    return (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                            <FileX size={14}/> Refusé
                        </Badge>
                    );
                }
                return (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 gap-1">
                        <FileX size={14}/> Manquant
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({row}) => {
                const account = row.original;
                const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
                const [editDialogOpen, setEditDialogOpen] = useState(false);
                const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
                const [rejectType, setRejectType] = useState<'idCard' | 'casier' | null>(null);
                const [rejectReasonText, setRejectReasonText] = useState("");

                const FormSchema = z.object({
                    roles: z.array(z.string())
                });

                async function onSubmit(formData: z.infer<typeof FormSchema>) {
                    try {
                        const {user: userData} = await apiFetch(`/v1/admin/users/${account.id}/role`, {
                            method: 'POST',
                            body: JSON.stringify({roles: formData.roles}),
                        });
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

                        setEditDialogOpen(false);
                        toast("Rôles modifiés")
                        form.reset();
                    } catch (e: any) {
                        return toast("Erreur lors de la modification", {
                            description: (
                                <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
                                  <code className="text-white">{String(e?.message || e)}</code>
                                </pre>
                            )
                        });
                    }
                }

                const form = useForm<z.infer<typeof FormSchema>>({
                    resolver: zodResolver(FormSchema),
                    defaultValues: {
                        roles: (account.role || '').split(',').map(r => r.trim()).filter(Boolean),
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
                                <DropdownMenuItem onClick={() => router.push(`/app/admin/user/${account.id}`)}>
                                    <Info/> Voir le profil
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onClick={() => setValidationViewAccount(account)}>
                                    <ShieldCheck/> Validation administrative
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    toast.promise(requestRenewalAction(account.id), {
                                        loading: 'Demande de renouvellement...',
                                        success: () => {
                                            router.refresh();
                                            return 'Renouvellement demandé';
                                        },
                                        error: 'Erreur lors de la demande'
                                    });
                                }}>
                                    <FileClock/> Demander renouvellement
                                </DropdownMenuItem>
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
                                                name="roles"
                                                render={({field}) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Rôles</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            "w-full justify-between",
                                                                            (!field.value || field.value.length === 0) && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value && field.value.length > 0
                                                                            ? availableRoles
                                                                                .filter((r) => (field.value as string[]).includes(r.name))
                                                                                .map((r) => r.name)
                                                                                .join(', ')
                                                                            : "Sélectionner un ou plusieurs rôles"}
                                                                        <ChevronsUpDown className="opacity-50"/>
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-full p-0">
                                                                <Command>
                                                                    <CommandList>
                                                                        <CommandGroup>
                                                                            {availableRoles.map((role) => {
                                                                                const selected = ((field.value as string[]) || []).includes(role.name)
                                                                                return (
                                                                                    <CommandItem
                                                                                        value={role.name}
                                                                                        key={role.id}
                                                                                        onSelect={() => {
                                                                                            const current = new Set((field.value as string[]) || [])
                                                                                            if (current.has(role.name)) {
                                                                                                current.delete(role.name)
                                                                                            } else {
                                                                                                current.add(role.name)
                                                                                            }
                                                                                            form.setValue("roles", Array.from(current) as any, {shouldDirty: true})
                                                                                        }}
                                                                                    >
                                                                                        {role.name}
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "ml-auto",
                                                                                                selected ? "opacity-100" : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                    </CommandItem>
                                                                                )
                                                                            })}
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


                        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Refuser le document</DialogTitle>
                                    <DialogDescription>
                                        Veuillez indiquer la raison du refus
                                        pour {rejectType === 'idCard' ? "la pièce d'identité" : "le casier judiciaire"}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="reject-reason" className="text-xs mb-2 block">Raison du
                                        refus</Label>
                                    <Textarea
                                        id="reject-reason"
                                        placeholder="Ex: Document expiré, illisible..."
                                        value={rejectReasonText}
                                        onChange={(e) => setRejectReasonText(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline"
                                            onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
                                    <Button
                                        variant="destructive"
                                        disabled={!rejectReasonText.trim()}
                                        onClick={async () => {
                                            if (rejectType) {
                                                await rejectDocumentAction(account.id, rejectType, rejectReasonText);
                                                setUsers(prev => prev.map(u => u.id === account.id ? {
                                                    ...u,
                                                    [rejectType === 'idCard' ? 'idCardStatus' : 'casierStatus']: 'rejected',
                                                    [rejectType === 'idCard' ? 'idCardRejectReason' : 'casierRejectReason']: rejectReasonText,
                                                    documentsStatus: 'rejected'
                                                } : u));
                                                setRejectDialogOpen(false);
                                                router.refresh();
                                                toast.success("Document refusé");
                                            }
                                        }}
                                    >
                                        Refuser
                                    </Button>
                                </DialogFooter>
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
            roles: ["volunteer"],
        },
    });

    async function onSubmit(formData: z.infer<typeof FormSchema>) {
        if (isInviting) return;
        setIsInviting(true);

        try {
            const result = await inviteUserAction(formData);

            if (result.error) {
                toast.error("Erreur lors de l'invitation", {
                    description: result.error
                });
                return;
            }

            const userData = result.user!;

            toast.success("Invitation envoyée", {
                description: `Un email a été envoyé à ${formData.email} pour configurer son mot de passe.`
            });

            setUsers((prev) => [
                ...prev,
                {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    role: (userData.role as string),
                    lastTicketTimestamp: 0,
                },
            ]);

            setDialogOpen(false);
            form.reset();
        } catch (e) {
            console.error(e);
            toast.error("Une erreur inattendue est survenue");
        } finally {
            setIsInviting(false);
        }
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
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={() => setAllRenewalAlertOpen(true)}
                    >
                        <FileClock size={16}/> Renouvellement général
                    </Button>

                    <AlertDialog open={allRenewalAlertOpen} onOpenChange={setAllRenewalAlertOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Demander le renouvellement général ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir demander le renouvellement des documents pour TOUS les
                                    utilisateurs (hors administrateurs) ?
                                    Cette action obligera chaque bénévole à soumettre de nouveaux documents à leur
                                    prochaine connexion (après le délai de grâce de 2 semaines).
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-amber-600 hover:bg-amber-700"
                                    onClick={async () => {
                                        toast.promise(requestAllRenewalAction(), {
                                            loading: 'Demande de renouvellement général...',
                                            success: () => {
                                                router.refresh();
                                                return 'Renouvellement demandé pour tous';
                                            },
                                            error: 'Erreur lors de la demande'
                                        });
                                    }}
                                >
                                    Confirmer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Inviter un utilisateur">
                                <UserPlus/>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Inviter un utilisateur</DialogTitle>
                                <DialogDescription>
                                    L'utilisateur recevra un email pour configurer son mot de passe et accéder à la
                                    plateforme.
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
                                            name="roles"
                                            render={({field}) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Rôles</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between",
                                                                        (!field.value || (field.value as string[]).length === 0) && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value && (field.value as string[]).length > 0
                                                                        ? availableRoles
                                                                            .filter((r) => ((field.value as string[]) || []).includes(r.name))
                                                                            .map((r) => r.name)
                                                                            .join(', ')
                                                                        : "Sélectionner un ou plusieurs rôles"}
                                                                    <ChevronsUpDown className="opacity-50"/>
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-full p-0">
                                                            <Command>
                                                                <CommandList>
                                                                    <CommandGroup>
                                                                        {availableRoles.map((role) => {
                                                                            const selected = ((field.value as string[]) || []).includes(role.name)
                                                                            return (
                                                                                <CommandItem
                                                                                    value={role.name}
                                                                                    key={role.id}
                                                                                    onSelect={() => {
                                                                                        const current = new Set((field.value as string[]) || [])
                                                                                        if (current.has(role.name)) {
                                                                                            current.delete(role.name)
                                                                                        } else {
                                                                                            current.add(role.name)
                                                                                        }
                                                                                        form.setValue("roles", Array.from(current) as any, {shouldDirty: true})
                                                                                    }}
                                                                                >
                                                                                    {role.name}
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "ml-auto",
                                                                                            selected ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                </CommandItem>
                                                                            )
                                                                        })}
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
                                        <Button type="submit" className="cursor-pointer" disabled={isInviting}>
                                            {isInviting ? "Invitation en cours..." : "Inviter"}
                                        </Button>
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
                                        <TableHead key={header.id} className="text-center">
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
                                    className="hover:shadow-sm hover:-translate-y-[1px] transition-shadow"
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
            {validationViewAccount && (
                <AdminValidationView
                    account={validationViewAccount}
                    onClose={() => setValidationViewAccount(null)}
                    onUpdate={(updated) => {
                        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                    }}
                />
            )}
        </div>
    );
}
