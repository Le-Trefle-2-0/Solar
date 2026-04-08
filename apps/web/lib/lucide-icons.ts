import * as Icons from "lucide-react";

export const LUCIDE_ICON_NAMES = Object.keys(Icons).filter(
    (key) =>
        // @ts-ignore
        typeof Icons[key] === "function" || (typeof Icons[key] === "object" && Icons[key] !== null)
).filter(key => /^[A-Z]/.test(key) && key !== "createLucideIcon" && key !== "LucideProps");
