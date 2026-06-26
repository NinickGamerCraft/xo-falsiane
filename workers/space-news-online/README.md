# Space News Online Worker v7

Atualizações:
- Versão 0.7.0.
- Host transfer no lobby: se o host sair, o próximo player vira host.
- Sync usa o host atual, não fixo no P1.
- Mantém pausa por votação e retorno ao lobby pelo host.

Deploy:
```bash
cd workers/space-news-online
npm install
npx wrangler deploy
```
