import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import QuickActions from "./QuickActions";
import LeadCapture from "./LeadCapture";
import "./bahiacril-chat.css";

// ─── System Prompt ──────────────────────────────────────────────────────────
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

CONHECIMENTO TÉCNICO QUE VOCÊ APLICA:
- Espessuras: 2mm (itens leves/decorativos), 3mm (uso geral), 5mm (estrutural leve), 8-10mm (mobiliário, peças que suportam peso), 15-20mm (tampos e mesas)
- Acabamentos: polido (brilhante, transparente), fosco (aveludado, anti-reflexo), leitoso/opalino (difuso, elegante), espelhado, colorido
- Colagem: junta química invisível — diferencial estético em relação ao vidro
- Acrílico vs Vidro: 50% mais leve, resistência ao impacto 10x superior, transparência óptica superior, trabalhabilidade superior (curva, corte, fresa)
- Manutenção: NUNCA usar álcool, solventes ou produtos abrasivos. Limpar apenas com pano macio umedecido em água e sabão neutro.

FLUXO DE ATENDIMENTO:

ETAPA 1 — IDENTIFICAÇÃO:
Pergunte com qual perfil o cliente se identifica (Arquiteto/Designer, Empresa/Lojista, Cliente Final) para personalizar a abordagem.

ETAPA 2 — DISCOVERY:
Faça perguntas consultivas para entender a necessidade:
- "Qual espaço essa peça vai ocupar?"
- "Tem preferência por acrílico transparente, colorido ou fosco?"
- "A peça precisa suportar algum peso específico?"
- "Tem medidas em mente ou prefere começar pelo estilo?"

ETAPA 3 — RECOMENDAÇÃO:
Indique o produto ou solução ideal com justificativa técnica e estética.

ETAPA 4 — CONVERSÃO:
- Produto de catálogo → Direcione para o e-commerce.
- Projeto especial/sob medida → Colete: nome, medidas aproximadas, tipo de acrílico desejado, prazo, e direcione para WhatsApp com resumo.

COLETA DE DADOS PARA ORÇAMENTO (projetos sob medida):
Pergunte de forma natural, uma informação por vez:
1. Nome e perfil (arquiteto, empresa, pessoa física)
2. Descrição da peça/projeto
3. Dimensões aproximadas (L x A x P em cm)
4. Tipo de acrílico preferido (transparente/colorido/fosco/espelhado)
5. Quantidade
6. Prazo desejado
7. Contato (WhatsApp ou e-mail)

Ao final, resuma os dados coletados e informe que a equipe comercial entrará em contato em até 1 dia útil.

