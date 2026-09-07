# Configuração do time e preparação para o GitHub

[Voltar ao índice](README.md)

**Atualizado em:** 06/09/2026.

## O que cada integrante precisa instalar

| Dependência                     | Versão do projeto                  | Necessidade                                                               |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| Git                             | versão atual compatível com GitHub | Clonar, criar branches e enviar commits.                                  |
| Git LFS                         | opcional no código atual           | Exigido ao adicionar formatos binários listados em `.gitattributes`.      |
| Node.js                         | 22                                 | Executar Vite, TypeScript e as ferramentas JavaScript.                    |
| pnpm                            | 10.34.3                            | Instalar exatamente o grafo de dependências do `pnpm-lock.yaml`.          |
| Docker Engine ou Docker Desktop | versão com Docker Compose          | Executar o Supabase local.                                                |
| Navegador                       | Chrome, Firefox ou Safari atual    | Usar e testar a aplicação.                                                |
| Supabase CLI                    | 2.116, instalada pelo projeto      | Iniciar banco, Auth, Studio e e-mail local; não requer instalação global. |

`mise` é opcional. O arquivo `.mise.toml` instala Node 22 e pnpm 10.34.3. Quem usa NVM pode usar
o arquivo `.nvmrc`.

## Instalação recomendada com banco local

Depois de clonar o repositório:

```bash
cd Medcare
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.34.3 --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm supabase:start
pnpm supabase:status
```

Se a equipe usa `mise`, `mise install` substitui os comandos de NVM e Corepack.

O comando de status mostra uma `PUBLISHABLE_KEY`. Em versões anteriores da CLI, o mesmo valor
pode aparecer como `ANON_KEY`. Copie-o para `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=COLE_A_CHAVE_PUBLICAVEL_LOCAL
VITE_ONESIGNAL_APP_ID=
```

Esse arquivo é individual e não deve entrar no Git. Com o Docker ativo, prepare o banco e inicie
a aplicação:

```bash
pnpm supabase:reset
pnpm dev
```

Acesse:

- aplicativo: <http://localhost:8443>;
- Supabase Studio: <http://localhost:54323>;
- caixa de e-mail local: <http://localhost:54324>.

Na primeira execução, `supabase:start` baixa as imagens Docker, inicia os serviços e aplica o
esquema. `supabase:reset` recria o banco, executa em ordem as migrações versionadas e aplica
`supabase/seed.sql`. Os dados locais são descartáveis e independentes para cada integrante.

Para encerrar os serviços:

```bash
pnpm supabase:stop
```

## O Supabase precisa estar ativo?

Sim, para cadastro, login, medicamentos, doses, cuidadores, indicadores, notificações e conta.
Sem uma API Supabase configurada e acessível, somente a página pública e o protótipo visual podem
ser revisados.

Cada integrante pode escolher uma das opções:

1. **Supabase local, recomendado:** Docker e `pnpm supabase:start` devem permanecer ativos durante
   o desenvolvimento. Cada pessoa trabalha com dados próprios e pode recriar o banco livremente.
2. **Projeto remoto de desenvolvimento:** o líder fornece por canal privado a URL e a chave
   publicável de um projeto exclusivo de desenvolvimento. Esses valores entram em `.env.local` e
   o Docker local não é necessário. A equipe não deve usar o banco de produção no trabalho diário.

As migrações em `supabase/migrations` são a fonte de verdade do banco. Alterações de esquema devem
ser adicionadas como uma nova migração e revisadas no pull request. Apenas responsáveis pelo
ambiente remoto devem executar `supabase link`, `supabase db push` ou `supabase config push`.
Nunca execute esses comandos no projeto de produção durante um teste local.

## Teste local no celular

Com computador e celular na mesma rede, descubra o IPv4 do computador e abra
`http://IP_DO_COMPUTADOR:8443`. O Vite e o cliente do Supabase já adaptam a API local para esse
host.

Para links de confirmação e redefinição funcionarem pelo celular, inclua temporariamente a URL
exata na lista `additional_redirect_urls` de `supabase/config.toml`, por exemplo
`http://192.168.1.20:8443/**`, reinicie o Supabase e não envie esse endereço pessoal no commit.
Para instalar a PWA e validar recursos que exigem HTTPS, use o ambiente publicado.

## Verificação obrigatória antes de um pull request

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

O atalho equivalente é:

```bash
pnpm check
```

O Playwright está declarado no projeto. Quando existirem percursos E2E, instale o navegador uma
vez com `pnpm exec playwright install chromium` e execute `pnpm test:e2e`.

## Fluxo de versionamento sugerido

1. Atualize a branch principal e crie uma branch curta: `feature/nome`, `fix/nome` ou
   `docs/nome`.
2. Faça commits pequenos, com mensagens que expliquem o resultado da mudança.
3. Execute `pnpm check`.
4. Revise `git status`, `git diff` e as regras de [segurança](../SECURITY.md).
5. Abra um pull request descrevendo o problema, o comportamento final e a validação executada.
6. Exija ao menos uma revisão antes de integrar na branch principal.

## Configuração dos ambientes hospedados

No Netlify, configure pela interface do projeto:

- comando de build: `pnpm run build`;
- diretório de publicação: `dist`;
- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_PUBLISHABLE_KEY`;
- `VITE_ONESIGNAL_APP_ID`, somente quando a integração existir.

Não crie um `.env.production.local` no GitHub. Tokens de implantação e futuras credenciais de
backend devem usar os secrets do provedor. No Supabase Auth de cada ambiente, cadastre a URL do
site e as rotas `/auth/callback` e `/redefinir-senha` na lista de redirecionamentos permitidos.

## Checklist para o primeiro envio ao GitHub

- [ ] `.env.local` e `.env.production.local` estão ignorados;
- [ ] `supabase/.temp`, `supabase/.branches` e `.netlify` estão ignorados;
- [ ] `node_modules`, `dist`, relatórios e pacotes de publicação estão ignorados;
- [ ] `.env.example` e `.env.production.example` contêm somente valores seguros;
- [ ] nenhuma chave `service_role`, senha, token ou dado real aparece nos arquivos selecionados;
- [ ] `pnpm-lock.yaml`, migrações e documentação estão selecionados;
- [ ] `pnpm check` passou;
- [ ] o conteúdo preparado para o primeiro commit foi revisado.

## Primeiro envio pelo responsável

Depois de criar um repositório vazio no GitHub, sem README ou `.gitignore` gerados pela
plataforma, execute:

```bash
git init -b main
git add .
git status
git commit -m "feat: preparar versão inicial do MedCare"
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

Antes do commit, o `git status` deve mostrar `.env.example` e `.env.production.example`, mas nunca
`.env.local` ou `.env.production.local`. Se o repositório remoto já possuir commits, faça a
integração do histórico em uma branch separada em vez de forçar o envio.
