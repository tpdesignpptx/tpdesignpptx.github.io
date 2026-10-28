/* TP DESIGN PPTX — Chatbot Gemini + kết nối nhân viên hỗ trợ.
   Cách gắn: thêm dòng  <script src="chatbot.js" defer></script>  ngay trước </body> của index.html.
   File này tự ẩn widget chatbot cũ và thay bằng widget mới. */
(function () {
"use strict";

var API_CHAT   = "https://script.google.com/macros/s/AKfycbz46UoilPCkklehXy7cpEhzL15WhO4ATROQImCDwxdd0fdjA77nB5EZbnLChJbowomY/exec";   /* URL /exec của Code.gs mới */
var API_BAN_IP = "https://script.google.com/macros/s/AKfycbxkUi-99oRSdjiyacmpXyv_hkFCXEavfaTbntAHaBeTjvcQz3xNTeKCxKQTW6n9WqGQ/exec";
var MIN_CONNECT_MS = 3500;   /* màn hình "đang kết nối" hiển thị tối thiểu */
var POLL_LIVE = 2500, POLL_IDLE = 6000;
var GREETING = "Xin chào! 😊 Mình là trợ lý AI của TP DESIGN PPTX. Mình có thể giúp gì cho bạn nè? ✨";
var FALLBACK_TXT = "Hiện chưa có nhân viên nhận hỗ trợ nên trợ lý AI sẽ hỗ trợ bạn trước nhé 🙏. Yêu cầu của bạn đã được gửi tới nhân viên, khi nhân viên trực tuyến trở lại mình sẽ báo để bạn kết nối lại.";

function $(id) { return document.getElementById(id); }
function s(v) { return v == null ? "" : String(v); }
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------- Giao diện ---------- */
var oldImg = document.querySelector("#botFab .bot-fab-img");
var AV = oldImg ? oldImg.src : "https://i.ibb.co/mC7tWqp7/F0-B32-A25-E4-D7-4-AAF-85-D0-A13-B80037851.png";

var css = document.createElement("style");
css.textContent = [
"#botFab,#botPanel,#botWelcomeBubble{display:none!important}",
".tpc-bubble{position:fixed;right:20px;bottom:91px;z-index:149;max-width:190px;padding:8px 26px 8px 11px;border-radius:13px 13px 6px 13px;background:rgba(14,16,36,.96);border:1px solid rgba(255,255,255,.16);color:#f0f2ff;font-size:11px;font-weight:600;line-height:1.35;box-shadow:0 8px 24px rgba(0,0,0,.3);animation:tpcUp .45s cubic-bezier(.16,1,.3,1)}",
".tpc-bubble.off{display:none}.tpc-bubble button{position:absolute;top:4px;right:6px;width:20px;height:20px;border:0;background:transparent;color:inherit;opacity:.6;font-size:16px;cursor:pointer}",
".tpc-fab{position:fixed;right:20px;bottom:20px;z-index:150;width:64px;height:64px;border-radius:50%;padding:0;border:1px solid rgba(255,255,255,.3);background:linear-gradient(160deg,rgba(109,91,255,.55),rgba(0,212,255,.35));box-shadow:0 12px 34px rgba(109,91,255,.4);cursor:pointer;animation:tpcFloat 3.4s ease-in-out infinite;transition:transform .2s}",
".tpc-fab:hover{transform:scale(1.07)}.tpc-fab.off{display:none}.tpc-fab img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}",
".tpc-badge{position:absolute;top:-2px;right:-2px;width:16px;height:16px;border-radius:50%;background:#00e5a0;border:2px solid #060818;box-shadow:0 0 8px rgba(0,229,160,.7);z-index:2}.tpc-badge.alert{background:#ff4d6d;box-shadow:0 0 10px rgba(255,77,109,.8);animation:tpcPing 1s infinite}",
".tpc-panel{position:fixed;right:20px;bottom:96px;z-index:151;width:min(370px,calc(100vw - 32px));height:min(72vh,580px);display:flex;flex-direction:column;border-radius:24px;overflow:hidden;background:rgba(14,16,36,.97);border:1px solid rgba(255,255,255,.14);box-shadow:0 32px 80px rgba(0,0,0,.7);color:#f0f2ff;font-family:var(--font,'Be Vietnam Pro',system-ui,sans-serif);opacity:0;pointer-events:none;transform:translateY(16px) scale(.97);transition:opacity .22s,transform .26s cubic-bezier(.16,1,.3,1)}",
".tpc-panel.open{opacity:1;pointer-events:auto;transform:none}",
".tpc-head{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);flex-shrink:0;position:relative;z-index:6}",
".tpc-av{width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(160deg,rgba(109,91,255,.6),rgba(0,212,255,.4))}.tpc-av img{width:100%;height:100%;object-fit:cover;display:block}",
".tpc-title{font-size:13.5px;font-weight:800}.tpc-sub{font-size:11px;color:#00e5a0;display:flex;align-items:center;gap:5px}.tpc-sub i{width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 6px currentColor}.tpc-sub.warn{color:#ffb547}",
".tpc-x{margin-left:auto;width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:rgba(240,242,255,.6);cursor:pointer;font-size:13px}.tpc-x:hover{color:#fff;background:rgba(255,255,255,.1)}",
".tpc-body{flex:1;overflow-y:auto;padding:14px 14px 8px;display:flex;flex-direction:column;gap:9px;scrollbar-width:thin}",
".tpc-m{max-width:86%;padding:9px 12px;border-radius:14px;font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-word}",
".tpc-m a{color:#38bdf8;text-decoration:underline}",
".tpc-m.bot{align-self:flex-start;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-bottom-left-radius:4px}",
".tpc-m.user{align-self:flex-end;background:linear-gradient(135deg,rgba(109,91,255,.9),rgba(0,212,255,.65));color:#fff;font-weight:500;border-bottom-right-radius:4px}",
".tpc-m.staff{align-self:flex-start;background:rgba(0,229,160,.12);border:1px solid rgba(0,229,160,.35);border-bottom-left-radius:4px}",
".tpc-m.system{align-self:center;max-width:94%;text-align:center;background:none;color:rgba(240,242,255,.5);font-size:11.5px;padding:2px 6px}",
".tpc-lbl{display:block;font-size:10.5px;font-weight:800;color:#00e5a0;margin-bottom:2px}",
".tpc-act{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px;white-space:normal}",
".tpc-b{padding:8px 13px;border-radius:999px;border:0;cursor:pointer;font:700 12px var(--font,inherit);background:linear-gradient(135deg,#6d5bff,#00d4ff);color:#fff;box-shadow:0 4px 14px rgba(109,91,255,.35)}",
".tpc-b.g{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:rgba(240,242,255,.7);box-shadow:none}",
".tpc-typing{align-self:flex-start;display:flex;gap:4px;padding:11px 13px;border-radius:14px;background:rgba(255,255,255,.07)}.tpc-typing span{width:6px;height:6px;border-radius:50%;background:rgba(240,242,255,.6);animation:tpcDot 1.1s infinite}.tpc-typing span:nth-child(2){animation-delay:.15s}.tpc-typing span:nth-child(3){animation-delay:.3s}",
".tpc-reco{display:none;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;margin:0 12px 6px;border-radius:12px;background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.35);font-size:12px;font-weight:600;color:#00e5a0}.tpc-reco.show{display:flex}",
".tpc-chips{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 8px}.tpc-chips.off{display:none}",
".tpc-chip{padding:6px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:rgba(240,242,255,.8);font:600 11.5px var(--font,inherit);cursor:pointer}.tpc-chip:hover{background:rgba(109,91,255,.2);border-color:rgba(109,91,255,.5)}",
".tpc-in{display:flex;gap:8px;padding:11px 12px;border-top:1px solid rgba(255,255,255,.08);flex-shrink:0}",
".tpc-in input{flex:1;min-width:0;border:1px solid rgba(255,255,255,.16);outline:none;background:#0c0e1f;color:#f0f2ff;border-radius:999px;padding:9px 14px;font:500 13px var(--font,inherit)}.tpc-in input:focus{border-color:rgba(109,91,255,.7)}.tpc-in input:disabled{opacity:.5}",
".tpc-send{width:38px;height:38px;border-radius:50%;border:0;flex-shrink:0;cursor:pointer;background:linear-gradient(135deg,#6d5bff,#00d4ff);color:#fff;display:flex;align-items:center;justify-content:center}.tpc-send:disabled{opacity:.5}",
".tpc-conn,.tpc-lock{position:absolute;left:0;right:0;top:62px;bottom:0;z-index:5;display:none;align-items:center;justify-content:center;padding:24px;text-align:center}",
".tpc-conn{background:rgba(10,12,28,.97)}.tpc-conn.show{display:flex;animation:tpcFade .3s}",
".tpc-lock{background:linear-gradient(160deg,rgba(255,45,85,.4),rgba(110,8,30,.8));color:#fff}.tpc-lock.show{display:flex}",
".tpc-conn-in{display:flex;flex-direction:column;align-items:center;gap:12px}",
".tpc-spin{width:54px;height:54px;border-radius:50%;border:4px solid rgba(255,255,255,.1);border-top-color:#00d4ff;border-right-color:#6d5bff;animation:tpcSpin .9s linear infinite}",
".tpc-conn-t{font-size:15px;font-weight:800}.tpc-conn-t span{display:inline-block;animation:tpcDot 1.2s infinite}.tpc-conn-t span:nth-child(2){animation-delay:.2s}.tpc-conn-t span:nth-child(3){animation-delay:.4s}",
".tpc-queue{padding:12px 22px;border-radius:16px;background:rgba(109,91,255,.14);border:1px solid rgba(109,91,255,.4);font-size:12px;color:rgba(240,242,255,.7)}.tpc-queue b{display:block;font-size:30px;line-height:1.2;color:#fff;margin-top:2px}",
".tpc-conn-s{font-size:12px;line-height:1.6;color:rgba(240,242,255,.55);max-width:270px}",
"@keyframes tpcSpin{to{transform:rotate(360deg)}}@keyframes tpcDot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}@keyframes tpcFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes tpcUp{from{opacity:0;transform:translateY(12px) scale(.9)}to{opacity:1;transform:none}}@keyframes tpcFade{from{opacity:0}to{opacity:1}}@keyframes tpcPing{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}",
"@media(max-width:640px){.tpc-bubble{right:14px;bottom:78px;max-width:165px}.tpc-fab{right:14px;bottom:14px;width:56px;height:56px}.tpc-panel{right:10px;left:10px;bottom:82px;width:auto;height:min(68vh,560px)}.tpc-in input{font-size:16px}}"
].join("\n");
document.head.appendChild(css);

var host = document.createElement("div");
host.innerHTML =
'<div class="tpc-bubble" id="tpcBubble"><span>👋 Cần hỗ trợ? Hỏi trợ lý AI nhé! 😊</span><button id="tpcBubbleX" aria-label="Đóng">×</button></div>' +
'<button class="tpc-fab" id="tpcFab" aria-label="Mở hỗ trợ"><span class="tpc-badge" id="tpcBadge"></span><img src="' + AV + '" alt="Trợ lý TP DESIGN"></button>' +
'<div class="tpc-panel" id="tpcPanel" role="dialog" aria-label="Trợ lý TP DESIGN">' +
  '<div class="tpc-head"><div class="tpc-av"><img src="' + AV + '" alt=""></div><div><div class="tpc-title" id="tpcTitle">Trợ lý TP DESIGN</div><div class="tpc-sub" id="tpcSub"><i></i><span id="tpcSubTx">Trợ lý AI · trực tuyến</span></div></div><button class="tpc-x" id="tpcClose" aria-label="Đóng">✕</button></div>' +
  '<div class="tpc-body" id="tpcBody"></div>' +
  '<div class="tpc-reco" id="tpcReco"><span>🟢 Nhân viên đã trực tuyến trở lại</span><button class="tpc-b" id="tpcReBtn">Kết nối lại</button></div>' +
  '<div class="tpc-chips" id="tpcChips"><button class="tpc-chip" data-q="Mẫu miễn phí tải ở đâu?">Mẫu miễn phí</button><button class="tpc-chip" data-q="Làm sao để nhận file mẫu?">Cách nhận file</button><button class="tpc-chip" data-q="Tôi muốn gặp nhân viên hỗ trợ">👤 Gặp nhân viên</button></div>' +
  '<div class="tpc-in"><input id="tpcInput" type="text" maxlength="500" placeholder="Nhập câu hỏi của bạn…" aria-label="Nhập câu hỏi" autocomplete="off"><button class="tpc-send" id="tpcSend" aria-label="Gửi"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
  '<div class="tpc-conn" id="tpcConn" role="status" aria-live="polite"><div class="tpc-conn-in"><div class="tpc-spin"></div><div class="tpc-conn-t">Đang kết nối với nhân viên<span>.</span><span>.</span><span>.</span></div><div class="tpc-queue">Số thứ tự hàng đợi của bạn<b id="tpcQ">#…</b></div><p class="tpc-conn-s">Vui lòng giữ cửa sổ này mở. Nếu chưa có nhân viên nhận, trợ lý AI sẽ hỗ trợ bạn trước.</p><button class="tpc-b g" id="tpcCancel">Hủy kết nối</button></div></div>' +
  '<div class="tpc-lock" id="tpcLock" role="alert"><div><div style="font-size:38px">🚫</div><div style="font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#ffc2cd;margin:8px 0">Tạm khóa</div><p style="font-size:13.5px;font-weight:600;line-height:1.65">Yêu cầu của bạn đã bị từ chối do không tuân thủ quy định sử dụng. Vui lòng thử lại sau 24 giờ.</p></div></div>' +
'</div>';
document.body.appendChild(host);

/* ---------- Trạng thái ---------- */
var mode = "bot";            /* bot | waiting | human | fallback */
var sid = "", since = 0, pollT = null, busy = false, connAt = 0, fbPending = false, opened = false, restored = false, online = false, lastQ = 0;
try { sid = sessionStorage.getItem("tp_chat_sid") || ""; } catch (e) {}
var hadSession = !!sid && (function () { try { return sessionStorage.getItem("tp_chat_used") === "1"; } catch (e) { return false; } })();
if (!/^[A-Za-z0-9_-]{8,40}$/.test(sid)) {
  var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a);
  sid = "w" + Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  try { sessionStorage.setItem("tp_chat_sid", sid); } catch (e) {}
}
function markUsed() { try { sessionStorage.setItem("tp_chat_used", "1"); } catch (e) {} }

function api(payload, ms) {
  var ctrl = new AbortController(), t = setTimeout(function () { ctrl.abort(); }, ms || 30000);
  return fetch(API_CHAT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctrl.signal })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (d) { if (!d || d.ok === false) throw new Error((d && d.error) || "api"); return d; })
    .finally(function () { clearTimeout(t); });
}

