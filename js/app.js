/* =====================================================================
   PsychLogic · GATE 2027 Psychology Mock Test Series · test engine
   Screens: sign in → test list → instructions → GATE CBT → result
   ===================================================================== */
(function () {
"use strict";
const C = window.PL_CONFIG;
const $ = id => document.getElementById(id);
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const LETTERS = ["A", "B", "C", "D", "E"];

/* ---------------- trusted time (server clock, shown in IST) ----------------
   The page asks its own web server for the time (the HTTP "Date" header).
   The student's device clock is only used if the server cannot be reached. */
let clockOffset = 0, clockSource = "device";
async function syncTime() {
  try {
    const t0 = Date.now();
    const r = await fetch(location.href.split("#")[0].split("?")[0] + "?t=" + t0, { method: "HEAD", cache: "no-store" });
    const d = r.headers.get("Date");
    if (d) {
      const server = new Date(d).getTime();
      clockOffset = server + (Date.now() - t0) / 2 - Date.now();
      clockSource = "server";
    }
  } catch (e) { /* offline or opened as a local file */ }
}
const now = () => Date.now() + clockOffset;
const fmtIST = (ms, opts) => new Intl.DateTimeFormat("en-IN", Object.assign({ timeZone: C.timeZone }, opts)).format(new Date(ms));
const istDateTime = ms => fmtIST(ms, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
const pad = n => String(n).padStart(2, "0");
function hms(sec) { sec = Math.max(0, Math.floor(sec)); return pad(Math.floor(sec / 3600)) + ":" + pad(Math.floor(sec % 3600 / 60)) + ":" + pad(sec % 60); }
function countdown(ms) {
  let s = Math.max(0, Math.floor(ms / 1000)); const d = Math.floor(s / 86400); s %= 86400;
  return (d ? d + "d " : "") + pad(Math.floor(s / 3600)) + "h " + pad(Math.floor(s % 3600 / 60)) + "m " + pad(s % 60) + "s";
}

/* ---------------- device id & activity log ---------------- */
function deviceId() {
  let id = LS.get("plg_device");
  if (!id) { id = "D-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase(); LS.set("plg_device", id); }
  return id;
}
async function logEvent(event, extra) {
  if (!C.logEndpoint) return;
  let ip = "";
  try { ip = (await (await fetch("https://api.ipify.org?format=json", { cache: "no-store" })).json()).ip; } catch (e) {}
  const body = Object.assign({ event, name: S.name, code: S.code, device: deviceId(), ip, ua: navigator.userAgent, screen: screen.width + "x" + screen.height, at: new Date(now()).toISOString() }, extra || {});
  try { fetch(C.logEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body) }); } catch (e) {}
}

/* ---------------- screens ---------------- */
const screens = ["scrLogin", "scrHub", "scrInstr", "scrExam", "scrResult"];
function show(id) {
  screens.forEach(s => { $(s).hidden = s !== id; });
  $("wm").classList.toggle("on", id === "scrExam" || id === "scrResult");
  window.scrollTo(0, 0);
}
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2600); }

/* ---------------- session ---------------- */
let S = LS.get("plg_session", null) || {};
const initial = n => (n || "?").trim().charAt(0).toUpperCase();
function setUserBits() {
  ["hubAvatar", "instrAvatar", "examAvatar"].forEach(i => $(i).textContent = initial(S.name));
  $("hubName").textContent = S.name; $("instrName").textContent = S.name; $("examName").textContent = S.name;
  $("examCode").textContent = S.code;
  const wm = $("wm"); wm.innerHTML = "";
  for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) {
    const sp = document.createElement("span"); sp.textContent = S.name + " · " + S.code;
    sp.style.top = (r * 15 + 4) + "%"; sp.style.left = (c * 28 - 4 + (r % 2) * 12) + "%"; wm.appendChild(sp);
  }
}

$("loginSet").textContent = C.setName;
$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("inName").value.trim().replace(/\s+/g, " ");
  const code = $("inCode").value.trim().toLowerCase();
  const err = $("loginErr");
  if (name.length < 2) { err.textContent = "Enter your full name."; err.hidden = false; return; }
  if (!C.accessCodes.includes(code) && !(C.previewCodes || []).includes(code)) { err.textContent = "This access code is not valid. Check it for typing errors, or write to team@psychlogic.in."; err.hidden = false; return; }
  err.hidden = true;
  S = { name, code, device: deviceId(), since: now() };
  LS.set("plg_session", S);
  logEvent("sign-in");
  openHub();
});
$("btnSignOut").addEventListener("click", () => { LS.del("plg_session"); S = {}; $("inName").value = ""; $("inCode").value = ""; show("scrLogin"); });

/* ---------------- test list ---------------- */
let hubTimer = null;
const unlockMs = t => new Date(t.unlock).getTime();
const isPreview = () => (C.previewCodes || []).includes(S.code);
const isOpen = t => isPreview() || now() >= unlockMs(t);
const histKey = id => "plg_hist_" + S.code + "_" + id;
const runKey = id => "plg_run_" + S.code + "_" + id;

