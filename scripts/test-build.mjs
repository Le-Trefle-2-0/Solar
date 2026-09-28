#!/usr/bin/env node
/**
 * Test de build à l'échelle du monorepo.
 *
 * Rejoue chaque étape de `npm run build:all` séparément (l'ordre et la liste
 * sont lus directement depuis le script `build:all` du package.json racine),
 * vérifie que chaque app produit bien ses artefacts, puis affiche un récapitulatif.
 *
 * Contrairement à `build:all` (chaîné avec &&), toutes les étapes sont exécutées
 * même si l'une échoue, afin d'avoir un rapport complet dans la PR.
 *
 * Usage :
 *   node scripts/test-build.mjs [options]
 *
 * Options :
 *   --install      Lance `npm ci` avant les builds (utile en CI)
 *   --clean        Supprime les artefacts existants (dist/, .next/) avant le build
 *   --fail-fast    S'arrête à la première étape en échec
 *   --only=a,b     Ne teste que certaines cibles (ex: --only=api,web)
 *
 * Code de sortie : 0 si tout est OK, 1 sinon.
 * En GitHub Actions, un résumé Markdown est écrit dans $GITHUB_STEP_SUMMARY
 * et les logs de chaque étape sont conservés dans .build-logs/.
 */
import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG_DIR = path.join(ROOT, ".build-logs");
const IS_CI = !!process.env.CI;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const only = args.find((a) => a.startsWith("--only="))?.slice("--only=".length).split(",").filter(Boolean);

// Artefacts attendus pour chaque cible de build:all
const EXPECTED_OUTPUTS = {
    api: ["apps/api/dist/index.js"],
    ws: ["apps/ws/dist/index.js"],
    voice: ["apps/voice/dist/index.js"],
    storage: ["apps/storage/dist/index.js"],
    web: ["apps/web/.next/BUILD_ID"],
};
const CLEAN_DIRS = {
    api: ["apps/api/dist"],
    ws: ["apps/ws/dist"],
    voice: ["apps/voice/dist"],
    storage: ["apps/storage/dist"],
    web: ["apps/web/.next"],
};

// Valeurs factices : permettent au build de passer en CI sans secrets.
// Elles ne remplacent jamais une variable déjà définie.
const FALLBACK_ENV = {
    DATABASE_URL: "mysql://ci:ci@localhost:3306/solar_ci",
    BETTER_AUTH_SECRET: "ci-build-only-secret-not-for-production",
    BETTER_AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    NEXT_PUBLIC_WS_URL: "http://localhost:5000",
    NEXT_TELEMETRY_DISABLED: "1",
};

const c = process.stdout.isTTY || IS_CI
    ? {red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`}
    : {red: String, green: String, dim: String, bold: String};

const fmt = (ms) => (ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 60_000)}m${Math.round((ms % 60_000) / 1000)}s`);

function groupStart(title) {
    if (IS_CI) console.log(`::group::${title}`);
    else console.log(`\n${c.bold(`▶ ${title}`)}`);
}

function groupEnd() {
    if (IS_CI) console.log("::endgroup::");
}

function run(name, command, env) {
    return new Promise((resolve) => {
        const logFile = path.join(LOG_DIR, `${name}.log`);
        const log = fs.createWriteStream(logFile);
        const start = Date.now();
        const child = spawn(command, {cwd: ROOT, env, shell: true});
        const pipe = (stream, out) => stream.on("data", (d) => {
            out.write(d);
            log.write(d);
        });
        pipe(child.stdout, process.stdout);
        pipe(child.stderr, process.stderr);
        child.on("close", (code) => {
            log.end();
            resolve({code: code ?? 1, duration: Date.now() - start, logFile});
        });
    });
}

/** Extrait les cibles de `build:all` (ex: "npm run build:api && ..." → ["api", ...]). */
function readBuildTargets() {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const buildAll = pkg.scripts?.["build:all"];
    if (!buildAll) throw new Error("Script `build:all` introuvable dans package.json");
    const targets = [...buildAll.matchAll(/npm run build:([\w-]+)/g)].map((m) => m[1]);
    if (!targets.length) throw new Error(`Impossible d'extraire les cibles de build:all : "${buildAll}"`);
    return targets;
}

