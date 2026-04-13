"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import * as Icons from "lucide-react";
import {RecruitmentField} from "@/lib/recruitments";

interface FieldManagerProps {
    fields: RecruitmentField[];
    onChange: (fields: RecruitmentField[]) => void;
}

export function FieldManager({fields, onChange}: FieldManagerProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const generateId = (label: string) => {
        return label
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
    };

    const addField = () => {
        onChange([
            ...fields,
            {name: `field_${fields.length + 1}`, label: "Nouveau champ", type: "text", required: false},
        ]);
    };

    const removeField = (index: number) => {
        onChange(fields.filter((_, i) => i !== index));
    };

    const updateField = (index: number, updates: Partial<RecruitmentField>) => {
        const newFields = [...fields];
        newFields[index] = {...newFields[index], ...updates};
        onChange(newFields);
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return;

        const newFields = [...fields];
        const [movedField] = newFields.splice(index, 1);
        newFields.splice(newIndex, 0, movedField);
        onChange(newFields);
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";

        // Créer l'effet visuel pour l'image fantôme (ghost image)
        const target = e.currentTarget as HTMLElement;
        target.classList.add('shadow-2xl', 'rotate-2', 'scale-105', 'bg-card', 'z-50');

        // On retire ces classes après un court délai pour que l'image fantôme garde le style 
        // mais pas l'élément qui reste dans la liste (qui lui aura le style draggedIndex)
        setTimeout(() => {
            target.classList.remove('shadow-2xl', 'rotate-2', 'scale-105', 'z-50');
        }, 0);
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFields = [...fields];
        const [movedField] = newFields.splice(draggedIndex, 1);
        newFields.splice(index, 0, movedField);
        setDraggedIndex(index);
        onChange(newFields);
    };

    const onDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Champs du formulaire</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Icons.Plus className="mr-2 h-4 w-4"/> Ajouter un champ
                </Button>
            </div>

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div
                        key={index}
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragOver={(e) => onDragOver(e, index)}
                        onDragEnd={onDragEnd}
                        className={`flex items-start gap-3 p-3 border rounded-lg bg-card transition-all select-none ${
                            draggedIndex === index
                                ? "opacity-40 border-primary border-dashed bg-primary/5 scale-[0.98]"
                                : "hover:bg-muted/30"
                        }`}
                    >
                        <div
                            className="flex flex-col gap-1 mt-1 text-muted-foreground/50 hover:text-primary transition-colors touch-none"
                            style={{cursor: 'grab'}}
                            title="Faire glisser pour réorganiser"
                        >
                            <Icons.GripVertical className="h-5 w-5 pointer-events-none"/>
                        </div>
                        <div className="grid flex-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Label</Label>
                                <Input
                                    value={field.label}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        const newName = generateId(newLabel);
                                        updateField(index, {label: newLabel, name: newName || field.name});
                                    }}
                                    placeholder="Label affiché"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select
                                    value={field.type}
                                    onValueChange={(value) => updateField(index, {type: value})}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Texte court</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="textarea">Texte long</SelectItem>
                                        <SelectItem value="number">Nombre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2 pb-1">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`req-${index}`}
                                        checked={field.required}
                                        onCheckedChange={(checked) => updateField(index, {required: !!checked})}
                                    />
                                    <Label htmlFor={`req-${index}`} className="text-xs">Obligatoire</Label>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeField(index)}
                                    className="ml-auto h-8 w-8 text-destructive"
                                >
                                    <Icons.Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {fields.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                        Aucun champ défini. Le formulaire sera vide.
                    </p>
                )}
            </div>
        </div>
    );
}