function openHub() {
  setUserBits();
  $("hubSetName").textContent = C.setName + (isPreview() ? " · PREVIEW ACCESS: all tests unlocked for checking" : "");
  show("scrHub");
  renderHub();
  clearInterval(hubTimer);
  hubTimer = setInterval(renderHub, 1000);
}
function renderHub() {
  if ($("scrHub").hidden) { clearInterval(hubTimer); return; }
  const n = now();
  $("clockVal").textContent = fmtIST(n, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  $("clockSrc").textContent = clockSource === "server" ? "Checked against the PsychLogic server" : "Using this device's clock";
  const list = $("testList");
  const html = C.tests.map(t => {
    const open = isOpen(t);
    const hist = LS.get(histKey(t.id), []);
    const run = LS.get(runKey(t.id), null);
    const best = hist.length ? Math.max(...hist.map(h => h.score)) : null;
    const cta = open
      ? `<span class="state open">Open</span>
         <button class="btn btn-primary btn-sm" data-start="${t.id}" type="button">${run ? "Resume test" : hist.length ? "Attempt again" : "Start test"}</button>
         ${hist.length ? `<span class="best">${hist.length} attempt${hist.length > 1 ? "s" : ""} · best ${best.toFixed(2)}</span><button class="link-btn" data-last="${t.id}" type="button">View last result</button>` : ""}`
      : `<span class="state lock">Opens in</span><span class="countdown">${countdown(unlockMs(t) - n)}</span>`;
    return `<li class="test ${open ? "" : "locked"}">
      <div class="test-no">${t.no}<small>Mock</small></div>
      <div><h3>${esc(t.title)}</h3><p>${esc(t.covers)}</p>
        <div class="test-meta"><span>Opens ${istDateTime(unlockMs(t))} IST</span><span>65 questions · 180 min · 100 marks</span></div></div>
      <div class="test-cta">${cta}</div></li>`;
  }).join("");
  if (list._html !== html) { list.innerHTML = html; list._html = html; }
}
$("testList").addEventListener("click", e => {
  const b = e.target.closest("[data-start]"); if (b) return prepareTest(b.dataset.start);
  const l = e.target.closest("[data-last]"); if (l) return showLastResult(l.dataset.last);
});

/* ---------------- loading a paper ---------------- */
let T = null, TEST = null;
function loadPaper(t) {
  return new Promise((res, rej) => {
    if (TEST && TEST.id === t.id) return res(TEST);
    window.PL_TEST = null;
    const s = document.createElement("script");
    s.src = t.file + "?v=" + Date.now();
    s.onload = () => { s.remove(); window.PL_TEST ? res(window.PL_TEST) : rej(); };
    s.onerror = () => { s.remove(); rej(); };
    document.body.appendChild(s);
  });
}
async function prepareTest(id) {
  const t = C.tests.find(x => x.id === id);
  if (!isOpen(t)) return toast("This test opens on " + istDateTime(unlockMs(t)) + " IST.");
  try { TEST = await loadPaper(t); } catch (e) { return toast("This paper is being published. Please try again in a few minutes."); }
  T = t;
  if (LS.get(runKey(t.id), null)) return startExam(true);
  openInstructions();
}

/* ---------------- instructions ---------------- */
function openInstructions() {
  setUserBits();
  const q = TEST.questions, marks = q.reduce((a, x) => a + x.marks, 0);
  const cnt = ty => q.filter(x => x.type === ty).length;
  $("instrTitle").textContent = "Mock " + T.no + " · " + T.title;
  $("instrTestName").textContent = TEST.title;
  $("instrCovers").textContent = T.covers;
  $("instrFacts").innerHTML = `<div><b>${q.length}</b><span>questions${TEST.preview ? " (preview)" : ""}</span></div><div><b>${marks}</b><span>total marks</span></div>
    <div><b>${C.durationMinutes}</b><span>minutes</span></div><div><b>${cnt("MCQ")}·${cnt("MSQ")}·${cnt("NAT")}</b><span>MCQ · MSQ · NAT</span></div>`;
  $("chkDeclare").checked = false; $("instrErr").hidden = true;
  instrPage(1);
  show("scrInstr");
}
function instrPage(p) {
  $("instrPage1").hidden = p !== 1; $("instrPage2").hidden = p !== 2;
  document.querySelectorAll(".itab").forEach(b => b.classList.toggle("active", +b.dataset.page === p));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".itab,[data-goto]").forEach(b => b.addEventListener("click", () => instrPage(+(b.dataset.page || b.dataset.goto))));
$("btnBackHub").addEventListener("click", openHub);
$("btnBegin").addEventListener("click", () => {
  if (!$("chkDeclare").checked) { $("instrErr").textContent = "Tick the declaration to begin."; $("instrErr").hidden = false; return; }
  startExam(false);
});

/* ---------------- exam state ---------------- */
let R = null, cur = 0, draft = null, tick = null;
function newRun() {
  const n = TEST.questions.length;
  return { saved: Array(n).fill(null), marked: Array(n).fill(false), visited: Array(n).fill(false), spent: Array(n).fill(0), cur: 0, endAt: now() + C.durationMinutes * 60000, startedAt: now() };
}
function persist() { R.cur = cur; LS.set(runKey(T.id), R); }

function startExam(resume) {
  R = (resume && LS.get(runKey(T.id), null)) || newRun();
  cur = R.cur || 0;
  setUserBits();
  $("examTitle").textContent = "Mock " + T.no + " · " + T.title;
  $("secTabs").innerHTML = TEST.sections.map((s, i) => `<button class="sec-tab ${i ? "" : "active"}" data-sec="${s.id}" type="button">${esc(s.name)}</button>`).join("");
  show("scrExam");
  if (!resume) logEvent("test-start", { test: T.id });
  goTo(cur);
  clearInterval(tick); tick = setInterval(onTick, 1000); onTick();
}
function onTick() {
  const left = (R.endAt - now()) / 1000;
  $("timerVal").textContent = hms(left);
  $("timer").classList.toggle("low", left <= 300);
  R.spent[cur] = (R.spent[cur] || 0) + 1;
  if (left <= 0) { finish(true); return; }
  if (Math.floor(left) % 10 === 0) persist();
}

function status(i) {
  const a = R.saved[i] !== null, m = R.marked[i];
  if (!R.visited[i]) return "nv";
  if (a && m) return "am"; if (m) return "m"; if (a) return "a"; return "na";
}
function goTo(i) {
  cur = i; R.visited[i] = true;
  const q = TEST.questions[i];
  draft = R.saved[i] === null ? null : JSON.parse(JSON.stringify(R.saved[i]));
  $("qNo").textContent = i + 1;
  const tp = $("qType"); tp.textContent = q.type; tp.className = "q-type " + q.type;
  $("qMarks").textContent = q.type === "MCQ" ? `Marks: +${q.marks} · Negative: −${q.marks}/3` : `Marks: +${q.marks} · No negative marking`;
  $("qText").innerHTML = q.q;
  const box = $("qOpts"), nat = $("natBox");
  if (q.type === "NAT") {
    box.innerHTML = ""; nat.hidden = false; $("natIn").value = draft === null ? "" : draft;
  } else {
    nat.hidden = true;
    const kind = q.type === "MSQ" ? "checkbox" : "radio";
    box.innerHTML = q.options.map((o, k) => `<label class="opt" data-k="${k}"><input type="${kind}" name="opt" value="${k}"><span class="ol">${LETTERS[k]}</span><span>${o}</span></label>`).join("");
    syncOpts();
  }
  $("btnPrev").disabled = i === 0;
  renderPalette(); persist();
  document.querySelector(".q-scroll").scrollTop = 0;
}
function syncOpts() {
  const q = TEST.questions[cur];
  document.querySelectorAll("#qOpts .opt").forEach(l => {
    const k = +l.dataset.k;
    const on = q.type === "MSQ" ? Array.isArray(draft) && draft.includes(k) : draft === k;
    l.classList.toggle("sel", on); l.querySelector("input").checked = on;
  });
}
$("qOpts").addEventListener("click", e => {
  const l = e.target.closest(".opt"); if (!l) return;
  e.preventDefault();
  const k = +l.dataset.k, q = TEST.questions[cur];
  if (q.type === "MSQ") { draft = Array.isArray(draft) ? draft.slice() : []; draft = draft.includes(k) ? draft.filter(x => x !== k) : draft.concat(k).sort(); if (!draft.length) draft = null; }
  else draft = k;
  syncOpts();
});

/* NAT keypad: the GATE NAT box accepts input only from the on-screen keypad */
const KP = ["7", "8", "9", "⌫", "4", "5", "6", "−", "1", "2", "3", ".", "0", "Clear All"];
$("keypad").innerHTML = KP.map(k => `<button type="button" class="${k === "0" || k === "Clear All" ? "wide" : ""}" data-k="${k}">${k}</button>`).join("");
$("keypad").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  let v = $("natIn").value; const k = b.dataset.k;
  if (k === "⌫") v = v.slice(0, -1);
  else if (k === "Clear All") v = "";
  else if (k === "−") v = v.startsWith("-") ? v.slice(1) : "-" + v;
  else if (k === ".") { if (!v.includes(".")) v = (v === "" || v === "-" ? v + "0" : v) + "."; }
  else if (v.replace(/[-.]/g, "").length < 10) v += k;
  $("natIn").value = v; draft = v === "" || v === "-" ? null : v;
});

