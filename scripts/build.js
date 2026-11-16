// Builds the public site into _site/. Papers whose unlock time (IST) has passed are decrypted from locked/.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const out = "_site";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const item of ["index.html", "css", "js", "assets", "data"]) fs.cpSync(item, path.join(out, item), { recursive: true });
global.window = {};
eval(fs.readFileSync("data/config.js", "utf8"));
const now = process.env.BUILD_NOW ? new Date(process.env.BUILD_NOW) : new Date();
for (const t of window.PL_CONFIG.tests) {
  const plain = path.join(out, t.file), enc = path.join("locked", path.basename(t.file) + ".enc");
  if (fs.existsSync(plain)) { console.log(t.id, "already public"); continue; }
  if (now < new Date(t.unlock)) { console.log(t.id, "locked until", t.unlock); continue; }
  if (!fs.existsSync(enc)) { console.log(t.id, "no locked file found"); continue; }
  if (!process.env.UNLOCK_KEY) throw new Error("UNLOCK_KEY secret is missing");
  execFileSync("openssl", ["enc", "-d", "-aes-256-cbc", "-pbkdf2", "-iter", "100000", "-in", enc, "-out", plain, "-pass", "env:UNLOCK_KEY"]);
  console.log(t.id, "UNLOCKED and published");
}
