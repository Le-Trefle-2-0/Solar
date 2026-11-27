// Links apps/web/.env to the root .env (cross-platform replacement for the
// former `ln -sf` shell snippet in the postinstall script).
// Falls back to a copy when symlinks aren't permitted (e.g. Windows without
// Developer Mode).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, ".env");
const target = path.join(root, "apps", "web", ".env");

if (!fs.existsSync(source)) process.exit(0);

fs.rmSync(target, { force: true });
try {
  fs.symlinkSync(path.relative(path.dirname(target), source), target, "file");
} catch {
  fs.copyFileSync(source, target);
  console.warn(
    "link-env: could not create a symlink, copied .env to apps/web/.env instead (re-run npm install after editing the root .env)."
  );
}
