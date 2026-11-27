import {defineConfig, globalIgnores} from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            // Textes en français : les apostrophes et guillemets dans le JSX sont rendus correctement par React
            "react/no-unescaped-entities": "off",
            // Dette de typage existante : visible sans bloquer la CI
            "@typescript-eslint/no-explicit-any": "warn",
            // Chargements au montage / synchronisation sur des props : alerte de perf, pas un bug
            "react-hooks/set-state-in-effect": "warn",
        },
    },
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
        ".flowbite-react/**",
    ]),
]);
