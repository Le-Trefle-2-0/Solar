"use client";

import {useCallback, useEffect, useState} from "react";
import {BlockNoteEditor, PartialBlock} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import {Loader2} from "lucide-react";

interface NewsletterEditorProps {
    newsletterId: string;
    initialContent?: string;
    onSave?: (content: string) => void;
}

export default function NewsletterEditor({newsletterId, initialContent, onSave}: NewsletterEditorProps) {
    const [editor, setEditor] = useState<BlockNoteEditor | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize editor with content
    useEffect(() => {
        async function loadContent() {
            setLoading(true);
            try {
                let blocks: PartialBlock[] = [];
                if (initialContent) {
                    try {
                        blocks = JSON.parse(initialContent);
                    } catch (e) {
                        // If not JSON, maybe it's raw text/markdown
                        // BlockNote can try to convert or we just start fresh
                        console.error("Failed to parse initial content as JSON", e);
                    }
                }

                // We create the editor instance here
                // Note: BlockNote is best used with its own hooks, but for dynamic loading we might need this
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        loadContent();
    }, [initialContent]);

    // Simple auto-save for now
    const handleEditorChange = useCallback(() => {
        if (editor) {
            const content = JSON.stringify(editor.document);
            onSave?.(content);
        }
    }, [editor, onSave]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin"/></div>;

    // We'll use the proper hook-based approach in the actual page component for better performance
    return null;
}
