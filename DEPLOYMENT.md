# Deploy do NovelHub com Netlify + Railway

## 1. GitHub

Suba este projeto para um repositório GitHub. A pasta api contém o serviço de métricas.

## 2. Railway

- Crie um projeto e adicione um serviço PostgreSQL.
- Adicione um serviço Node ligado ao mesmo repositório.
- Configure o diretório raiz do serviço como api.
- Defina as variáveis DATABASE_URL, FRONTEND_ORIGIN e READ_HASH_SALT.
- Gere um domínio público para a API.
- Se usar o arquivo `api/railway.json`, mantenha o serviço com root directory `api`.
- A tabela read_events é criada automaticamente no primeiro deploy.

## 3. Netlify

- Conecte o mesmo repositório ao Netlify.
- Publique a raiz do projeto como site estático.
- Defina a variável de ambiente `NOVELHUB_API_BASE` com a URL pública do Railway, sem barra no final. O build gera `js/config.js` automaticamente.
- Faça novo deploy do Netlify.

Exemplo de configuração:
window.NOVELHUB_CONFIG = { apiBase: "https://novelhub-api.up.railway.app" };

O leitor registra uma leitura por visitante, capítulo e dia. O visitante é identificado por um UUID local e o servidor armazena apenas um hash desse identificador.

