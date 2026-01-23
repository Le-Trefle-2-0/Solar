import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function truncateEmail(email: string | null | undefined): string {
    if (!email) return "";
    const [localPart, domain] = email.split('@');
    if (localPart && domain) {
        const visibleLength = Math.min(3, Math.floor(localPart.length / 2));
        return `${localPart.substring(0, visibleLength)}***@${domain}`;
    }
    return "***";
}
