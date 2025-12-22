"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {ChevronDown, ChevronUp, Plus, Trash2} from "lucide-react";
import {RecruitmentField} from "@/lib/recruitments";

interface FieldManagerProps {
    fields: RecruitmentField[];
    onChange: (fields: RecruitmentField[]) => void;
}

export function FieldManager({fields, onChange}: FieldManagerProps) {
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Champs du formulaire</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Plus className="mr-2 h-4 w-4"/> Ajouter un champ
                </Button>
            </div>

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                        <div className="flex flex-col gap-1 mt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveField(index, 'up')}
                                disabled={index === 0}
                            >
                                <ChevronUp className="h-4 w-4"/>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveField(index, 'down')}
                                disabled={index === fields.length - 1}
                            >
                                <ChevronDown className="h-4 w-4"/>
                            </Button>
                        </div>
                        <div className="grid flex-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                            <div className="space-y-1">
                                <Label className="text-xs">ID (unique)</Label>
                                <Input
                                    value={field.name}
                                    onChange={(e) => updateField(index, {name: e.target.value})}
                                    placeholder="nom_du_champ"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Label</Label>
                                <Input
                                    value={field.label}
                                    onChange={(e) => updateField(index, {label: e.target.value})}
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
                                    <Trash2 className="h-4 w-4"/>
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