O QUE VOCÊ NÃO FAZ:
- Não promete prazos de entrega sem consultar a produção (diga: "o prazo exato será confirmado pela nossa equipe").
- Não concede descontos sem autorização (diga: "nossa equipe comercial pode verificar condições especiais para o seu projeto").
- Não deprecia outros materiais — exalta as propriedades nobres do acrílico.
- Não inventa especificações de produtos que não conhece.`;

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Olá! Bem-vindo à Bahiacril. ✨ Sou seu consultor virtual especializado em acrílico conceito. Posso te ajudar a encontrar a peça ideal do nosso catálogo ou desenvolver algo exclusivo para o seu projeto. Como posso te atender hoje?",
};

const BUDGET_KEYWORDS = /orçamento|medida|projeto|sob medida|personalizado|encomenda|fabricar|fazer|construir/i;

const SESSION_KEY = "bahiacril_chat_history";

// ─── Logo SVG inline ─────────────────────────────────────────────────────────
const LogoIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="34" height="34" rx="4" stroke="#E8A98A" strokeWidth="2" fill="none" />
    <text
      x="50%" y="56%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontFamily="Cormorant Garamond, serif"
      fontSize="16"
      fontWeight="700"
      fill="#E8A98A"
      letterSpacing="0.5"
    >
      BC
    </text>
  </svg>
);

// ─── API call with streaming ──────────────────────────────────────────────────
const streamBahiacrilAI = async (messages, onChunk, apiKey) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message || "Erro na API");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        if (json.type === "content_block_delta" && json.delta?.text) {
          onChunk(json.delta.text);
        }
      } catch {
        // skip malformed lines
      }
    }
  }
};

// ─── Main component ───────────────────────────────────────────────────────────
const BahiacrilChat = ({
  apiKey = "",
  whatsappNumber = "5571999999999",
  position = "bottom-right",
}) => {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
    } catch {
      return [WELCOME_MESSAGE];
    }
  });
  const [input, setInput]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [showQuick, setShowQuick]     = useState(messages.length === 1);
  const [showLead, setShowLead]       = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [error, setError]             = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // persist to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch { /* noop */ }
  }, [messages]);

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setShowQuick(false);
    setError(null);
    const userMsg = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    // detect budget intent
    if (BUDGET_KEYWORDS.test(trimmed) && !leadSubmitted) {
      setShowLead(true);
    }

    // placeholder for streaming response
    const assistantPlaceholder = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      const key = apiKey || (typeof window !== "undefined" && window.__BAHIACRIL_API_KEY__) || "";
      if (!key) throw new Error("Configure a API key da Anthropic (prop apiKey ou window.__BAHIACRIL_API_KEY__).");

      // Only send role+content to API
      const apiMessages = nextMessages.map(({ role, content }) => ({ role, content }));

      let full = "";
      await streamBahiacrilAI(apiMessages, (chunk) => {
        full += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }, key);
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Desculpe, tive um problema técnico. ${e.message} Tente novamente ou fale conosco pelo WhatsApp.`,
        };
        return updated;
      });
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, apiKey, leadSubmitted]);

  const handleLeadSubmit = ({ name, phone, project, dims, waURL, summary }) => {
    setShowLead(false);
    setLeadSubmitted(true);

    const confirmMsg = {
      role: "assistant",
      content: `Perfeito! Recebi os seus dados:\n\n${summary}\n\nNossa equipe comercial entrará em contato em até 1 dia útil. ✅\n\nSe preferir acelerar, clique no botão abaixo para nos chamar no WhatsApp agora mesmo!`,
    };
    const waMsg = { role: "assistant", content: `__WA__${waURL}`, _waURL: waURL };
    setMessages((prev) => [...prev, confirmMsg, waMsg]);
  };

  const positionStyle = position === "bottom-left"
    ? { left: 24, right: "auto" }
    : { right: 24, left: "auto" };

  return (
    <div className="bc-root" style={{ ...positionStyle, bottom: 24 }} aria-live="polite">
      {/* ── Floating button ── */}
      {!open && (
        <button
          className="bc-fab"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat Bahiacril"
          title="Fale com a Bahiacril"
        >
          <LogoIcon size={30} />
        </button>
      )}

      {/* ── Chat panel ── */}
      {open && (
        <div className="bc-panel" role="dialog" aria-modal="true" aria-label="Chat Bahiacril">

          {/* Header */}
          <header className="bc-header">
            <div className="bc-header-left">
              <LogoIcon size={26} />
              <div className="bc-header-text">
                <span className="bc-brand-name">Bahiacril</span>
                <span className="bc-brand-tag">Acrílico Conceito</span>
              </div>
            </div>
            <div className="bc-header-right">
              <span className="bc-online-dot" aria-label="Online" />
              <button
                className="bc-close-btn"
                onClick={() => setOpen(false)}
                aria-label="Fechar chat"
              >
                ×
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="bc-messages" role="log" aria-label="Histórico de mensagens">
            {messages.map((msg, i) => {
              if (msg.content?.startsWith("__WA__")) {
                const url = msg._waURL || msg.content.replace("__WA__", "");
                return (
                  <div key={i} className="bc-wa-btn-wrap">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bc-wa-btn"
                      aria-label="Abrir WhatsApp da Bahiacril"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Falar no WhatsApp agora
                    </a>
                  </div>
                );
              }
              return <ChatMessage key={i} message={msg} />;
            })}
            {isLoading && <ChatMessage isTyping />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {showQuick && (
            <QuickActions onSelect={(label) => sendMessage(label)} />
          )}

          {/* Lead capture form */}
          {showLead && !leadSubmitted && (
            <LeadCapture
              onSubmit={handleLeadSubmit}
              onClose={() => setShowLead(false)}
            />
          )}

          {/* Input */}
          <div className="bc-footer">
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              disabled={isLoading}
            />
          </div>

        </div>
      )}
    </div>
  );
};

export default BahiacrilChat;
