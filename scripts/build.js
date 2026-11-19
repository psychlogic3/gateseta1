// Builds the public site into _site/. Each set lives in its own folder ("." = Set 1 at the main address, "set2" = /set2, ...).
// Papers whose unlock time (IST) has passed are decrypted from that set's locked/ folder.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const out = "_site";
const SETS = [".", "set2", "set3", "set4", "set5"].filter(d => fs.existsSync(path.join(d, "data", "config.js")));
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const now = process.env.BUILD_NOW ? new Date(process.env.BUILD_NOW) : new Date();
for (const dir of SETS) {
  const dest = path.join(out, dir);
  fs.mkdirSync(dest, { recursive: true });
  for (const item of ["index.html", "css", "js", "assets", "data"]) {
    const src = path.join(dir, item);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(dest, item), { recursive: true });
  }
  global.window = {};
  eval(fs.readFileSync(path.join(dir, "data", "config.js"), "utf8"));
  for (const t of window.PL_CONFIG.tests) {
    const plain = path.join(dest, t.file), enc = path.join(dir, "locked", path.basename(t.file) + ".enc");
    if (fs.existsSync(plain)) { console.log(dir, t.id, "already public"); continue; }
    if (now < new Date(t.unlock)) { console.log(dir, t.id, "locked until", t.unlock); continue; }
    if (!fs.existsSync(enc)) { console.log(dir, t.id, "no locked file found"); continue; }
    if (!process.env.UNLOCK_KEY) throw new Error("UNLOCK_KEY secret is missing");
    execFileSync("openssl", ["enc", "-d", "-aes-256-cbc", "-pbkdf2", "-iter", "100000", "-in", enc, "-out", plain, "-pass", "env:UNLOCK_KEY"]);
    console.log(dir, t.id, "UNLOCKED and published");
  }
}
if (fs.existsSync("CNAME")) fs.copyFileSync("CNAME", path.join(out, "CNAME"));