function saveDraft() {
  const q = TEST.questions[cur];
  if (q.type === "NAT" && draft !== null && isNaN(parseFloat(draft))) draft = null;
  R.saved[cur] = draft === null ? null : JSON.parse(JSON.stringify(draft));
}
const next = () => cur < TEST.questions.length - 1 ? goTo(cur + 1) : (renderPalette(), persist(), toast("This is the last question. Use the palette, or Submit when you are done."));
$("btnSave").addEventListener("click", () => { saveDraft(); R.marked[cur] = false; next(); });
$("btnMark").addEventListener("click", () => { saveDraft(); R.marked[cur] = true; next(); });
$("btnClear").addEventListener("click", () => { draft = null; R.saved[cur] = null; if (TEST.questions[cur].type === "NAT") $("natIn").value = ""; else syncOpts(); renderPalette(); persist(); });
$("btnPrev").addEventListener("click", () => { if (cur > 0) goTo(cur - 1); });

function counts() {
  const c = { a: 0, na: 0, nv: 0, m: 0, am: 0 };
  TEST.questions.forEach((_, i) => c[status(i)]++);
  return c;
}
function renderPalette() {
  $("palette").innerHTML = TEST.questions.map((_, i) => `<button class="pal st-${status(i)} ${i === cur ? "cur" : ""}" data-i="${i}" type="button" aria-label="Question ${i + 1}">${i + 1}</button>`).join("");
  const c = counts();
  $("sideLegend").innerHTML = `<div><i class="pal st-a">${c.a}</i>Answered</div><div><i class="pal st-na">${c.na}</i>Not answered</div>
    <div><i class="pal st-nv">${c.nv}</i>Not visited</div><div><i class="pal st-m">${c.m}</i>Marked for review</div>
    <div class="full"><i class="pal st-am">${c.am}</i>Answered &amp; marked for review (will be evaluated)</div>`;
}
$("palette").addEventListener("click", e => { const b = e.target.closest(".pal"); if (b) { goTo(+b.dataset.i); pal(false); } });
const pal = on => { $("side").classList.toggle("open", on); $("scrim").classList.toggle("on", on); };
$("btnPal").addEventListener("click", () => pal(true));
$("sideClose").addEventListener("click", () => pal(false));
$("scrim").addEventListener("click", () => pal(false));