/* ---------- Tin nhắn ---------- */
function fill(el, text) {
  text = s(text).replace(/\*\*/g, "");
  var re = /(https?:\/\/[^\s)]*[^\s).,!?])/g, last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
    var a = document.createElement("a"); a.href = m[1]; a.target = "_blank"; a.rel = "noopener"; a.textContent = m[1]; el.appendChild(a);
    last = m.index + m[1].length;
  }
  if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
}
function scrollEnd() { var b = $("tpcBody"); b.scrollTop = b.scrollHeight; }
function addMsg(text, who) {
  var d = document.createElement("div"); d.className = "tpc-m " + who;
  if (who === "staff") { var l = document.createElement("span"); l.className = "tpc-lbl"; l.textContent = "👩‍💼 Nhân viên TP DESIGN"; d.appendChild(l); }
  fill(d, text); $("tpcBody").appendChild(d); scrollEnd(); return d;
}
function typing(on) {
  var t = $("tpcTyping");
  if (on && !t) { t = document.createElement("div"); t.className = "tpc-typing"; t.id = "tpcTyping"; t.innerHTML = "<span></span><span></span><span></span>"; $("tpcBody").appendChild(t); scrollEnd(); }
  if (!on && t) t.remove();
}
function notify() { if (!opened) $("tpcBadge").classList.add("alert"); }

