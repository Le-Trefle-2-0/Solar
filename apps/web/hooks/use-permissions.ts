"use client";

import {useCallback, useEffect, useState} from "react";
import {apiFetch} from "@/lib/api";

/**
 * The signed-in user's effective permissions (the owner holds them all), for showing or hiding
 * controls. The API checks every action again, so this is never the access control itself.
 */
export function usePermissions() {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        let cancelled = false;
        apiFetch("/v1/auth/permissions")
            .then((res: {permissions?: string[]; isOwner?: boolean}) => {
                if (cancelled) return;
                setPermissions(res.permissions ?? []);
                setIsOwner(!!res.isOwner);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    const can = useCallback(
        (permission: string) => permissions.includes("admin.sudo") || permissions.includes(permission),
        [permissions],
    );

    return {permissions, isOwner, can};
}
