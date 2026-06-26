# Space News Online Worker

Servidor gratuito inicial para o modo online do Space News usando Cloudflare Workers + Durable Objects + WebSocket.

## Instalar

```bash
npm install
npx wrangler login
npm run dev
```

Abra:

```txt
http://localhost:8787/create
```

Ele retorna:

```json
{ "room": "ABCDE", "wsUrl": "ws://localhost:8787/room/ABCDE/ws" }
```

## Deploy

```bash
npm run deploy
```

Depois use a URL do Worker no Vercel:

```txt
NEXT_PUBLIC_SPACE_NEWS_WS_URL=wss://space-news-online.SEUNOME.workers.dev
```

## Mensagens do cliente

Entrar:

```json
{ "type": "join", "name": "NIC", "device": "keyboard" }
```

Ready:

```json
{ "type": "ready", "ready": true }
```

Input:

```json
{
  "type": "input",
  "seq": 1,
  "input": {
    "left": false,
    "right": true,
    "up": false,
    "down": false,
    "shot": true,
    "strong": false,
    "boost": false,
    "dodge": false
  }
}
```
