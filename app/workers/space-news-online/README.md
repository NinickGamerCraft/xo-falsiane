# Space News Online Worker v1.4.0

Atualizações:
- Modelo host-authoritative v2.
- Relay de snapshots com tick/seq/serverTime.
- Descarte de snapshots velhos para evitar rollback visual.
- Input por slot com sequência.
- Pause online em duas fases: pedido, aceite geral e commit.
- Host migration aceitando novo tick quando o host muda.
- Mantém salas com até 4 players no lobby.

Deploy:
```bash
cd workers/space-news-online
npm install
npx wrangler deploy
```
