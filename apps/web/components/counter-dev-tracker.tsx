"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export default function CounterDevTracker() {
  const pathname = usePathname();

  // Exclude any /app/* directory
  if (pathname?.startsWith("/app")) {
    return null;
  }

  return (
    <Script
      src="https://cdn.counter.dev/script.js"
      data-id="f57a9dd6-2304-43c0-911b-bf75b45766bb"
      data-utcoffset="1"
      strategy="afterInteractive"
    />
  );
}