/* question paper & instructions viewers */
$("btnPaper").addEventListener("click", () => {
  $("paperList").innerHTML = TEST.questions.map((q, i) => `<div class="pq"><b>Question ${i + 1} · ${q.type} · ${q.marks} mark${q.marks > 1 ? "s" : ""}</b><div class="q-text">${q.q}</div>${q.options ? "<ol type='A'>" + q.options.map(o => `<li>${o}</li>`).join("") + "</ol>" : ""}</div>`).join("");
  $("mPaper").hidden = false;
});
$("btnInstr").addEventListener("click", () => {
  const c = $("instrPage1").cloneNode(true); c.hidden = false; c.removeAttribute("id"); c.querySelector(".instr-nav").remove(); c.style.border = "0"; c.style.padding = "0";
  $("mInstrBody").innerHTML = ""; $("mInstrBody").appendChild(c); $("mInstr").hidden = false;
});
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => $(b.dataset.close).hidden = true));

/* submit */
$("btnSubmit").addEventListener("click", () => {
  const c = counts();
  $("sumTable").innerHTML = `<tr><th>Section</th><th>Questions</th><th>Answered</th><th>Not answered</th><th>Marked for review</th><th>Answered &amp; marked</th><th>Not visited</th></tr>
    <tr><td>${esc(TEST.sections[0].name)}</td><td>${TEST.questions.length}</td><td>${c.a}</td><td>${c.na}</td><td>${c.m}</td><td>${c.am}</td><td>${c.nv}</td></tr>`;
  $("mSubmit").hidden = false;
});
$("btnSubNo").addEventListener("click", () => $("mSubmit").hidden = true);
$("btnSubYes").addEventListener("click", () => { $("mSubmit").hidden = true; finish(false); });

/* ---------------- scoring ---------------- */
function judge(q, a) {
  if (a === null || a === undefined) return { st: "skip", m: 0 };
  if (q.type === "MCQ") return a === q.answer ? { st: "ok", m: q.marks } : { st: "bad", m: -q.marks / 3 };
  if (q.type === "MSQ") { const ok = Array.isArray(a) && a.length === q.answer.length && q.answer.every(x => a.includes(x)); return ok ? { st: "ok", m: q.marks } : { st: "bad", m: 0 }; }
  const v = parseFloat(a); return (!isNaN(v) && v >= q.answer.min - 1e-9 && v <= q.answer.max + 1e-9) ? { st: "ok", m: q.marks } : { st: "bad", m: 0 };
}
function finish(auto) {
  clearInterval(tick);
  const qs = TEST.questions;
  const res = qs.map((q, i) => judge(q, R.saved[i]));
  const score = res.reduce((s, r) => s + r.m, 0);
  const rec = {
    at: now(), auto, score: Math.round(score * 100) / 100, max: qs.reduce((s, q) => s + q.marks, 0),
    answers: R.saved, spent: R.spent, timeUsed: Math.min(C.durationMinutes * 60, Math.round((now() - R.startedAt) / 1000))
  };
  const hist = LS.get(histKey(T.id), []); hist.push(rec); LS.set(histKey(T.id), hist.slice(-20));
  LS.del(runKey(T.id));
  logEvent("test-submit", { test: T.id, score: rec.score });
  if (auto) toast("Time is up. Your test has been submitted.");
  renderResult(rec);
}
async function showLastResult(id) {
  const t = C.tests.find(x => x.id === id);
  try { TEST = await loadPaper(t); T = t; } catch (e) { return toast("Could not load this paper. Please try again."); }
  const hist = LS.get(histKey(id), []); if (hist.length) renderResult(hist[hist.length - 1]);
}

