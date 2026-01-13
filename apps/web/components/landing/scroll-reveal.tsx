"use client";

import {ReactNode, useEffect, useRef, useState} from "react";
import {cn} from "@/lib/utils";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    animation?: "fade-in" | "slide-up" | "slide-left" | "slide-right";
    delay?: number;
    duration?: number;
    threshold?: number;
}

export function ScrollReveal({
                                 children,
                                 className,
                                 animation = "slide-up",
                                 delay = 0,
                                 duration = 1000,
                                 threshold = 0.1,
                             }: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {threshold}
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    const animationClasses = {
        "fade-in": "opacity-0 data-[visible=true]:opacity-100 transition-opacity",
        "slide-up": "opacity-0 translate-y-10 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 transition-all",
        "slide-left": "opacity-0 -translate-x-10 data-[visible=true]:opacity-100 data-[visible=true]:translate-x-0 transition-all",
        "slide-right": "opacity-0 translate-x-10 data-[visible=true]:opacity-100 data-[visible=true]:translate-x-0 transition-all",
    };

    return (
        <div
            ref={ref}
            data-visible={isVisible}
            className={cn(animationClasses[animation], className)}
            style={{
                transitionDelay: `${delay}ms`,
                transitionDuration: `${duration}ms`
            }}
        >
            {children}
        </div>
    );
}
