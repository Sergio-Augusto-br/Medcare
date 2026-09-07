# Segurança do repositório

## Valores que podem aparecer no frontend

O Vite incorpora no JavaScript do navegador qualquer variável cujo nome começa com `VITE_`.
Essas variáveis precisam ser públicas:

- `VITE_SUPABASE_URL`: endereço público da API;
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave publicável do Supabase;
- `VITE_ONESIGNAL_APP_ID`: identificador público do aplicativo OneSignal, quando integrado.

A URL e a chave publicável do Supabase identificam o projeto, mas não concedem privilégios
administrativos. O MedCare protege as tabelas com Row Level Security. Mesmo assim, os valores reais
de cada ambiente devem ficar nos arquivos locais ou nas variáveis do provedor de hospedagem para
evitar que desenvolvimento e produção sejam confundidos.

## Segredos que nunca podem ser versionados

- chave `service_role` ou qualquer `sb_secret_*` do Supabase;
- senha do banco PostgreSQL;
- token gerado por `supabase login`;
- token pessoal do GitHub ou Netlify;
- OneSignal REST API Key;
- senha SMTP, chave privada, certificado ou arquivo de credenciais;
- banco exportado, relatório ou captura contendo dados pessoais ou clínicos.

Segredos de backend não podem receber prefixo `VITE_`. Quando Edge Functions forem adicionadas,
as credenciais administrativas deverão ser cadastradas como secrets do Supabase e lidas apenas no
servidor.

## Proteções presentes

O `.gitignore` exclui:

- `.env`, `.env.local`, `.env.production.local` e demais ambientes reais;
- estado local das CLIs do Supabase e Netlify;
- `node_modules`, `dist`, relatórios de teste e pacotes de publicação;
- estado local das ferramentas de agentes.

Somente `.env.example` e arquivos no formato `.env.*.example` podem ser versionados. Eles devem
conter marcadores ou valores do Supabase local, nunca credenciais reais.

## Verificação antes de cada publicação

1. Execute `git status --short --ignored` e confirme que os arquivos `.env*.local` aparecem como
   ignorados.
2. Execute `git diff --cached` e revise todo o conteúdo que será enviado.
3. Procure por nomes de segredos:

   ```bash
   git grep -nE 'SERVICE_ROLE|sb_secret_|PRIVATE KEY|DATABASE_PASSWORD|REST_API_KEY'
   ```

4. Confirme que exemplos de e-mail e medicamentos são fictícios.
5. Se um segredo entrar em um commit, revogue-o no provedor imediatamente. Removê-lo apenas no
   commit seguinte não elimina o valor do histórico.

## Relato de vulnerabilidade

Não abra uma issue pública com credenciais, dados pessoais ou passos que exponham contas reais.
Envie o relato por um canal privado definido pela equipe e inclua somente dados fictícios nas
evidências.
