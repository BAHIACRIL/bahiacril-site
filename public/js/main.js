/* ─── Bahiacril — main.js ─────────────────────────────────────────────────── */

// ─── Nav: scroll + mobile ─────────────────────────────────────────────────────
const nav      = document.getElementById("nav");
const toggle   = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const allNavA  = navLinks ? navLinks.querySelectorAll("a") : [];

window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 20);
  updateActiveNav();
}, { passive: true });

toggle?.addEventListener("click", () => {
  const open = toggle.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  navLinks.classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
});

navLinks?.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("open");
    document.body.style.overflow = "";
  }
});

function updateActiveNav() {
  const sections = ["hero","sobre","produtos","diferenciais","galeria","contato","pagamento"];
  let current = "";
  for (const id of sections) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (window.scrollY >= el.offsetTop - 120) current = id;
  }
  allNavA.forEach(a => {
    const href = a.getAttribute("href")?.replace("#","");
    a.classList.toggle("active", href === current);
  });
}

// ─── Smooth scroll for all anchor links ──────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ─── Scroll reveal (IntersectionObserver) ────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    // stagger children inside grids
    const delay = entry.target.dataset.delay || 0;
    setTimeout(() => entry.target.classList.add("visible"), Number(delay));
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".reveal").forEach((el, i) => {
  // stagger cards in grids
  const parent = el.parentElement;
  if (parent?.classList.contains("produtos-grid") ||
      parent?.classList.contains("dif-grid") ||
      parent?.classList.contains("galeria-grid")) {
    el.dataset.delay = (i % 6) * 80;
  }
  revealObs.observe(el);
});

// ─── Modal de Orçamento ───────────────────────────────────────────────────────
const modalOverlay = document.getElementById("modalOverlay");
const modalClose   = document.getElementById("modalClose");
const btnOrcamento = document.getElementById("btnOrcamento");

function openModal() {
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  modalOverlay.querySelector("input")?.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
}

btnOrcamento?.addEventListener("click", openModal);
modalClose?.addEventListener("click", closeModal);
modalOverlay?.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
});

// ─── Form: Contato ────────────────────────────────────────────────────────────
const contatoForm     = document.getElementById("contatoForm");
const contatoFeedback = document.getElementById("contatoFeedback");
const btnContato      = document.getElementById("btnContato");

contatoForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(contatoForm));

  setBtnLoading(btnContato, true);
  showFeedback(contatoFeedback, "");

  try {
    const res = await fetch("/api/contato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.error || "Erro ao enviar");

    showFeedback(contatoFeedback, json.message, "success");
    contatoForm.reset();
  } catch (err) {
    showFeedback(contatoFeedback, err.message, "error");
  } finally {
    setBtnLoading(btnContato, false);
  }
});

// ─── Form: Orçamento ──────────────────────────────────────────────────────────
const orcamentoForm     = document.getElementById("orcamentoForm");
const orcamentoFeedback = document.getElementById("orcamentoFeedback");
const btnOrcamentoSubmit = document.getElementById("btnOrcamentoSubmit");

orcamentoForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(orcamentoForm));

  setBtnLoading(btnOrcamentoSubmit, true);
  showFeedback(orcamentoFeedback, "");

  try {
    const res = await fetch("/api/orcamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.error || "Erro ao enviar");

    showFeedback(orcamentoFeedback, json.message, "success");
    orcamentoForm.reset();

    // fecha modal após 2.5s
    setTimeout(closeModal, 2500);
  } catch (err) {
    showFeedback(orcamentoFeedback, err.message, "error");
  } finally {
    setBtnLoading(btnOrcamentoSubmit, false);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setBtnLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Enviando..." : btn.dataset.label || btn.textContent;
  if (!btn.dataset.label && !loading) {
    // restore from data-label set on first call
  }
}

function showFeedback(el, msg, type = "") {
  if (!el) return;
  el.textContent = msg;
  el.className = "form-feedback" + (type ? ` ${type}` : "");
}

// Save original button labels
document.querySelectorAll(".btn-primary[type=submit]").forEach(btn => {
  btn.dataset.label = btn.textContent;
});

// ─── Form: Pagamento ──────────────────────────────────────────────────────────
const pagamentoForm     = document.getElementById("pagamentoForm");
const pagamentoFeedback = document.getElementById("pagamentoFeedback");
const btnPagamento      = document.getElementById("btnPagamento");

pagamentoForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(pagamentoForm));

  if (!data.nome?.trim() || !data.email?.trim() || !data.valor) {
    showFeedback(pagamentoFeedback, "Preencha nome, e-mail e valor.", "error");
    return;
  }

  setBtnLoading(btnPagamento, true);
  showFeedback(pagamentoFeedback, "");

  try {
    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erro ao gerar pagamento");

    window.location.href = json.init_point;
  } catch (err) {
    showFeedback(pagamentoFeedback, err.message, "error");
    setBtnLoading(btnPagamento, false);
  }
});

// ─── Retorno do Mercado Pago (URL params) ─────────────────────────────────────
(function checkPaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("pagamento");
  if (!status) return;

  window.history.replaceState({}, "", window.location.pathname);

  const msgs = {
    aprovado: { text: "✅ Pagamento aprovado! Obrigado pela confiança. Nossa equipe entrará em contato em breve.", type: "success" },
    pendente: { text: "⏳ Pagamento em processamento. Você receberá confirmação por e-mail.", type: "success" },
    erro:     { text: "❌ Houve um problema com o pagamento. Tente novamente ou fale pelo WhatsApp.", type: "error" },
  };

  const m = msgs[status];
  if (!m) return;

  setTimeout(() => {
    toast(m.text, m.type);
    document.getElementById("pagamento")?.scrollIntoView({ behavior: "smooth" });
  }, 400);
})();

// ─── Toast notifications ──────────────────────────────────────────────────────
function toast(msg, type = "success") {
  const el = document.createElement("div");
  el.style.cssText = `
    position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
    background:${type === "success" ? "#166534" : "#991b1b"};
    color:#fff; padding:12px 24px; border-radius:4px; font-size:14px;
    z-index:9999; animation:fadeIn 0.2s ease; box-shadow:0 4px 20px rgba(0,0,0,0.2);
    font-family:'DM Sans',sans-serif; white-space:nowrap;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
