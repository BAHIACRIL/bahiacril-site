# Bahiacril — Site Oficial

Site completo com backend para a **Bahiacril — Acrílico Conceito**.  
Stack: Node.js + Express + Vanilla JS/CSS

---

## Pré-requisitos

- Node.js **18+** (necessário para `fetch` nativo)
- npm

Verifique: `node -v`

---

## Instalação

```bash
# 1. Entre na pasta do projeto
cd "SITE BAHIACRIL"

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de variáveis de ambiente
copy .env.example .env
```

---

## Configuração

Abra o arquivo `.env` e preencha:

```env
ANTHROPIC_API_KEY=sk-ant-api03-SUA_CHAVE_AQUI
PORT=3000
WHATSAPP_NUMBER=5571999999999
CONTACT_EMAIL=contato@bahiacril.com.br
```

- **ANTHROPIC_API_KEY** → obtenha em [console.anthropic.com](https://console.anthropic.com)
- **WHATSAPP_NUMBER** → número com DDI (55) + DDD, sem espaços ou símbolos

---

## Rodando o projeto

```bash
# Produção
npm start

# Desenvolvimento (reinicia ao salvar)
npm run dev
```

Acesse: **http://localhost:3000**

---

## Personalização

### Trocar o número de WhatsApp
Busque por `5571999999999` em:
- `server.js` (não precisa alterar, está no `.env`)
- `public/index.html` (links `wa.me/` no contato e no botão flutuante)
- `public/js/chat.js` (variável `WA_NUMBER` no topo)

### Trocar o e-mail e endereço
Edite `public/index.html` na seção `#contato`.

### Adicionar imagens reais à Galeria
Substitua as `<div class="galeria-placeholder">` por `<img>` dentro de cada `<figure class="galeria-item">`.

### Ajustar o System Prompt do chat
Edite a constante `SYSTEM_PROMPT` no início de `server.js`.

### Trocar cores
Edite as CSS variables no topo de `public/css/style.css`.

---

## Estrutura

```
SITE BAHIACRIL/
├── server.js              # Express — API + static files
├── package.json
├── .env                   # Variáveis (NÃO commitar)
├── .env.example           # Modelo do .env
├── data/
│   └── leads.json         # Leads salvos (auto-criado)
└── public/
    ├── index.html         # Site completo (single page)
    ├── css/
    │   └── style.css      # Todos os estilos
    └── js/
        ├── main.js        # Navegação, forms, animações
        └── chat.js        # Widget de chat IA
```

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/chat` | Proxy Anthropic com streaming SSE |
| `POST` | `/api/contato` | Salva mensagem de contato |
| `POST` | `/api/orcamento` | Salva solicitação de orçamento |
| `GET`  | `/api/leads` | Lista todos os leads (proteger em produção) |

---

## Leads salvos

Todas as mensagens de contato e solicitações de orçamento são salvas em `data/leads.json`.

Para visualizar: acesse `http://localhost:3000/api/leads`

> Em produção, proteja essa rota com autenticação!

---

## Deploy (Render / Railway / VPS)

1. Suba o código para um repositório Git (sem o `.env` — está no `.gitignore`)
2. Configure as variáveis de ambiente no painel do serviço
3. Comando de start: `npm start`
4. Porta: use a variável `PORT` (serviços cloud injetam automaticamente)

---

*Bahiacril — Acrílico Conceito | Salvador, Bahia | Desde 1996*
