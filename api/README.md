# NovelHub API

API para registrar leituras e gerar estatísticas/ranking.

## Variáveis

- `DATABASE_URL`: conexão PostgreSQL do Railway.
- `FRONTEND_ORIGIN`: domínio do Netlify, por exemplo `https://novelhub.netlify.app`.
- `READ_HASH_SALT`: segredo aleatório para anonimizar o identificador local do visitante.
- `PORT`: fornecida automaticamente pelo Railway.

## Deploy

1. Suba o projeto ao GitHub.
2. No Railway, crie um serviço apontando para a pasta `api` ou configure `api` como root directory.
3. Adicione um PostgreSQL ao projeto Railway.
4. Configure as variáveis acima.
5. Use a URL pública da API em `js/config.js` no site Netlify.

## Endpoints

- `GET /api/health`
- `POST /api/reads`
- `GET /api/stats`
- `GET /api/ranking?limit=5`

A tabela é criada automaticamente no primeiro deploy. Uma leitura do mesmo visitante para o mesmo capítulo só conta uma vez por dia.