/* ---------- Chế độ & màn hình kết nối ---------- */
function setMode(m) {
  mode = m;
  var sub = $("tpcSub"), tx = $("tpcSubTx"), inp = $("tpcInput");
  sub.className = "tpc-sub";
  if (m === "human") { $("tpcTitle").textContent = "Nhân viên hỗ trợ"; tx.textContent = "Đang trò chuyện với nhân viên"; inp.placeholder = "Nhắn cho nhân viên…"; }
  else if (m === "waiting") { $("tpcTitle").textContent = "Trợ lý TP DESIGN"; sub.className = "tpc-sub warn"; tx.textContent = "Đang kết nối nhân viên…"; }
  else if (m === "fallback") { $("tpcTitle").textContent = "Trợ lý TP DESIGN"; sub.className = "tpc-sub warn"; tx.textContent = "Trợ lý AI hỗ trợ thay nhân viên"; inp.placeholder = "Nhập câu hỏi của bạn…"; }
  else { $("tpcTitle").textContent = "Trợ lý TP DESIGN"; tx.textContent = "Trợ lý AI · trực tuyến"; inp.placeholder = "Nhập câu hỏi của bạn…"; }
  $("tpcChips").classList.toggle("off", m === "human" || m === "waiting");
  if (m !== "fallback") toggleReco(false);
  if (m === "bot") stopPoll(); else startPoll();
}
function showConn(on) { $("tpcConn").classList.toggle("show", !!on); $("tpcInput").disabled = !!on || !!blockedUntil(); }
function setQueue(n) { n = Number(n) || lastQ || 1; lastQ = n; $("tpcQ").textContent = "#" + n; }
function toggleReco(on) { $("tpcReco").classList.toggle("show", !!on); }

