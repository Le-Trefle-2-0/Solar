"use client";

/**
 * First focusable element of every page: lets keyboard and screen reader users jump over the
 * navigation to the page's main region. Hidden until it receives focus.
 */
export function SkipLink() {
    return (
        <a
            href="#contenu"
            onClick={(e) => {
                const main = document.getElementById("contenu") ?? document.querySelector("main");
                if (!main) return;
                e.preventDefault();
                if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
                main.focus();
                main.scrollIntoView();
            }}
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
            Aller au contenu
        </a>
    );
}
