/* ─── Bahiacril Chat Widget (Vanilla JS) ──────────────────────────────────── */

(function () {
  const WA_NUMBER  = "5571996206812";
  const SESSION_KEY = "bc_chat_v1";
  const BUDGET_RE  = /orçamento|medida|projeto|sob medida|personalizado|encomenda|fabricar/i;

  const WELCOME = {
    role: "assistant",
    content: "Olá! Bem-vindo à Bahiacril. ✨ Sou seu consultor virtual especializado em acrílico conceito. Posso te ajudar a encontrar a peça ideal ou desenvolver algo exclusivo para o seu projeto. Como posso te atender hoje?",
  };

  const QUICK_ACTIONS = [
    { emoji: "🛍", label: "Ver Catálogo" },
    { emoji: "📐", label: "Projeto Sob Medida" },
    { emoji: "💡", label: "Me ajude a escolher" },
    { emoji: "🏢", label: "Sou arquiteto/designer" },
  ];

  // ─── State ──────────────────────────────────────────────────────────────────
  let messages     = loadHistory();
  let isOpen       = false;
  let isLoading    = false;
  let showQuick    = messages.length === 1;
  let leadDone     = false;

  // ─── Inject CSS ─────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    .bc-root { position:fixed; z-index:9998; display:flex; flex-direction:column; align-items:flex-end; gap:12px; right:24px; bottom:90px; }
    .bc-fab { width:56px; height:56px; border-radius:50%; background:#1E2D40; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 28px rgba(30,45,64,0.4); transition:transform .2s,box-shadow .2s; }
    .bc-fab:hover { transform:scale(1.08); box-shadow:0 10px 36px rgba(30,45,64,0.5); }
    .bc-panel { width:400px; max-width:calc(100vw - 24px); height:560px; max-height:calc(100dvh - 120px); background:#FDFAF7; border-radius:16px; box-shadow:0 16px 60px rgba(30,45,64,0.3); display:flex; flex-direction:column; overflow:hidden; animation:bc-up .25s cubic-bezier(.16,1,.3,1); }
    @keyframes bc-up { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
    .bc-header { background:#1E2D40; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
    .bc-header-l { display:flex; align-items:center; gap:10px; }
    .bc-hmark { width:36px; height:36px; border:1.5px solid #E8A98A; border-radius:3px; display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-size:14px; font-weight:600; color:#E8A98A; letter-spacing:1px; flex-shrink:0; }
    .bc-htext { display:flex; flex-direction:column; gap:1px; }
    .bc-hname { font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:600; color:#E8A98A; line-height:1; }
    .bc-htag { font-family:'DM Sans',sans-serif; font-size:10px; font-weight:300; letter-spacing:3px; text-transform:uppercase; color:rgba(232,169,138,.55); }
    .bc-header-r { display:flex; align-items:center; gap:12px; }
    .bc-dot { width:8px; height:8px; border-radius:50%; background:#4ADE80; animation:bc-pulse 2s infinite; }
    @keyframes bc-pulse { 0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)} 70%{box-shadow:0 0 0 6px rgba(74,222,128,0)} 100%{box-shadow:0 0 0 0 rgba(74,222,128,0)} }
    .bc-close { background:none; border:none; color:rgba(232,169,138,.5); font-size:22px; cursor:pointer; line-height:1; padding:2px 4px; transition:color .15s; }
    .bc-close:hover { color:#E8A98A; }
    .bc-msgs { flex:1; overflow-y:auto; padding:16px 14px 8px; display:flex; flex-direction:column; scroll-behavior:smooth; }
    .bc-msgs::-webkit-scrollbar { width:3px; }
    .bc-msgs::-webkit-scrollbar-thumb { background:rgba(200,149,108,.3); border-radius:4px; }
    .bc-msg { display:flex; align-items:flex-end; gap:8px; margin-bottom:12px; animation:bc-msg-in .18s ease; }
    @keyframes bc-msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    .bc-msg--bot { flex-direction:row; }
    .bc-msg--user { flex-direction:row-reverse; }
    .bc-avatar { width:30px; height:30px; min-width:30px; background:#1E2D40; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Cormorant Garamond',serif; font-size:12px; font-weight:600; color:#E8A98A; flex-shrink:0; }
    .bc-bubble { max-width:78%; padding:10px 14px; font-family:'DM Sans',sans-serif; font-size:13.5px; line-height:1.55; white-space:pre-wrap; word-break:break-word; }
    .bc-bubble--bot { background:#F5E6DB; color:#1A2535; border-radius:4px 16px 16px 16px; }
    .bc-bubble--user { background:#1E2D40; color:#E8A98A; border-radius:16px 16px 4px 16px; }
    .bc-typing { display:flex; align-items:center; gap:4px; padding:4px 0; height:20px; }
    .bc-typing span { width:6px; height:6px; border-radius:50%; background:#C8956C; animation:bc-dot 1.2s infinite ease-in-out; }
    .bc-typing span:nth-child(2) { animation-delay:.2s; }
    .bc-typing span:nth-child(3) { animation-delay:.4s; }
    @keyframes bc-dot { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
    .bc-quick { display:flex; flex-wrap:wrap; gap:7px; padding:0 14px 12px; }
    .bc-qbtn { background:transparent; border:1px solid #C8956C; color:#1A2535; font-family:'DM Sans',sans-serif; font-size:12.5px; padding:7px 12px; border-radius:20px; cursor:pointer; transition:background .15s,color .15s; }
    .bc-qbtn:hover { background:#1E2D40; color:#E8A98A; border-color:#1E2D40; }
    .bc-lead { margin:0 12px 10px; border:1px solid rgba(200,149,108,.25); border-radius:10px; overflow:hidden; }
    .bc-lead-head { background:#1E2D40; padding:10px 14px; display:flex; align-items:center; gap:8px; }
    .bc-lead-title { font-family:'Cormorant Garamond',serif; font-size:15px; font-weight:600; color:#E8A98A; flex:1; }
    .bc-lead-x { background:none; border:none; color:rgba(232,169,138,.5); font-size:20px; cursor:pointer; line-height:1; transition:color .15s; }
    .bc-lead-x:hover { color:#E8A98A; }
    .bc-lead-form { padding:12px; display:flex; flex-direction:column; gap:8px; }
    .bc-lf { display:flex; flex-direction:column; gap:3px; }
    .bc-lf label { font-size:10.5px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#5A6470; font-family:'DM Sans',sans-serif; }
    .bc-lf input { background:#FDFAF7; border:1px solid rgba(200,149,108,.3); border-radius:6px; padding:8px 10px; font-family:'DM Sans',sans-serif; font-size:13px; color:#1A2535; outline:none; transition:border-color .15s; }
    .bc-lf input:focus { border-color:#C8956C; }
    .bc-lead-sub { background:#1E2D40; color:#E8A98A; border:none; border-radius:6px; padding:10px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; margin-top:2px; transition:background .15s; }
    .bc-lead-sub:hover:not(:disabled) { background:#162030; }
    .bc-lead-sub:disabled { opacity:.45; cursor:not-allowed; }
    .bc-wa-wrap { padding:2px 0 12px 40px; }
    .bc-wa-a { display:inline-flex; align-items:center; gap:8px; background:#25D366; color:#fff; text-decoration:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; padding:9px 16px; border-radius:20px; transition:background .15s; }
    .bc-wa-a:hover { background:#1da851; }
    .bc-footer { flex-shrink:0; border-top:1px solid rgba(200,149,108,.2); padding:10px 12px; background:#FDFAF7; }
    .bc-input-row { display:flex; align-items:flex-end; gap:8px; }
    .bc-ta { flex:1; background:#FDFAF7; border:1px solid rgba(200,149,108,.35); border-radius:10px; padding:9px 12px; font-family:'DM Sans',sans-serif; font-size:14px; color:#1A2535; resize:none; outline:none; line-height:1.45; max-height:90px; overflow-y:auto; transition:border-color .15s; }
    .bc-ta:focus { border-color:#C8956C; }
    .bc-ta::placeholder { color:#9CA3AF; }
    .bc-ta:disabled { opacity:.6; }
    .bc-send { width:40px; height:40px; min-width:40px; border-radius:8px; background:#1E2D40; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s; flex-shrink:0; }
    .bc-send:hover:not(:disabled) { background:#162030; }
    .bc-send:disabled { opacity:.4; cursor:not-allowed; }
    @media(max-width:480px) { .bc-root{right:0;bottom:0;left:0;align-items:stretch;} .bc-panel{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0;border-top-left-radius:16px;border-top-right-radius:16px;} .bc-fab{position:fixed;bottom:90px;right:16px;} }
  `;
  document.head.appendChild(style);

  // ─── Build DOM ──────────────────────────────────────────────────────────────
  const root = document.getElementById("chat-root");
  if (!root) return;

  root.innerHTML = `
    <div class="bc-root" id="bcRoot">
      <button class="bc-fab" id="bcFab" aria-label="Abrir chat Bahiacril">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#E8A98A" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  const bcRoot = document.getElementById("bcRoot");
  const bcFab  = document.getElementById("bcFab");

  // ─── Panel markup (created once, toggled) ───────────────────────────────────
  const panel = document.createElement("div");
  panel.className = "bc-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Chat Bahiacril");
  panel.innerHTML = `
    <header class="bc-header">
      <div class="bc-header-l">
        <div class="bc-hmark">BC</div>
        <div class="bc-htext">
          <span class="bc-hname">Bahiacril</span>
          <span class="bc-htag">Acrílico Conceito</span>
        </div>
      </div>
      <div class="bc-header-r">
        <span class="bc-dot" aria-label="Online"></span>
        <button class="bc-close" id="bcClose" aria-label="Fechar chat">×</button>
      </div>
    </header>

    <div class="bc-msgs" id="bcMsgs" role="log" aria-label="Mensagens"></div>

    <div class="bc-quick" id="bcQuick" role="group" aria-label="Ações rápidas"></div>

    <div id="bcLeadWrap"></div>

    <div class="bc-footer">
      <div class="bc-input-row">
        <textarea class="bc-ta" id="bcInput" placeholder="Digite sua mensagem..." rows="1" aria-label="Mensagem"></textarea>
        <button class="bc-send" id="bcSend" aria-label="Enviar" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="#E8A98A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  // ─── Open/close ─────────────────────────────────────────────────────────────
  bcFab.addEventListener("click", openChat);

  function openChat() {
    bcFab.style.display = "none";
    bcRoot.insertBefore(panel, bcFab);
    isOpen = true;
    renderMessages();
    renderQuickActions();
    document.getElementById("bcClose").addEventListener("click", closeChat);
    document.getElementById("bcInput").addEventListener("input", onInput);
    document.getElementById("bcInput").addEventListener("keydown", onKeydown);
    document.getElementById("bcSend").addEventListener("click", triggerSend);
    requestAnimationFrame(() => document.getElementById("bcInput")?.focus());
  }

  function closeChat() {
    panel.remove();
    bcFab.style.display = "";
    isOpen = false;
  }

  // ─── Render messages ─────────────────────────────────────────────────────────
  function renderMessages() {
    const container = document.getElementById("bcMsgs");
    if (!container) return;
    container.innerHTML = "";

    messages.forEach(msg => container.appendChild(buildMsgEl(msg)));

    if (isLoading) {
      const t = document.createElement("div");
      t.className = "bc-msg bc-msg--bot";
      t.id = "bcTyping";
      t.innerHTML = `<div class="bc-avatar">BC</div><div class="bc-bubble bc-bubble--bot"><div class="bc-typing"><span></span><span></span><span></span></div></div>`;
      container.appendChild(t);
    }

    scrollBottom();
  }

  function buildMsgEl(msg) {
    if (msg._wa) {
      const wrap = document.createElement("div");
      wrap.className = "bc-wa-wrap";
      wrap.innerHTML = `<a href="${msg._wa}" target="_blank" rel="noopener noreferrer" class="bc-wa-a">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Falar no WhatsApp agora
      </a>`;
      return wrap;
    }

    const isBot = msg.role === "assistant";
    const wrap = document.createElement("div");
    wrap.className = `bc-msg bc-msg--${isBot ? "bot" : "user"}`;
    if (isBot) wrap.innerHTML = `<div class="bc-avatar">BC</div>`;
    const bubble = document.createElement("div");
    bubble.className = `bc-bubble bc-bubble--${isBot ? "bot" : "user"}`;
    bubble.textContent = msg.content;
    wrap.appendChild(bubble);
    return wrap;
  }

  function scrollBottom() {
    const c = document.getElementById("bcMsgs");
    if (c) c.scrollTop = c.scrollHeight;
  }

  // ─── Quick actions ───────────────────────────────────────────────────────────
  function renderQuickActions() {
    const qc = document.getElementById("bcQuick");
    if (!qc) return;
    qc.innerHTML = "";
    if (!showQuick) return;

    QUICK_ACTIONS.forEach(({ emoji, label }) => {
      const btn = document.createElement("button");
      btn.className = "bc-qbtn";
      btn.innerHTML = `<span aria-hidden="true">${emoji}</span> ${label}`;
      btn.addEventListener("click", () => sendMessage(label));
      qc.appendChild(btn);
    });
  }

  // ─── Lead capture form ───────────────────────────────────────────────────────
  function showLeadForm() {
    const wrap = document.getElementById("bcLeadWrap");
    if (!wrap || leadDone) return;
    wrap.innerHTML = `
      <div class="bc-lead">
        <div class="bc-lead-head">
          <span aria-hidden="true">📐</span>
          <span class="bc-lead-title">Pré-Orçamento Bahiacril</span>
          <button class="bc-lead-x" aria-label="Fechar formulário">×</button>
        </div>
        <form class="bc-lead-form" id="bcLeadForm" novalidate>
          ${["nome:Seu nome *:text:required","telefone:WhatsApp *:tel:required","peca:Peça / projeto:text:","dimensoes:Dimensões (cm):text:"].map(f => {
            const [n,l,t,r] = f.split(":");
            return `<div class="bc-lf"><label for="bl-${n}">${l}</label><input id="bl-${n}" name="${n}" type="${t}" placeholder="${l.replace(" *","")}" ${r} /></div>`;
          }).join("")}
          <button type="submit" class="bc-lead-sub">Enviar para equipe →</button>
        </form>
      </div>`;

    wrap.querySelector(".bc-lead-x").addEventListener("click", () => { wrap.innerHTML = ""; });
    wrap.querySelector("#bcLeadForm").addEventListener("submit", onLeadSubmit);
  }

  async function onLeadSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.nome?.trim() || !data.telefone?.trim()) return;

    try {
      await fetch("/api/orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch { /* noop — still show confirmation */ }

    const summary = `Nome: ${data.nome}\nWhatsApp: ${data.telefone}${data.peca ? "\nProjeto: " + data.peca : ""}${data.dimensoes ? "\nDimensões: " + data.dimensoes : ""}`;
    const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Olá! Vim pelo site da Bahiacril.\n\n" + summary)}`;

    leadDone = true;
    document.getElementById("bcLeadWrap").innerHTML = "";

    messages.push({
      role: "assistant",
      content: `Perfeito! Recebi os dados do seu projeto:\n\n${summary}\n\nNossa equipe entrará em contato em até 1 dia útil. ✅`,
    });
    messages.push({ role: "assistant", content: "", _wa: waURL });
    saveHistory();
    renderMessages();
  }

  // ─── Input handling ──────────────────────────────────────────────────────────
  function onInput(e) {
    const val = e.target.value;
    const btn = document.getElementById("bcSend");
    if (btn) btn.disabled = !val.trim() || isLoading;

    // auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
  }

  function onKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSend();
    }
  }

  function triggerSend() {
    const input = document.getElementById("bcInput");
    if (!input || isLoading) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    input.style.height = "auto";
    const btn = document.getElementById("bcSend");
    if (btn) btn.disabled = true;
    sendMessage(text);
  }

  // ─── Send message ────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;
    showQuick = false;
    document.getElementById("bcQuick").innerHTML = "";

    messages.push({ role: "user", content: text });
    saveHistory();
    isLoading = true;
    renderMessages();

    if (BUDGET_RE.test(text) && !leadDone) {
      showLeadForm();
    }

    // assistant placeholder
    const placeholder = { role: "assistant", content: "" };
    messages.push(placeholder);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.slice(0, -1).map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err?.error?.message || err?.error || "Erro na resposta");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const pl = line.slice(6).trim();
          if (pl === "[DONE]") continue;
          try {
            const j = JSON.parse(pl);
            if (j.type === "content_block_delta" && j.delta?.text) {
              full += j.delta.text;
              placeholder.content = full;
              // update last bubble live
              const msgEls = document.querySelectorAll("#bcMsgs .bc-msg--bot");
              const last = msgEls[msgEls.length - 1];
              if (last) {
                const bubble = last.querySelector(".bc-bubble--bot");
                if (bubble && bubble.textContent !== undefined) bubble.textContent = full;
              }
              scrollBottom();
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      placeholder.content = `Desculpe, tive um problema técnico. ${err.message}`;
    } finally {
      isLoading = false;
      saveHistory();
      renderMessages();
      const btn = document.getElementById("bcSend");
      if (btn) btn.disabled = false;
    }
  }

  // ─── Session storage ─────────────────────────────────────────────────────────
  function loadHistory() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || [WELCOME]; }
    catch { return [WELCOME]; }
  }

  function saveHistory() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch { /* noop */ }
  }

})();
