# Space News Online Worker v3

Atualizações:
- `/check?room=CODIGO` confirma se a sala existe antes de conectar.
- salas só existem depois de `/create`.
- nomes de player agora aceitam até 16 caracteres.
- votação de modo online: PVP, COOP e DISPUTA.
- `start` dispara `game_start` para todos os jogadores quando 2+ players estão READY.

## Deploy

```bash
cd workers/space-news-online
npm install
npx wrangler deploy
```

Depois teste:

```txt
https://SEU-WORKER.workers.dev/create
https://SEU-WORKER.workers.dev/check?room=ABC123
```
