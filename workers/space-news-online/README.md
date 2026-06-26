# Space News Online Worker v5

Atualizações:
- P1/host envia `sync` com snapshot do jogo para evitar desync de posição, waves, power-ups e game over.
- `pause_request` virou fila real: a partida só pausa quando todos os jogadores aceitam.
- Se um player sair durante partida online, o Worker avisa `player_left` e encerra a partida para os outros.
- Mantém `/create`, `/check` e WebSocket por sala.

## Deploy

```bash
cd workers/space-news-online
npm install
npx wrangler deploy
```