async function main() {
    fs.rmSync(LOG_DIR, {recursive: true, force: true});
    fs.mkdirSync(LOG_DIR, {recursive: true});

    const env = {...process.env};
    for (const [k, v] of Object.entries(FALLBACK_ENV)) env[k] ??= v;

    let targets = readBuildTargets();
    if (only) {
        const unknown = only.filter((t) => !targets.includes(t));
        if (unknown.length) {
            console.error(c.red(`Cible(s) inconnue(s) : ${unknown.join(", ")} (disponibles : ${targets.join(", ")})`));
            process.exit(1);
        }
        targets = targets.filter((t) => only.includes(t));
    }

    console.log(c.bold(`Test de build du monorepo — Node ${process.version}`));
    console.log(c.dim(`Cibles : ${targets.join(" → ")}`));

    // Étapes préalables : si elles échouent, inutile de poursuivre.
    const pre = [];
    if (flag("install")) pre.push(["install", "npm ci --no-audit --no-fund"]);
    pre.push(["prisma-validate", "npx prisma validate --schema=prisma/schema.prisma"]);
    pre.push(["prisma-generate", "npx prisma generate --schema=prisma/schema.prisma"]);

    const results = [];
    for (const [name, cmd] of pre) {
        groupStart(`[prérequis] ${name}`);
        const r = await run(name, cmd, env);
        groupEnd();
        results.push({name, ...r, ok: r.code === 0, missing: []});
        if (r.code !== 0) return report(results, targets);
    }

    if (flag("clean")) {
        for (const t of targets) for (const dir of CLEAN_DIRS[t] ?? []) fs.rmSync(path.join(ROOT, dir), {recursive: true, force: true, maxRetries: 5, retryDelay: 200});
    }

    for (const target of targets) {
        groupStart(`[build] ${target}`);
        const r = await run(`build-${target}`, `npm run build:${target}`, env);
        groupEnd();
        const missing = r.code === 0
            ? (EXPECTED_OUTPUTS[target] ?? []).filter((f) => !fs.existsSync(path.join(ROOT, f)))
            : [];
        const ok = r.code === 0 && missing.length === 0;
        results.push({name: `build:${target}`, ...r, ok, missing});
        console.log(ok ? c.green(`✔ build:${target} (${fmt(r.duration)})`) : c.red(`✘ build:${target} (${fmt(r.duration)})`));
        if (!ok && flag("fail-fast")) break;
    }

    return report(results, targets);
}

function report(results, targets) {
    const done = new Set(results.map((r) => r.name));
    const skipped = targets.map((t) => `build:${t}`).filter((n) => !done.has(n));
    const failed = results.filter((r) => !r.ok);
    const total = results.reduce((s, r) => s + r.duration, 0);

    console.log(`\n${c.bold("Récapitulatif")}`);
    for (const r of results) {
        const status = r.ok ? c.green("OK   ") : c.red("ÉCHEC");
        const extra = r.missing.length ? c.red(` — artefact(s) manquant(s) : ${r.missing.join(", ")}`) : "";
        console.log(`  ${status}  ${r.name.padEnd(18)} ${c.dim(fmt(r.duration))}${extra}`);
        if (!r.ok) console.log(c.dim(`         log : ${path.relative(ROOT, r.logFile)}`));
    }
    for (const n of skipped) console.log(`  ${c.dim("IGNORÉ")} ${n}`);
    console.log(`\nDurée totale : ${fmt(total)}`);

    if (process.env.GITHUB_STEP_SUMMARY) {
        const lines = [
            `## ${failed.length ? "❌" : "✅"} Test de build du monorepo`,
            "",
            "| Étape | Statut | Durée | Détail |",
            "|---|---|---|---|",
            ...results.map((r) => `| \`${r.name}\` | ${r.ok ? "✅" : "❌"} | ${fmt(r.duration)} | ${r.missing.length ? `Artefact(s) manquant(s) : ${r.missing.join(", ")}` : r.ok ? "" : `code ${r.code}`} |`),
            ...skipped.map((n) => `| \`${n}\` | ⏭️ | – | ignoré |`),
            "",
            `Node ${process.version} — durée totale ${fmt(total)}`,
        ];
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
    }

    if (failed.length) {
        for (const r of failed) if (IS_CI) console.log(`::error title=Build échoué::${r.name} a échoué${r.missing.length ? ` (artefacts manquants : ${r.missing.join(", ")})` : ` (code ${r.code})`}`);
        console.error(c.red(`\n${failed.length} étape(s) en échec.`));
        process.exit(1);
    }
    console.log(c.green("\nTous les builds sont passés."));
}

main().catch((err) => {
    console.error(c.red(err.stack || String(err)));
    process.exit(1);
});
