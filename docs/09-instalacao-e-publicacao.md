# Instalação e publicação

[Voltar ao índice](README.md)

## Estado preparado

O build gera manifesto, service worker, ícone e arquivos estáticos de uma Progressive Web App. A interface oferece a ação **Instalar** e instruções alternativas para Android e iOS. O aplicativo informa quando está sem conexão; o shell e arquivos já carregados ficam disponíveis, enquanto operações clínicas exigem conexão para preservar consistência e autoria.

## Teste na rede local

Com o computador e o celular na mesma rede Wi-Fi, abra `http://IP_DO_COMPUTADOR:8443`. Esse endereço permite revisar a interface e os fluxos enquanto Vite, Docker e Supabase estiverem ativos no computador.

## Instalação no celular

A instalação confiável e notificações em segundo plano exigem uma origem HTTPS. Depois da publicação:

- Android/Chrome: abra o endereço, use **Instalar** no MedCare ou a opção **Instalar aplicativo** do navegador;
- iPhone/Safari: toque em **Compartilhar** e em **Adicionar à Tela de Início**.

## Publicação pelo Figma Make

O ambiente local não disponibiliza o executável `figma` usado pelo script `.figma/make/deploy`. A publicação deve ser concluída na interface do Figma Make:

1. Abrir o arquivo do MedCare no Figma Make.
2. Clicar em **Publish**, no canto superior direito.
3. Definir o título **MedCare** e confirmar em **Publish**.
4. Copiar a URL HTTPS gerada, no formato `https://...figma.site`.
5. Configurar essa URL como endereço principal e endereço de redirecionamento no Supabase Auth.

Depois de publicada, a mesma opção aparece como **Update** e envia novas versões sem trocar a URL.

## Dados e notificações em produção

O ambiente remoto usa um projeto Supabase de produção administrado pelo responsável. As seis migrações do MedCare foram aplicadas nesse projeto em 6 de setembro de 2026. A referência do projeto e as credenciais de acesso devem ser compartilhadas com mantenedores por canal privado, quando necessário.

O protótipo visual permanece em <https://great-floor-06843708.figma.site>. O aplicativo funcional está publicado em <https://resilient-valkyrie-cafe0b.netlify.app>.

O site Netlify está vinculado à conta do responsável e configurado como público. Rotas internas, manifesto, service worker e ícone foram validados por HTTPS. O endereço Netlify foi salvo como Site URL no Supabase Auth, com as rotas de confirmação e redefinição permitidas. O Auth remoto respondeu com sucesso e o acesso anônimo direto às tabelas foi recusado, como esperado pelas permissões do banco.

O frontend de produção está configurado localmente com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.production.local`. Esse arquivo é ignorado pelo Git. O build de produção foi validado com essa configuração e está pronto para publicação HTTPS.

O modelo dessas variáveis está em [`.env.production.example`](../.env.production.example).

O `supabase/config.toml` versionado descreve somente o ambiente local. As URLs de produção devem
ser configuradas no painel do Supabase; não use `supabase config push` sem revisar todas as opções
de autenticação que serão alteradas no ambiente remoto.

A central de avisos, a geração de lembretes, os alertas para cuidadores, a resolução após registro e o adiamento estão implementados no banco e na aplicação. O navegador mostra notificações enquanto o MedCare está aberto após a permissão do usuário. A entrega em segundo plano requer configurar o aplicativo OneSignal e o processo servidor que envia os avisos gerados; as credenciais administrativas devem permanecer nos segredos do backend.

## Conferência antes de publicar

1. Testar cadastro, recuperação e convite por e-mail no ambiente remoto.
2. Criar e configurar o aplicativo OneSignal para o domínio publicado.
3. Testar instalação e notificações em Android e iOS reais.
