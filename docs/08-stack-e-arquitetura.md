# Stack e arquitetura aprovadas

[Voltar ao índice](README.md)

**Decisão registrada em:** 06/09/2026.  
**Status:** aprovada para o desenvolvimento em etapas.

## Stack

| Área                 | Ferramentas                                                               |
| -------------------- | ------------------------------------------------------------------------- |
| Interface            | React 19, TypeScript, Vite e Tailwind CSS 4                               |
| Navegação e dados    | React Router e TanStack Query                                             |
| Formulários          | React Hook Form e Zod                                                     |
| Datas                | date-fns no cliente; datas, horários locais e `timestamptz` no PostgreSQL |
| Backend              | Supabase Auth, PostgreSQL, Row Level Security, Edge Functions e Cron      |
| Notificações         | OneSignal Web Push, a integrar em etapa posterior                         |
| Aplicação instalável | vite-plugin-pwa                                                           |
| Qualidade            | TypeScript, ESLint e oxfmt                                                |
| Verificação          | Vitest, Testing Library e Playwright                                      |

## Decisões de arquitetura

- Uma conta poderá ter sua própria rotina e acompanhar várias pessoas.
- Conta, pessoa acompanhada e vínculo são entidades distintas.
- Cada vínculo possui permissões por paciente.
- Um acompanhante poderá registrar uma dose somente com permissão específica; a autoria será preservada.
- Medicamentos, versões de programação, ocorrências de dose e eventos de correção são registros distintos.
- Regras de acesso serão verificadas no banco por Row Level Security e nas operações privilegiadas do servidor.
- O protótipo original continuará disponível em `/prototipo` durante a migração dos fluxos.

## Modelo inicial

A primeira migração cria `profiles`, `patients`, `patient_memberships`, `invitations`, `medications`, `medication_schedules`, `dose_occurrences`, `dose_events`, `notifications` e `push_subscriptions`.

O cadastro no Supabase Auth cria automaticamente o perfil e a rotina própria. As tabelas públicas usam RLS. O registro de dose usa uma função transacional idempotente e mantém eventos de auditoria. Aceitar convites e excluir conta serão expostos por funções com contratos próprios nas próximas etapas.

## Ambientes

- Desenvolvimento local: Supabase CLI e Docker, com dados descartáveis.
- Prévia do frontend: Vite/Figma Make conectado ao Supabase local ou a um projeto de desenvolvimento.
- Produção: projeto Supabase e origem HTTPS separados do desenvolvimento.

Segredos administrativos não podem ser enviados ao navegador. O frontend utiliza somente URL e chave publicável, protegida pelas políticas RLS.

## Entrega atual

A Etapa 1A implementa autenticação e gerenciamento básico da conta: cadastro, confirmação de e-mail, login, recuperação de senha, perfil, preferências e troca de credenciais. A migração foi aplicada e recriada no ambiente local, e as políticas de perfil e pessoa própria foram verificadas com o papel autenticado.

A Etapa 1B implementa cadastro e manutenção de medicamentos, versões de programação e geração idempotente das ocorrências futuras. Alterações concorrentes usam a versão esperada; arquivar remove pendências futuras e preserva ocorrências já registradas.

A Etapa 1C implementa painel diário, agenda por data, histórico, registro e correção de doses, com autoria, idempotência e controle de versão.

A Etapa 2 implementa cuidado compartilhado com convites, aceite, recusa, vínculos, seleção de pessoa, permissões editáveis, autoria e revogação. As regras são verificadas nas funções do banco e nas políticas RLS.

A Etapa 3 implementa indicadores avançados, central de avisos, geração e resolução de notificações, adiamento, exportação, sessões, encerramento de conta, estado offline e preparação da instalação.

O código local está concluído. A homologação instalada exige configurar Supabase remoto, domínio HTTPS e OneSignal, conforme [Instalação e publicação](09-instalacao-e-publicacao.md).