/* ---------------- result report ---------------- */
function renderResult(rec) {
  setUserBits();
  const qs = TEST.questions, res = qs.map((q, i) => judge(q, rec.answers[i]));
  const c = { ok: 0, bad: 0, skip: 0 }; res.forEach(r => c[r.st]++);
  const neg = res.reduce((s, r) => s + (r.m < 0 ? -r.m : 0), 0);
  const att = c.ok + c.bad, acc = att ? Math.round(c.ok / att * 100) : 0;
  const pct = rec.score / rec.max * 100;
  const verdict = pct >= 60 ? "Excellent. This is a top-rank score." : pct >= 45 ? "Good. You are in the safe qualifying zone." : pct >= 35 ? "Close to the recent cutoffs. A little more revision will make it safe." : "Below the recent cutoffs. Use the analysis below to plan your revision.";
  $("resHero").innerHTML = `<div class="score-big">${rec.score.toFixed(2)}<small> / ${rec.max}</small></div>
    <div><h1>${esc(S.name)}, here is your result for Mock ${T.no}</h1><p>${verdict} Attempted ${istDateTime(rec.at)} IST${rec.auto ? " · submitted automatically" : ""}.</p>
    <div class="res-stats"><div><b>${c.ok}</b><span>correct</span></div><div><b>${c.bad}</b><span>wrong</span></div><div><b>${c.skip}</b><span>not attempted</span></div>
    <div><b>${acc}%</b><span>accuracy</span></div><div><b>${neg > 0 ? "−" + neg.toFixed(2) : "0"}</b><span>lost to negative marking</span></div><div><b>${hms(rec.timeUsed)}</b><span>time used</span></div></div></div>`;

  /* ---------- performance analysis (charts are inline SVG, no outside library) ---------- */
  const COL = { ok: "#2E9B6F", bad: "#E0614A", skip: "#B9C6D3", navy: "#1D3557", teal: "#2F8F9D", amber: "#E8A33D", violet: "#7559C9" };
  const group = key => { const m = {}; qs.forEach((q, i) => { const g = m[q[key]] = m[q[key]] || { n: 0, ok: 0, bad: 0, skip: 0, marks: 0, max: 0, time: 0 }; g.n++; g.max += q.marks; g.marks += res[i].m; g[res[i].st]++; g.time += rec.spent[i] || 0; }); return m; };
  const subj = group("subject"), type = group("type"), mk = group("marks"), lvl = group("level");
  const LV = { E: "Easy", M: "Moderate", H: "Hard" };
  const band = p => p >= 60 ? COL.ok : p >= 40 ? COL.amber : COL.bad;
  const pctOf = g => Math.max(0, Math.round(g.marks / g.max * 100));

  /* donut */
  function donut(parts, center, sub) {
    const R = 62, Cc = 2 * Math.PI * R, tot = parts.reduce((s, p) => s + p.v, 0) || 1; let off = 0;
    const arcs = parts.filter(p => p.v > 0).map(p => { const len = p.v / tot * Cc; const a = `<circle r="${R}" cx="80" cy="80" fill="none" stroke="${p.c}" stroke-width="22" stroke-dasharray="${len} ${Cc - len}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"/>`; off += len; return a; }).join("");
    const legend = parts.map(p => `<li><i style="background:${p.c}"></i>${p.l}<b>${p.v}</b></li>`).join("");
    return `<div class="donut"><svg viewBox="0 0 160 160" role="img" aria-label="${esc(center)} ${esc(sub)}"><circle r="${R}" cx="80" cy="80" fill="none" stroke="#EDF2F6" stroke-width="22"/>${arcs}<text x="80" y="78" text-anchor="middle" class="d-big">${center}</text><text x="80" y="98" text-anchor="middle" class="d-sub">${sub}</text></svg><ul class="legend">${legend}</ul></div>`;
  }
  /* vertical bar chart: obtained vs maximum */
  function columns(rows) {
    const W = 360, H = 190, base = 160, maxV = Math.max(...rows.map(r => r.max), 1), bw = 26, gap = W / rows.length;
    const bars = rows.map((r, i) => { const x = gap * i + gap / 2; const hMax = r.max / maxV * 130, hGot = Math.max(0, r.got) / maxV * 130;
      return `<rect x="${x - bw - 2}" y="${base - hMax}" width="${bw}" height="${hMax}" rx="4" fill="#DCE5EE"/><rect x="${x + 2}" y="${base - hGot}" width="${bw}" height="${hGot}" rx="4" fill="${r.c}"/>
      <text x="${x - bw / 2 - 2}" y="${base - hMax - 5}" text-anchor="middle" class="c-val">${r.max}</text><text x="${x + bw / 2 + 2}" y="${base - hGot - 5}" text-anchor="middle" class="c-val">${r.got.toFixed(1)}</text>
      <text x="${x}" y="${base + 18}" text-anchor="middle" class="c-lab">${r.l}</text>`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H + 12}" class="cols" role="img" aria-label="Marks obtained against maximum">${bars}<line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="#C9D5E0"/></svg><p class="c-key"><i style="background:#DCE5EE"></i>Maximum marks <i style="background:${COL.teal}"></i>Your marks</p>`;
  }
  /* zone gauge for the total score */
  const zones = [[0, 35, "#F6C9BE", "Needs work"], [35, 45, "#F8DFA6", "Qualifying zone"], [45, 60, "#BFE3D2", "Good"], [60, 100, "#8FD0B4", "Top rank"]];
  const gauge = `<div class="gauge"><div class="g-track">${zones.map(z => `<span style="left:${z[0]}%;width:${z[1] - z[0]}%;background:${z[2]}"><em>${z[3]}</em></span>`).join("")}<b class="g-mark" style="left:${Math.min(100, Math.max(0, pct))}%"><i>${rec.score.toFixed(1)}</i></b></div><div class="g-scale"><span>0</span><span>35</span><span>45</span><span>60</span><span>100</span></div></div>`;

  const subjRows = Object.entries(subj).sort((a, b) => b[1].max - a[1].max).map(([k, g]) => { const p = pctOf(g);
    return `<div class="sbar"><div class="sbar-h"><span>${esc(k)}</span><span>${g.marks.toFixed(2)} / ${g.max} · ${g.ok}✓ ${g.bad}✗ ${g.skip}–</span></div><div class="sbar-t"><i style="width:${p}%;background:${band(p)}"></i><em>${p}%</em></div></div>`; }).join("");
  const typeCols = columns(["MCQ", "MSQ", "NAT"].filter(k => type[k]).map(k => ({ l: k, max: type[k].max, got: type[k].marks, c: k === "MCQ" ? COL.teal : k === "MSQ" ? COL.violet : COL.amber })));
  const lvCols = columns(["E", "M", "H"].filter(k => lvl[k]).map(k => ({ l: LV[k], max: lvl[k].max, got: lvl[k].marks, c: k === "E" ? COL.ok : k === "M" ? COL.amber : COL.bad })));
  const lvRows = ["E", "M", "H"].filter(k => lvl[k]).map(k => { const g = lvl[k], a = g.ok + g.bad; return `<tr><td>${LV[k]}</td><td class="num">${g.n}</td><td class="num">${g.ok}</td><td class="num">${g.bad}</td><td class="num">${g.skip}</td><td class="num">${a ? Math.round(g.ok / a * 100) : 0}%</td></tr>`; }).join("");
  const markCols = columns([1, 2].filter(k => mk[k]).map(k => ({ l: k + "-mark Qs", max: mk[k].max, got: mk[k].marks, c: k === 1 ? COL.teal : COL.navy })));
  const timeRows = Object.entries(subj).map(([k, g]) => ({ k, avg: g.time / g.n })).sort((a, b) => b.avg - a.avg);
  const tMax = Math.max(...timeRows.map(t => t.avg), 1);
  const timeBars = timeRows.map(t => `<div class="sbar"><div class="sbar-h"><span>${esc(t.k)}</span><span>${Math.round(t.avg)} s per question</span></div><div class="sbar-t"><i style="width:${Math.round(t.avg / tMax * 100)}%;background:${COL.navy}"></i></div></div>`).join("");
  const slow = qs.map((q, i) => ({ i, t: rec.spent[i] || 0, st: res[i].st })).filter(x => x.t > 180).sort((a, b) => b.t - a.t).slice(0, 6);

  /* improvement areas: topics where marks were lost */
  const topics = {};
  qs.forEach((q, i) => { if (res[i].st === "ok") return; const key = q.subject + "|" + q.topic; const t = topics[key] = topics[key] || { s: q.subject, t: q.topic, lost: 0, wrong: 0, skip: 0, qn: [] };
    t.lost += q.marks - res[i].m; t[res[i].st === "bad" ? "wrong" : "skip"]++; t.qn.push(i + 1); });
  const tl = Object.values(topics).sort((a, b) => b.lost - a.lost);
  const prio = l => l >= 3 ? ["High", "p-high"] : l >= 2 ? ["Medium", "p-med"] : ["Low", "p-low"];
  const impRows = tl.slice(0, 12).map(t => { const [pl, pc] = prio(t.lost); return `<tr><td><span class="prio ${pc}">${pl}</span></td><td><b>${esc(t.t)}</b><br><span class="muted">${esc(t.s)}</span></td><td class="num">${t.wrong}</td><td class="num">${t.skip}</td><td class="num">${t.lost.toFixed(2)}</td><td>Q ${t.qn.join(", ")}</td></tr>`; }).join("");
  const lostTotal = tl.reduce((s, t) => s + t.lost, 0);

  const sorted = Object.entries(subj).sort((a, b) => b[1].marks / b[1].max - a[1].marks / a[1].max);
  const strong = sorted.filter(([, g]) => g.marks / g.max >= .6).map(([k]) => k), weak = sorted.filter(([, g]) => g.marks / g.max < .4).map(([k]) => k);
  const tips = [];
  if (neg >= 2) tips.push(`You lost <b>${neg.toFixed(2)} marks</b> to negative marking on wrong MCQs. In GATE, attempt an MCQ only when you can rule out at least two options.`);
  if (type.MSQ && type.MSQ.bad > 0) tips.push(`You got ${type.MSQ.bad} MSQ${type.MSQ.bad > 1 ? "s" : ""} wrong. MSQs give no partial marks, so judge each option on its own as true or false before you save.`);
  if (type.NAT && type.NAT.n - type.NAT.ok > 0) tips.push("Revise the numerical formulas (SD, standard error, z and T scores, F-ratio, α/β) and practise them on the virtual calculator.");
  if (c.skip > qs.length * .25) tips.push(`You left ${c.skip} questions. MSQs and NATs carry no negative marking, so attempt them whenever you have a reasonable answer.`);
  if (slow.length) tips.push(`You spent over 3 minutes on ${slow.length} question${slow.length > 1 ? "s" : ""} (Q ${slow.map(x => x.i + 1).join(", ")}). In GATE, mark such questions for review and come back to them later.`);
  if (weak.length) tips.push(`Revise <b>${weak.map(esc).join(", ")}</b> first, then re-attempt this mock. You can attempt it as many times as you like.`);
  if (!tips.length) tips.push("Strong attempt. Re-attempt after a week to check retention, and read the explanations of any question you got right only by guessing.");

  $("rAnalysis").innerHTML = `
    <div class="card"><h3>Where your score stands</h3><p class="muted">Your total against PsychLogic’s score bands, based on recent GATE Psychology qualifying cut-offs.</p>${gauge}</div>
    <div class="grid-2">
      <div class="card"><h3>Attempt summary</h3><p class="muted">How your ${qs.length} questions turned out.</p>${donut([{ l: "Correct", v: c.ok, c: COL.ok }, { l: "Wrong", v: c.bad, c: COL.bad }, { l: "Not attempted", v: c.skip, c: COL.skip }], acc + "%", "accuracy")}</div>
      <div class="card"><h3>Marks breakdown</h3><p class="muted">Positive marks earned, marks lost to negative marking and marks left on the table.</p>${donut([{ l: "Marks earned", v: +(rec.score + neg).toFixed(2), c: COL.teal }, { l: "Lost to negative marking", v: +neg.toFixed(2), c: COL.bad }, { l: "Not earned", v: +Math.max(0, rec.max - rec.score - neg).toFixed(2), c: "#DCE5EE" }], rec.score.toFixed(1), "out of " + rec.max)}</div>
    </div>
    <div class="card"><h3>Subject-wise performance</h3><p class="muted">Percentage of marks scored in each area. <span class="kdot" style="background:${COL.ok}"></span>60% or more <span class="kdot" style="background:${COL.amber}"></span>40–59% <span class="kdot" style="background:${COL.bad}"></span>below 40%</p>${subjRows}</div>
    <div class="grid-2">
      <div class="card"><h3>By question type</h3><p class="muted">Marks obtained against the maximum for MCQ, MSQ and NAT.</p>${typeCols}</div>
      <div class="card"><h3>1-mark vs 2-mark questions</h3><p class="muted">Two-mark questions carry 70% of the paper.</p>${markCols}</div>
    </div>
    <div class="grid-2">
      <div class="card"><h3>By difficulty level</h3><p class="muted">Marks obtained against the maximum for easy, moderate and hard questions.</p>${lvCols}</div>
      <div class="card"><h3>Accuracy by difficulty</h3><p class="muted">Losing marks on easy questions costs the most rank. Secure these first.</p><table class="tbl"><tr><th>Level</th><th class="num">Qs</th><th class="num">Correct</th><th class="num">Wrong</th><th class="num">Left</th><th class="num">Accuracy</th></tr>${lvRows}</table></div>
    </div>
    <div class="card"><h3>Time management</h3><p class="muted">Average time you spent per question in each area${slow.length ? ". Questions that took over 3 minutes: " + slow.map(x => `Q${x.i + 1} (${Math.round(x.t / 60)} min)`).join(", ") : ""}.</p>${timeBars}</div>
    <div class="card"><h3>Improvement areas</h3><p class="muted">Topics where you lost marks, the biggest losses first. You lost ${lostTotal.toFixed(2)} marks in total, including negative marking.</p>
      ${tl.length ? `<div class="tbl-wrap"><table class="tbl imp"><tr><th>Priority</th><th>Topic</th><th class="num">Wrong</th><th class="num">Left</th><th class="num">Marks lost</th><th>Questions</th></tr>${impRows}</table></div>` : "<p>No marks lost. Excellent!</p>"}</div>
    <div class="grid-2"><div class="card"><h3>Strong areas</h3><p class="muted">60% of the marks or more.</p><p>${strong.length ? strong.map(esc).join(", ") : "None yet. Keep practising."}</p></div>
    <div class="card"><h3>Weak areas</h3><p class="muted">Below 40% of the marks.</p><p>${weak.length ? weak.map(esc).join(", ") : "No weak area in this attempt."}</p></div></div>
    <div class="card"><h3>Your action plan</h3><p class="muted">Based on this attempt.</p><ul class="tips">${tips.map(t => `<li>${t}</li>`).join("")}</ul></div>`;

  /* answers */
  const fmtAns = (q, a) => a === null || a === undefined ? "Not attempted" : q.type === "NAT" ? esc(a) : q.type === "MSQ" ? a.map(k => LETTERS[k]).join(", ") : LETTERS[a];
  const key = q => q.type === "NAT" ? (q.answer.min === q.answer.max ? q.answer.min : q.answer.min + " to " + q.answer.max) : q.type === "MSQ" ? q.answer.map(k => LETTERS[k]).join(", ") : LETTERS[q.answer];
  const cards = qs.map((q, i) => {
    const r = res[i], a = rec.answers[i];
    const right = k => q.type === "MSQ" ? q.answer.includes(k) : q.answer === k;
    const picked = k => q.type === "MSQ" ? Array.isArray(a) && a.includes(k) : a === k;
    const opts = q.options ? `<ul class="rev-opts">${q.options.map((o, k) => `<li class="${right(k) ? "right" : picked(k) ? "wrong" : ""}"><b>${LETTERS[k]}.</b> ${o}</li>`).join("")}</ul>` : "";
    const wn = (q.whyNot || []).map((w, k) => w ? `<li><b>(${LETTERS[k]})</b> ${w}</li>` : "").join("");
    return `<div class="rev ${r.st}" data-st="${r.st}" data-sub="${esc(q.subject)}">
      <div class="rev-head"><b>Q${i + 1}</b><span class="verdict ${r.st}">${r.st === "ok" ? "Correct" : r.st === "bad" ? "Wrong" : "Not attempted"}</span><span class="lvl lvl-${q.level}">${{ E: "Easy", M: "Moderate", H: "Hard" }[q.level] || ""}</span><span>${q.type} · ${q.marks} mark${q.marks > 1 ? "s" : ""}</span><span>${esc(q.subject)} · ${esc(q.topic)}</span><span>Marks: ${r.m > 0 ? "+" : ""}${r.m.toFixed(2)}</span><span>Time: ${hms(rec.spent[i] || 0)}</span></div>
      <div class="q-text">${q.q}</div>${opts}
      <p class="rev-ans">Your answer: <b>${fmtAns(q, a)}</b> · Correct answer: <b>${key(q)}</b></p>
      <div class="expl"><h4>Why this is the answer</h4><p>${q.why}</p>${wn ? `<h4>Why not the others</h4><ul>${wn}</ul>` : ""}
      <h4>Related points you should know</h4><ul>${q.related.map(x => `<li>${x}</li>`).join("")}</ul>
      <p class="watch"><b>PsychLogic insight:</b> ${q.watch}</p></div></div>`;
  }).join("");
  const subs = [...new Set(qs.map(q => q.subject))];
  $("rAnswers").innerHTML = `<div class="filters" id="fl"><button class="chip active" data-f="all" type="button">All (${qs.length})</button><button class="chip" data-f="ok" type="button">Correct (${c.ok})</button><button class="chip" data-f="bad" type="button">Wrong (${c.bad})</button><button class="chip" data-f="skip" type="button">Not attempted (${c.skip})</button>${subs.map(s => `<button class="chip" data-s="${esc(s)}" type="button">${esc(s)}</button>`).join("")}</div>${cards}`;
  $("fl").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    document.querySelectorAll("#fl .chip").forEach(x => x.classList.toggle("active", x === b));
    document.querySelectorAll("#rAnswers .rev").forEach(r => { r.hidden = b.dataset.f ? (b.dataset.f !== "all" && r.dataset.st !== b.dataset.f) : r.dataset.sub !== b.dataset.s; });
  });

  /* history */
  const hist = LS.get(histKey(T.id), []);
  $("rHistory").innerHTML = `<div class="card"><h3>Your attempts at this mock</h3><p class="muted">You can attempt it again at any time from this device.</p><table class="tbl"><tr><th>#</th><th>Date (IST)</th><th class="num">Score</th><th class="num">Time used</th></tr>${hist.map((h, i) => `<tr><td>${i + 1}</td><td>${istDateTime(h.at)}</td><td class="num">${h.score.toFixed(2)} / ${h.max}</td><td class="num">${hms(h.timeUsed)}</td></tr>`).reverse().join("")}</table></div>`;

  document.querySelectorAll(".rtab").forEach(b => b.classList.toggle("active", b.dataset.r === "analysis"));
  ["rAnalysis", "rAnswers", "rHistory"].forEach(id => $(id).hidden = id !== "rAnalysis");
  show("scrResult");
}
document.querySelectorAll(".rtab").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".rtab").forEach(x => x.classList.toggle("active", x === b));
  $("rAnalysis").hidden = b.dataset.r !== "analysis"; $("rAnswers").hidden = b.dataset.r !== "answers"; $("rHistory").hidden = b.dataset.r !== "history";
}));
$("btnRetake").addEventListener("click", () => openInstructions());
$("btnResHub").addEventListener("click", openHub);

