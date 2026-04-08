"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import {Check, ChevronsUpDown, Search} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {LUCIDE_ICON_NAMES} from "@/lib/lucide-icons";

interface IconPickerProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function IconPicker({value, onChange, className, placeholder = "Choisir une icône..."}: IconPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const IconComponent = value ? (Icons as any)[value] : null;

    const filteredIcons = React.useMemo(() => {
        if (!search) return LUCIDE_ICON_NAMES.slice(0, 50);

        const searchLower = search.toLowerCase();

        // Filter icons that contain the search term
        const matches = LUCIDE_ICON_NAMES.filter((name) =>
            name.toLowerCase().includes(searchLower)
        );

        // Sort results:
        // 1. Exact match first
        // 2. Starts with search term
        // 3. Includes search term
        return matches.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();

            if (aLower === searchLower) return -1;
            if (bLower === searchLower) return 1;

            const aStarts = aLower.startsWith(searchLower);
            const bStarts = bLower.startsWith(searchLower);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            return aLower.localeCompare(bLower);
        }).slice(0, 50);
    }, [search]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {IconComponent ? (
                            <IconComponent className="h-4 w-4 shrink-0"/>
                        ) : (
                            <Search className="h-4 w-4 shrink-0 opacity-50"/>
                        )}
                        <span className="truncate">
                            {value || placeholder}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Rechercher une icône..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>Aucune icône trouvée.</CommandEmpty>
                        <CommandGroup>
                            {filteredIcons.map((iconName) => {
                                const Icon = (Icons as any)[iconName];
                                return (
                                    <CommandItem
                                        key={iconName}
                                        value={iconName}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue === value ? "" : currentValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === iconName ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <Icon className="mr-2 h-4 w-4"/>
                                        {iconName}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