function toFallback() {
  if (fbPending) return; fbPending = true;
  var d = Math.max(0, MIN_CONNECT_MS - (Date.now() - connAt));
  setTimeout(function () {
    fbPending = false;
    if (mode !== "waiting") return;
    showConn(false); setMode("fallback"); addMsg(FALLBACK_TXT, "bot"); notify();
  }, d);
}

/* Áp dụng trạng thái server trả về */
function applyState(r) {
  if (!r) return;
  (r.msgs || []).forEach(function (m) { addMsg(m.text, m.from); if (m.from === "staff") notify(); });
  if (typeof r.last === "number") since = Math.max(since, r.last);
  online = !!r.staffOnline;
  var st = r.status;
  if (st === "waiting") {
    if (mode !== "waiting") { connAt = connAt || Date.now(); setMode("waiting"); showConn(true); }
    setQueue(r.queue);
  } else if (st === "active") {
    if (mode !== "human") { showConn(false); setMode("human"); $("tpcInput").focus(); }
  } else if (st === "fallback") {
    if (mode === "waiting") { setQueue(r.queue); toFallback(); }
    else if (mode === "fallback") toggleReco(online);
    else if (mode === "bot") setMode("fallback");
  } else if (st === "closed" || st === "none") {
    if (mode !== "bot") { fbPending = false; showConn(false); setMode("bot"); }
  } else if (st === "bot") {
    if (mode === "waiting" || mode === "human") { showConn(false); setMode("bot"); }
  }
}

