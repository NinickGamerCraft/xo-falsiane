# Space News Online Worker v6

Atualizações:
- Versão 0.6.0.
- Mantém sync via host para reduzir desync.
- Adiciona base de retorno ao lobby pelo host (`lobby_return_request` -> `lobby_return`).
- Mantém `/create`, `/check` e WebSocket por sala.

## Deploy

```bash
cd workers/space-news-online
npm install
npx wrangler deploy
```
