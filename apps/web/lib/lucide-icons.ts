import * as Icons from "lucide-react";

const iconExports = Icons as Record<string, unknown>;

export const LUCIDE_ICON_NAMES = Object.keys(iconExports).filter(
    (key) =>
        typeof iconExports[key] === "function" || (typeof iconExports[key] === "object" && iconExports[key] !== null)
).filter(key => /^[A-Z]/.test(key) && key !== "createLucideIcon" && key !== "LucideProps");