/* ---------------- virtual calculator ---------------- */
const CK = [["sin", "f"], ["cos", "f"], ["tan", "f"], ["log", "f"], ["ln", "f"], ["(", "op"], [")", "op"], ["x²", "op"], ["√", "f"], ["^", "op"],
  ["7"], ["8"], ["9"], ["÷", "op"], ["C", "clr"], ["4"], ["5"], ["6"], ["×", "op"], ["⌫", "clr"], ["1"], ["2"], ["3"], ["−", "op"], ["π", "op"], ["0"], ["."], ["±", "op"], ["+", "op"], ["=", "eq"]];
$("calcKeys").innerHTML = CK.map(([k, c]) => `<button type="button" class="${c || ""}" data-k="${k}">${k}</button>`).join("");
let cExpr = "";
function cEval(s) {
  const js = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "(Math.PI)").replace(/\^/g, "**")
    .replace(/sin\(/g, "S(").replace(/cos\(/g, "Co(").replace(/tan\(/g, "Ta(").replace(/log\(/g, "Math.log10(").replace(/ln\(/g, "Math.log(").replace(/√\(/g, "Math.sqrt(");
  if (/[^0-9+\-*/().\s]/.test(js.replace(/Math\.(PI|log10|log|sqrt)|\bS\(|\bCo\(|\bTa\(/g, "("))) throw 0;
  const D = Math.PI / 180;
  return Function("S", "Co", "Ta", "return (" + js + ")")(x => Math.sin(x * D), x => Math.cos(x * D), x => Math.tan(x * D));
}
$("calcKeys").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const k = b.dataset.k;
  if (k === "C") { cExpr = ""; $("calcOut").value = "0"; }
  else if (k === "⌫") cExpr = cExpr.slice(0, -1);
  else if (k === "=") { try { const v = cEval(cExpr); $("calcOut").value = Number.isFinite(v) ? +v.toPrecision(12) : "Error"; } catch (er) { $("calcOut").value = "Error"; } }
  else if (["sin", "cos", "tan", "log", "ln", "√"].includes(k)) cExpr += k + "(";
  else if (k === "x²") cExpr += "^2";
  else if (k === "±") cExpr = cExpr ? "−(" + cExpr + ")" : "−";
  else cExpr += k;
  $("calcExpr").value = cExpr;
});
$("btnCalc").addEventListener("click", () => $("calc").hidden = !$("calc").hidden);
$("calcClose").addEventListener("click", () => $("calc").hidden = true);
(function drag() {
  const el = $("calc"), h = $("calcHead"); let sx, sy, ox, oy, on = false;
  h.addEventListener("pointerdown", e => { if (e.target.closest(".x")) return; on = true; sx = e.clientX; sy = e.clientY; const r = el.getBoundingClientRect(); ox = r.left; oy = r.top; h.setPointerCapture(e.pointerId); });
  h.addEventListener("pointermove", e => { if (!on) return; el.style.left = ox + e.clientX - sx + "px"; el.style.top = oy + e.clientY - sy + "px"; el.style.right = "auto"; });
  h.addEventListener("pointerup", () => on = false);
})();

/* ---------------- copy, right-click and shortcut blocking ----------------
   A deterrent only: a static website cannot fully prevent copying. */
["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach(ev => document.addEventListener(ev, e => {
  if (ev === "selectstart" && e.target.closest && e.target.closest("input")) return;
  e.preventDefault(); if (ev === "contextmenu" || ev === "copy") toast("Copying is disabled on PsychLogic tests.");
}));
document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === "f12" || k === "printscreen" || (mod && ["c", "x", "s", "p", "u", "a"].includes(k)) || (mod && e.shiftKey && ["i", "j", "c", "s"].includes(k))) {
    e.preventDefault(); toast("This action is disabled during PsychLogic tests.");
  }
  if (!$("scrExam").hidden && e.target.id === "natIn") e.preventDefault();
});
window.addEventListener("beforeprint", () => toast("Printing is disabled."));

/* ---------------- start ---------------- */
(async function init() {
  deviceId();
  await syncTime();
  if (S.code && (C.accessCodes.includes(S.code) || isPreview())) openHub(); else show("scrLogin");
})();
})();