/* ---------- Polling ---------- */
function stopPoll() { clearTimeout(pollT); pollT = null; }
function startPoll() {
  stopPoll();
  (function loop() {
    if (mode === "bot") return;
    var d = (mode === "waiting" || mode === "human") ? POLL_LIVE : POLL_IDLE;
    pollT = setTimeout(async function () {
      if (mode === "bot") return;
      if (!(document.hidden && mode === "fallback")) {
        try { applyState(await api({ action: "poll", sid: sid, since: since }, 15000)); } catch (e) {}
      }
      loop();
    }, d);
  })();
}

/* ---------- Gặp nhân viên ---------- */
var HUMAN_WORDS = ["nhan vien", "admin", "quan tri", "nguoi that", "tu van vien", "ho tro vien", "chu shop", "gap nguoi", "lien he truc tiep", "noi chuyen voi nguoi"];
function norm(t) { return s(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function wantsHuman(t) { var n = " " + norm(t) + " "; return HUMAN_WORDS.some(function (w) { return n.indexOf(" " + w + " ") !== -1 || n.indexOf(" " + w + "s ") !== -1; }); }

function offerHuman() {
  if (mode === "human" || mode === "waiting" || document.querySelector(".tpc-act")) return;
  var el = addMsg("Bạn muốn được kết nối với nhân viên hỗ trợ đúng không? Bấm nút bên dưới để xác nhận nhé 👇", "bot");
  var row = document.createElement("div"); row.className = "tpc-act";
  var ok = document.createElement("button"); ok.className = "tpc-b"; ok.textContent = "✅ Xác nhận gặp nhân viên";
  var no = document.createElement("button"); no.className = "tpc-b g"; no.textContent = "Để sau";
  ok.onclick = function () { row.remove(); startHandoff(); };
  no.onclick = function () { row.remove(); };
  row.appendChild(ok); row.appendChild(no); el.appendChild(row); scrollEnd();
}

async function startHandoff() {
  if (blockedUntil() || mode === "waiting" || mode === "human") return;
  markUsed(); fbPending = false; connAt = Date.now(); lastQ = 0;
  setMode("waiting"); setQueue(1); $("tpcQ").textContent = "#…"; showConn(true); toggleReco(false);
  try {
    applyState(await api({ action: "request", sid: sid, since: since }, 30000));
  } catch (e) {
    var d = Math.max(0, MIN_CONNECT_MS - (Date.now() - connAt)); await wait(d);
    showConn(false); setMode("fallback");
    addMsg("Mình chưa kết nối được với hệ thống nhân viên lúc này. Trợ lý AI sẽ hỗ trợ bạn trước nhé, hoặc bạn có thể nhắn Zalo 0773 181 186 🙏", "bot");
  }
}
function cancelHandoff() {
  api({ action: "cancel", sid: sid }, 10000).catch(function () {});
  fbPending = false; showConn(false); setMode("bot"); addMsg("Đã hủy yêu cầu kết nối nhân viên.", "system");
}

/* ---------- Bộ lọc nội dung + khóa 24 giờ (giữ cơ chế cũ, dùng chung Sheet chặn IP) ---------- */
var BLOCK_KEY = "tp_chat_block_until", BLOCK_IP_KEY = "tp_chat_block_ip", BLOCK_MS = 24 * 60 * 60 * 1000;
var BAD_PLAIN = ["dm","dmm","dcm","dcmm","vcl","vkl","vl","cc","cl","clgt","dit","dit me","sex","porn","xxx","chinh tri"];
var BAD_ACCENT = ["đụ","đụ má","lồn","cặc","cứt","chó","vãi","ngu","đéo","đĩ"];
var banSynced = false, unlockT = null, myIP = "";
function isViolation(text) {
  var raw = s(text).toLowerCase().normalize("NFC");
  if (raw.indexOf("18+") !== -1) return true;
  var pad = " " + raw.replace(/[.,!?;:"'`()\[\]{}<>\/\\|@#$%^&*_=~\-]+/g, " ").replace(/\s+/g, " ").trim() + " ", i;
  for (i = 0; i < BAD_ACCENT.length; i++) if (pad.indexOf(" " + BAD_ACCENT[i] + " ") !== -1) return true;
  var pl = " " + norm(text) + " ";
  for (i = 0; i < BAD_PLAIN.length; i++) if (pl.indexOf(" " + BAD_PLAIN[i] + " ") !== -1) return true;
  return false;
}
function blockedUntil() { try { var v = parseInt(localStorage.getItem(BLOCK_KEY) || "0", 10); return v > Date.now() ? v : 0; } catch (e) { return 0; } }
function applyLock(until) {
  $("tpcLock").classList.add("show"); var i = $("tpcInput"); i.value = ""; i.disabled = true; i.placeholder = "Đã tạm khóa"; $("tpcSend").disabled = true;
  clearTimeout(unlockT); unlockT = setTimeout(releaseLock, Math.max(1000, Math.min(until - Date.now(), 2147483000)));
}
function releaseLock() {
  try { localStorage.removeItem(BLOCK_KEY); localStorage.removeItem(BLOCK_IP_KEY); } catch (e) {}
  $("tpcLock").classList.remove("show"); $("tpcInput").disabled = false; $("tpcInput").placeholder = "Nhập câu hỏi của bạn…"; $("tpcSend").disabled = false;
}
async function getIP() {
  if (myIP) return myIP;
  var srcs = [["https://api.ipify.org?format=json", "json"], ["https://www.cloudflare.com/cdn-cgi/trace", "trace"]];
  for (var i = 0; i < srcs.length; i++) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, 5000);
    try {
      var r = await fetch(srcs[i][0], { cache: "no-store", signal: c.signal }), txt = await r.text();
      var ip = srcs[i][1] === "json" ? s((JSON.parse(txt) || {}).ip) : s((txt.match(/^ip=(.+)$/m) || [])[1]);
      ip = ip.trim(); if (ip && /^[0-9a-fA-F:.]{3,45}$/.test(ip)) { myIP = ip; return ip; }
    } catch (e) {} finally { clearTimeout(t); }
  }
  return "";
}
async function triggerBlock(text) {
  var until = Date.now() + BLOCK_MS;
  try { localStorage.setItem(BLOCK_KEY, String(until)); } catch (e) {}
  applyLock(until);
  for (var k = 0; k < 3; k++) {
    try {
      var ip = await getIP();
      var url = API_BAN_IP + "?t=" + Date.now() + "&action=ban&ip=" + encodeURIComponent(ip || "unknown") + "&text=" + encodeURIComponent(s(text).slice(0, 300)) + "&ua=" + encodeURIComponent(s(navigator.userAgent).slice(0, 200));
      var r = await fetch(url, { cache: "no-store" }); var d = await r.json();
      if (d && d.ok) { try { if (ip) localStorage.setItem(BLOCK_IP_KEY, ip); } catch (e) {} return; }
    } catch (e) {}
    await wait(2000 * (k + 1));
  }
}
async function syncBan() {
  if (banSynced) return; banSynced = true;
  try {
    var stored = ""; try { stored = s(localStorage.getItem(BLOCK_IP_KEY)); } catch (e) {}
    var ip = stored || await getIP(); if (!ip) return;
    var r = await (await fetch(API_BAN_IP + "?t=" + Date.now() + "&action=check&ip=" + encodeURIComponent(ip), { cache: "no-store" })).json();
    if (!r || !r.ok) return;
    var until = r.blocked ? Number(r.until) : 0;
    if (until && until > Date.now()) { try { localStorage.setItem(BLOCK_KEY, String(until)); localStorage.setItem(BLOCK_IP_KEY, ip); } catch (e) {} applyLock(until); }
    else if (stored) releaseLock();
  } catch (e) {}
}

/* ---------- Gửi tin ---------- */
async function submit(text) {
  var inp = $("tpcInput"), until = blockedUntil();
  if (until) { applyLock(until); return; }
  text = s(text != null ? text : inp.value).trim().slice(0, 500);
  if (!text || busy || mode === "waiting") return;
  inp.value = "";
  if (isViolation(text)) { triggerBlock(text); return; }
  addMsg(text, "user"); markUsed();
  if (mode !== "human" && wantsHuman(text)) { offerHuman(); return; }
  busy = true; $("tpcSend").disabled = true;
  try {
    if (mode === "human") {
      applyState(await api({ action: "send", sid: sid, text: text, since: since }, 20000));
    } else {
      typing(true);
      var r = await api({ action: "chat", sid: sid, text: text, since: since }, 40000);
      typing(false);
      if (r.reply) addMsg(r.reply, "bot");
      applyState(r);
      if (r.needHuman && mode !== "human") offerHuman();
    }
  } catch (e) {
    typing(false);
    addMsg("Mình đang gặp sự cố kết nối 😅. Bạn thử lại sau ít phút, hoặc nhắn Zalo 0773 181 186 nhé!", "bot");
  } finally { busy = false; if (!blockedUntil()) $("tpcSend").disabled = false; }
}

/* ---------- Mở / đóng ---------- */
async function restoreSession() {
  if (restored) return; restored = true;
  if (!hadSession) return;
  try {
    var r = await api({ action: "poll", sid: sid, since: 0, full: 1 }, 15000);
    if (r.status && r.status !== "none" && (r.msgs || []).length) {
      r.msgs.forEach(function (m) { addMsg(m.text, m.from); });
      var st = r.status; r.msgs = [];
      connAt = Date.now(); applyState(r);
      return true;
    }
  } catch (e) {}
}
async function openPanel() {
  opened = true;
  $("tpcPanel").classList.add("open"); $("tpcFab").classList.add("off"); $("tpcBubble").classList.add("off"); $("tpcBadge").classList.remove("alert");
  if (!restored) {
    var had = await restoreSession();
    if (!had && !$("tpcBody").children.length) addMsg(GREETING, "bot");
  }
  syncBan();
  var u = blockedUntil(); if (u) applyLock(u);
  setTimeout(function () { var i = $("tpcInput"); if (!i.disabled) i.focus(); }, 200);
}
function closePanel() { opened = false; $("tpcPanel").classList.remove("open"); $("tpcFab").classList.remove("off"); }

$("tpcFab").addEventListener("click", openPanel);
$("tpcClose").addEventListener("click", closePanel);
$("tpcBubbleX").addEventListener("click", function (e) { e.stopPropagation(); $("tpcBubble").classList.add("off"); });
$("tpcSend").addEventListener("click", function () { submit(); });
$("tpcInput").addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); submit(); } });
$("tpcCancel").addEventListener("click", cancelHandoff);
$("tpcReBtn").addEventListener("click", function () { toggleReco(false); startHandoff(); });
$("tpcChips").addEventListener("click", function (e) { var b = e.target.closest(".tpc-chip"); if (b) submit(b.getAttribute("data-q")); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && opened) closePanel(); });

if (blockedUntil()) applyLock(blockedUntil());
})();
