# Bahiacril Chat Widget

Widget de chat assistente virtual para o site da **Bahiacril — Acrílico Conceito**.  
Construído em React + CSS customizado, integrado à API Anthropic com streaming.

---

## Instalação rápida

```bash
npm install lucide-react
# React e Tailwind já devem estar no projeto
```

Copie a pasta `bahiacril-chat/` para `src/components/` do seu projeto.

---

## Uso

```jsx
import BahiacrilChat from './components/bahiacril-chat';

// No layout raiz (ex: App.jsx ou _app.jsx):
<BahiacrilChat
  apiKey={process.env.REACT_APP_ANTHROPIC_KEY}
  whatsappNumber="5571999999999"
  position="bottom-right"
/>
```

### Props

| Prop              | Tipo     | Padrão           | Descrição                                |
|-------------------|----------|------------------|------------------------------------------|
| `apiKey`          | `string` | `""`             | Chave da API Anthropic                   |
| `whatsappNumber`  | `string` | `"5571999999999"`| Número DDD+número para o link wa.me      |
| `position`        | `string` | `"bottom-right"` | `"bottom-right"` ou `"bottom-left"`      |

---

## Configuração da API Key

### Desenvolvimento local
Crie um arquivo `.env.local` na raiz do projeto:
```
REACT_APP_ANTHROPIC_KEY=sk-ant-api03-...
```

### Produção — IMPORTANTE
**Nunca exponha a API key no frontend em produção.**  
Configure um proxy de backend (Next.js API Route, Express, etc.):

```js
// pages/api/chat.js (Next.js)
export default async function handler(req, res) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY, // variável de ambiente do servidor
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: req.body,
  });
  // stream ou retornar resposta
}
```

---

## Demo standalone

Abra `demo.html` diretamente no navegador — não precisa de build.  
Insira sua API key no campo exibido na tela para ativar o assistente.

> O demo usa Babel standalone + React CDN. Para produção, compile com Vite/Next.js.

---

## Fontes (Google Fonts)

Adicione no `<head>` do seu HTML:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
```

---

## Estrutura de arquivos

```
bahiacril-chat/
├── BahiacrilChat.jsx   — componente principal (widget flutuante)
├── ChatMessage.jsx     — renderização de mensagens individuais
├── ChatInput.jsx       — textarea + botão de envio
├── QuickActions.jsx    — botões de ação rápida inicial
├── LeadCapture.jsx     — formulário de pré-orçamento inline
├── index.js            — exports
├── bahiacril-chat.css  — estilos completos do widget
├── demo.html           — demo standalone (sem build)
└── README.md           — este arquivo
```

---

## Funcionalidades

- **Streaming** de respostas token a token via SSE
- **Histórico** persistido em `sessionStorage` (limpa ao fechar o navegador)
- **Quick actions** aparecem na abertura e somem após o primeiro input
- **Detecção de intenção de orçamento** — exibe formulário contextualmente
- **Formulário de pré-orçamento** inline com link direto para WhatsApp
- **Responsivo** — 100vw em mobile, 420px em desktop
- **Acessível** — aria-labels, foco gerenciado, navegação por teclado

---

## TODOs para versão futura

```javascript
// TODO: Integrar com catálogo de produtos via API REST
// TODO: Webhook para notificar equipe de novos leads
// TODO: Analytics de conversas (categorias de perguntas mais comuns)
// TODO: A/B test de mensagem de boas-vindas
// TODO: Modo escuro/claro automático baseado em preferência do sistema
```

---

*Bahiacril — Acrílico Conceito | Salvador, Bahia*
