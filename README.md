# Pelada Certa

Sorteador de times equilibrados para pelada e treino: cole a lista do WhatsApp, avalie habilidades de 1 a 10, marque os goleiros e gere times balanceados automaticamente.

## Deploy no Coolify via Railpack

Este projeto é uma SPA React + Vite pré-configurada para build e publicação via **Railpack** (com servidor estático Caddy via `Staticfile`).

### Configuração no Coolify

1. **Build Pack**: selecione `Railpack`.
2. **Build / Output**:
   - Se usar como **Static Site**, defina **Publish Directory** como `dist`.
   - Se usar como aplicação padrão via Railpack, o arquivo `Staticfile` na raiz já instrui o Railpack a executar `vite build` e servir a pasta `dist` via Caddy com fallback para `index.html`.
3. **Porta (Port Exposes)**: `80` (ou use a variável `PORT` padrão configurada no Coolify; o Caddy gerado pelo Railpack escuta automaticamente em `PORT`, com fallback para `80`).
4. **Variáveis de ambiente**: nenhuma variável obrigatória é necessária para rodar em produção (todo o sorteio e a memória de notas funcionam localmente no navegador).

### Comandos locais

- `npm run dev` — servidor de desenvolvimento na porta `3000`
- `npm run build` — gera o build de produção em `dist/`
- `npm run preview` — pré-visualiza `dist/` em `0.0.0.0:${PORT:-3000}`
