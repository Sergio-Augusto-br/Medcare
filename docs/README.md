# Documentação do Medcare

Documentação funcional e técnica do projeto, mantida junto à implementação.

**Atualizado em:** 06/09/2026.  
**Estágio:** PWA publicada em HTTPS e integrada ao Supabase remoto; validação manual de aceitação em andamento. O push com o app fechado ainda depende de um serviço externo.

## Visão rápida

O Medcare propõe organizar a rotina de medicamentos, acompanhar o registro de doses e permitir o apoio de familiares e cuidadores. Seu público declarado inclui pacientes idosos, cuidadores e famílias.

A aplicação possui contas, preferências, medicamentos, doses, indicadores, notificações, compartilhamento e gerenciamento de dados persistidos no Supabase. Os percursos de Maria e Carlos continuam disponíveis somente como referência visual.

## Índice e ordem de leitura

| Documento                                                               | Conteúdo                                                                                 |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [01 — Visão geral e objetivos](01-visao-geral.md)                       | Contexto, problema, proposta, objetivo geral, objetivos específicos e limites do escopo. |
| [02 — Personas e histórias de usuário](02-personas-e-historias.md)      | Público, personagens do protótipo, histórias e critérios de aceite propostos.            |
| [03 — Funcionalidades e requisitos](03-funcionalidades-e-requisitos.md) | Catálogo funcional, atendimento atual e requisitos de qualidade propostos.               |
| [04 — Contas e regras de negócio](04-contas-e-regras-de-negocio.md)     | Identidades, vínculos, permissões, doses e regras sugeridas para o desenvolvimento.      |
| [05 — Organização técnica](05-organizacao-tecnica.md)                   | Ferramentas, estrutura atual, organização do trabalho e responsabilidades a definir.     |
| [06 — Estado atual](06-estado-atual.md)                                 | Interações implementadas, simulações, limitações e lacunas verificadas no código.        |
| [07 — Planejamento e decisões](07-planejamento-e-decisoes.md)           | Sequência de desenvolvimento sugerida, condições de entrega e decisões abertas.          |
| [08 — Stack e arquitetura](08-stack-e-arquitetura.md)                   | Ferramentas aprovadas, decisões técnicas, modelo inicial e etapa em andamento.           |
| [09 — Instalação e publicação](09-instalacao-e-publicacao.md)           | Teste móvel, PWA, requisitos de HTTPS, Supabase remoto e notificações push.              |
| [10 — Roteiro de testes de aceitação](10-roteiro-testes-aceitacao.md)   | Casos manuais para celular e navegador, resultados esperados e modelo de report.         |
| [11 — Configuração do time e GitHub](11-configuracao-time-e-github.md)  | Dependências, Supabase local/remoto, segurança e fluxo de versionamento.                 |

## Como interpretar os documentos

- **Observado no código:** comportamento ou estrutura identificados na análise estática do repositório. Não significa que houve teste em execução.
- **Parcial:** existe uma interação local, mas o processo de negócio não está completo.
- **Visual:** existem tela, campos ou dados de exemplo, sem a operação de negócio correspondente.
- **Anunciado:** o recurso é mencionado na interface, mas seu fluxo não está implementado.
- **Proposto:** melhoria, regra ou critério recomendado para a evolução do produto; não equivale a uma decisão técnica aprovada.
- **Pendente:** escolha de produto ou tecnologia que ainda precisa ser definida e registrada.

O catálogo de requisitos descreve a intenção do produto. O inventário do estado atual descreve o código existente. Os critérios de aceite são condições futuras de verificação, não resultados de testes já realizados.

## Fontes da documentação

- [Entrada do aplicativo](../src/App.tsx), [aplicação funcional](../src/Root.tsx) e [protótipo visual](../src/PrototypeApp.tsx).
- [Descrição do projeto](../.figma/make/site.json): proposta e público-alvo declarados.
- [Dependências e scripts](../package.json), [ferramentas](../.mise.toml) e [configuração do Vite](../vite.config.ts).
- [Orientações do repositório](../AGENTS.md).
- Análise e sugestões discutidas com o responsável pelo projeto antes desta documentação.

Não foi identificada pesquisa formal de usuários no material analisado. As personas e histórias foram reconstruídas a partir dessas fontes. As referências externas utilizadas para sugestões específicas estão indicadas nos documentos correspondentes.

## Manutenção

1. Registrar decisões de produto e tecnologia no documento 07, com data e justificativa.
2. Atualizar os requisitos e histórias quando o comportamento esperado mudar.
3. Atualizar o estado atual somente após conferir a implementação e registrar a verificação realizada.
4. Manter os identificadores `HU`, `RF`, `RNF`, `RN` e `DEC` estáveis para permitir referências entre tarefas e documentação.
5. Distinguir dados de demonstração, recomendações e funcionalidades operacionais em cada revisão.
