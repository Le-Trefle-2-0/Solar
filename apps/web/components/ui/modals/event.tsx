'use client';

import {ChangeEvent, useEffect, useRef, useState} from 'react';
import type {EventData, EventModalProps} from "@/lib/interface";
import {useRouter} from 'next/navigation'
import {apiFetch} from "@/lib/api";

export default function EventModal({isOpen, onClose, event, onUpdate}: EventModalProps) {
    const router = useRouter();
    const [editableEvent, setEditableEvent] = useState<EventData | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (event) {
            setEditableEvent({...event});
        }
    }, [event]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleClickOutside = (e: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!isOpen || !editableEvent) return null;

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setEditableEvent((prev) => prev ? {...prev, [name]: value} : null);
    };

    const handleSubmit = async () => {
        if (!editableEvent) return;
        try {
            const data = await apiFetch(`/v1/events/${editableEvent.id}`, {
                method: "PUT",
                body: JSON.stringify(editableEvent),
            });
            if (data.success && onUpdate) {
                setEditableEvent(data.event);
            }
            onClose();
        } catch (e) {
            console.error("Failed to update event", e);
        }
    };

    const handleRegister = async () => {
        try {
            const data = await apiFetch(`/v1/events/${editableEvent.id}`, {
                method: "POST",
            });
            router.refresh();
        } catch (e) {
            console.error("Failed to register", e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-fade-in"
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                    aria-label="Close"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold mb-4">Edit Event</h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={editableEvent.title}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={editableEvent.description || ""}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded p-2 resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Start</label>
                            <input
                                type="datetime-local"
                                name="start"
                                value={editableEvent.start.slice(0, 16)}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded p-2"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">End</label>
                            <input
                                type="datetime-local"
                                name="end"
                                value={editableEvent.end.slice(0, 16)}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded p-2"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <h3 className="text-sm font-semibold mb-1">Role Slots</h3>
                        <ul className="text-sm text-gray-800 space-y-1 pl-4 list-disc">
                            {editableEvent.roleSlots.map((slot) => (
                                <li key={slot.id}>
                                    <strong>{slot.role}</strong>: {slot.registrationsCount} / {slot.goalCount}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            onClick={handleRegister}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                            Register
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
