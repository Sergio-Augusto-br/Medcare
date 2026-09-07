# MedCare

Aplicação web para organizar rotinas de medicamentos, registrar doses e compartilhar o acompanhamento com pessoas autorizadas.

## Estado atual

As Etapas 1 a 3 entregam a fundação técnica, o acompanhamento individual, o cuidado
compartilhado e a preparação da PWA:

- cadastro, confirmação de e-mail, login e saída;
- recuperação e redefinição de senha;
- edição de nome, e-mail, senha, fuso horário e preferências de acessibilidade;
- perfil e rotina própria criados automaticamente no cadastro;
- PostgreSQL com Row Level Security por usuário e pessoa acompanhada;
- cadastro, busca, edição e arquivamento de medicamentos;
- horários, dias da semana, vigência e versões da programação;
- geração idempotente das próximas ocorrências de dose;
- painel diário, agenda por data e histórico de 7, 30 ou 90 dias;
- registro de dose tomada ou não tomada, correção e remoção do registro;
- autoria, trilha de eventos, prevenção de duplicidade e controle de alterações concorrentes;
- convites com prazo, aceite ou recusa, permissões editáveis e revogação;
- seleção entre a rotina própria e as pessoas acompanhadas;
- acesso do cuidador filtrado no banco e ações exibidas conforme suas permissões;
- indicadores por período do dia e evolução semanal;
- central de lembretes e alertas, resolução automática e adiamento;
- exportação dos próprios dados, controle de sessões e encerramento da conta;
- manifesto, service worker, ícone e ação de instalação como PWA;
- rotas protegidas, PWA e estados de carregamento e erro;
- protótipo visual original preservado em `/prototipo`.

Após entrar, acesse `/app` para acompanhar o dia ou `/app/medicamentos/novo` para cadastrar uma rotina.

## Ambiente local

Pré-requisitos: Git, Node.js 22, pnpm 10.34.3 e Docker.

```bash
nvm use
pnpm install
cp -n .env.example .env.local
pnpm supabase:start
pnpm supabase:status
pnpm dev
```

Na primeira execução, se o NVM informar que a versão não está instalada, use `nvm install`. O arquivo `.nvmrc` seleciona automaticamente a versão 22 solicitada pelo projeto.

O argumento `-n` evita sobrescrever um `.env.local` já configurado. Em uma instalação nova, use a URL e a chave publicável exibidas pelo Supabase em `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. No ambiente Figma Make, o servidor Vite já é iniciado pela plataforma.

## Verificação

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm supabase:reset
```

A documentação de produto, requisitos e arquitetura está em [docs/README.md](docs/README.md).

## Acesso pelo navegador e celular

- Navegador no computador ou prévia integrada: `http://localhost:8443/`.
- Celular conectado à mesma rede Wi-Fi: `http://IP_DO_COMPUTADOR:8443/`.
- Administração do banco no computador: `http://localhost:54323/`.
- Caixa de e-mails do ambiente local: `http://localhost:54324/`.

No desenvolvimento, o cliente troca automaticamente o endereço local do Supabase pelo mesmo host usado para abrir a aplicação. Isso permite acessar a API pela rede sem manter dois arquivos de ambiente. O computador, o Vite, o Docker e o Supabase precisam permanecer ligados durante o teste no celular.

O acesso por HTTP na rede local serve para testar a interface móvel. Consulte [Instalação e publicação](docs/09-instalacao-e-publicacao.md) para preparar HTTPS, Supabase remoto e notificações em segundo plano.

## Trabalho em equipe e segurança

O Supabase local precisa permanecer ativo para os fluxos de conta, medicamentos, doses,
cuidadores, indicadores e notificações. Como alternativa, a equipe pode usar um projeto remoto
exclusivo de desenvolvimento configurado em `.env.local`.

Consulte [Configuração do time e GitHub](docs/11-configuracao-time-e-github.md) para preparar uma
máquina nova, escolher o ambiente de banco, executar as verificações e organizar branches e pull
requests. As regras sobre valores públicos, segredos e resposta a exposição estão em
[Segurança do repositório](SECURITY.md).
