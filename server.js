require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── System Prompt (nunca exposto ao cliente) ─────────────────────────────────
const SYSTEM_PROMPT = `Você é o assistente virtual oficial da Bahiacril, empresa especializada em soluções de acrílico conceito, sediada em Salvador, Bahia.

IDENTIDADE E TOM:
- Sofisticado, elegante e moderno — como o próprio acrílico: transparente, brilhante, sem excessos.
- Técnico-criativo: domina espessuras, tipos de acabamento e processos, mas fala em benefícios estéticos.
- Nunca excessivamente formal. Caloroso, consultivo, solucionador.
- Responda sempre em português brasileiro.

PÚBLICOS QUE VOCÊ ATENDE:
1. Arquitetos e Designers — buscam peças exclusivas, mobiliário sob medida, soluções para projetos residenciais/corporativos.
2. Empresas e Lojistas — procuram displays, sinalização premium, Visual Merchandising.
3. Clientes Finais — itens de decoração modernos, organizadores de luxo, peças personalizadas.

PRODUTOS E CATEGORIAS:
- Organizadores de bancada (banheiro, cozinha, escritório)
- Bandejas e petisqueiras
- Displays e porta-retratos
- Sinalização e totens corporativos
- Mobiliário sob medida (mesas, prateleiras, divisórias)
- Peças decorativas personalizadas

CONHECIMENTO TÉCNICO:
- Espessuras: 2mm (itens leves), 3mm (uso geral), 5mm (estrutural leve), 8-10mm (mobiliário), 15-20mm (tampos e mesas)
- Acabamentos: polido, fosco, leitoso/opalino, espelhado, colorido
- Colagem: junta química invisível
- Acrílico vs Vidro: 50% mais leve, 10x mais resistente ao impacto, transparência óptica superior
- Manutenção: pano macio + água + sabão neutro. NUNCA álcool ou abrasivos.

FLUXO DE ATENDIMENTO:
1. Identifique o perfil (arquiteto/designer, empresa/lojista, cliente final)
2. Faça perguntas consultivas: espaço, preferência de acabamento, peso a suportar, medidas
3. Recomende produto/solução com justificativa técnica e estética
4. Para projetos sob medida: colete nome, descrição, dimensões, tipo de acrílico, quantidade, prazo, contato

RESTRIÇÕES:
- Não prometa prazos sem consultar a produção
- Não conceda descontos sem autorização
- Não invente especificações`;

// ─── Storage (JSON simples) ───────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readLeads() {
  try { return JSON.parse(fs.readFileSync(LEADS_FILE, "utf8")); }
  catch { return []; }
}

function saveLead(data) {
  const leads = readLeads();
  const lead = { id: Date.now(), createdAt: new Date().toISOString(), ...data };
  leads.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  return lead;
}

// ─── Rotas de API ─────────────────────────────────────────────────────────────

// POST /api/chat — proxy Anthropic com streaming SSE
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages[] obrigatório" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("SUBSTITUA")) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no .env" });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map(({ role, content }) => ({ role, content })),
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({ error: { message: upstream.statusText } }));
      return res.status(upstream.status).json(err);
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// POST /api/contato — formulário de contato
app.post("/api/contato", (req, res) => {
  const { nome, email, telefone, assunto, mensagem } = req.body;
  if (!nome?.trim() || !email?.trim() || !mensagem?.trim()) {
    return res.status(400).json({ error: "nome, email e mensagem são obrigatórios" });
  }

  const lead = saveLead({ tipo: "contato", nome, email, telefone, assunto, mensagem });
  console.log(`[CONTATO] #${lead.id} — ${nome} <${email}>`);
  res.json({ ok: true, message: "Mensagem recebida! Entraremos em contato em breve." });
});

// POST /api/orcamento — solicitação de orçamento
app.post("/api/orcamento", (req, res) => {
  const { nome, telefone, email, peca, dimensoes, acabamento, quantidade, prazo } = req.body;
  if (!nome?.trim() || !telefone?.trim()) {
    return res.status(400).json({ error: "nome e telefone são obrigatórios" });
  }

  const lead = saveLead({ tipo: "orcamento", nome, telefone, email, peca, dimensoes, acabamento, quantidade, prazo });
  console.log(`[ORÇAMENTO] #${lead.id} — ${nome} | ${peca}`);
  res.json({ ok: true, message: "Orçamento solicitado! Nossa equipe entrará em contato em até 1 dia útil." });
});

// GET /api/leads — visualização dos leads (proteger com senha em produção)
app.get("/api/leads", (req, res) => {
  res.json(readLeads());
});

// POST /api/payment/create — cria preferência de pagamento no Mercado Pago
app.post("/api/payment/create", async (req, res) => {
  const { nome, email, pedido, valor } = req.body;
  if (!nome?.trim() || !email?.trim() || !valor) {
    return res.status(400).json({ error: "nome, email e valor são obrigatórios" });
  }

  const amount = parseFloat(valor);
  if (isNaN(amount) || amount < 1) {
    return res.status(400).json({ error: "Valor mínimo de R$ 1,00" });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken || accessToken.includes("SUBSTITUA")) {
    return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado no .env" });
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Pedido Bahiacril${pedido ? " #" + pedido : ""}`,
          unit_price: amount,
          quantity: 1,
          currency_id: "BRL",
        }],
        payer: { name: nome, email },
        back_urls: {
          success: `${baseUrl}/?pagamento=aprovado`,
          failure: `${baseUrl}/?pagamento=erro`,
          pending: `${baseUrl}/?pagamento=pendente`,
        },
        auto_return: "approved",
        statement_descriptor: "BAHIACRIL",
        payment_methods: { installments: 12 },
        metadata: { pedido, nome, email },
      }),
    });

    const data = await mpRes.json();
    if (!mpRes.ok) {
      return res.status(mpRes.status).json({ error: data.message || "Erro no Mercado Pago" });
    }

    saveLead({ tipo: "pagamento", nome, email, pedido, valor: amount, mp_id: data.id });
    console.log(`[PAGAMENTO] #${data.id} — ${nome} | R$ ${amount}`);
    res.json({ init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/webhook — notificações automáticas do Mercado Pago
app.post("/api/payment/webhook", (req, res) => {
  const { type, data } = req.body;
  console.log(`[WEBHOOK MP] type=${type} id=${data?.id}`);
  res.sendStatus(200);
});

// Fallback → index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Bahiacril — Acrílico Conceito      ║
  ║   http://localhost:${PORT}               ║
  ╚══════════════════════════════════════╝
  `);
});
