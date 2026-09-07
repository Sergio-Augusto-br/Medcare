# Planejamento e decisões

[Voltar ao índice](README.md)

**Data de referência:** 05/09/2026.  
**Status:** desenvolvimento aprovado e iniciado por etapas, sem cronograma ou atribuição de responsáveis definidos.

## Ponto de partida

O projeto possui um protótipo demonstrativo. A documentação foi criada antes da implementação das operações completas, atendendo à solicitação de organizar o objetivo, o escopo e as funcionalidades.

As melhorias discutidas foram aprovadas em 06/09/2026. A stack adotada está registrada em [Stack e arquitetura](08-stack-e-arquitetura.md).

## Etapas sugeridas

| Etapa                         | Entrega                                                                                                                                 | Condições propostas para considerar a etapa concluída                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Definições iniciais       | Modelo de conta, pessoa acompanhada, vínculo, dose e opções técnicas.                                                                   | Decisões que afetam o primeiro percurso registradas; critérios de aceite compreendidos; ambiente e armazenamento definidos.                                                                                                      |
| 1 — Conta e rotina individual | Cadastro, acesso, recuperação, perfil, medicamentos, horários, registro e correção de doses, agenda, histórico e acessibilidade básica. | Uma pessoa utiliza os próprios dados, registra uma ocorrência e encontra o mesmo resultado após recarregar e entrar novamente; alterações não apagam o histórico; erros são apresentados com clareza.                            |
| 2 — Cuidado compartilhado     | Convites, vínculos, permissões, painel do acompanhante e atualização das informações compartilhadas.                                    | Convites pendentes não permitem consulta; permissões são verificadas no servidor; revogação impede novos acessos; uma alteração é refletida nas visões autorizadas; registro por terceiro só existe se essa decisão for adotada. |
| 3 — Acompanhamento completo   | Notificações, indicadores, exportação, preferências avançadas e uso sem conexão, se adotado.                                            | Períodos filtram e recalculam dados; lembretes são verificados nos dispositivos escolhidos; alertas resolvidos não se repetem; preferências são persistidas; conflitos e atualizações pendentes têm tratamento explícito.        |

Os testes de viabilidade de notificações devem ocorrer na etapa 0, mesmo que a entrega completa aconteça depois. O resultado pode influenciar a escolha entre experiência web, aplicação instalável e aplicativo móvel.

Os mecanismos de autorização e a preservação do histórico precisam ser considerados no modelo de dados desde a primeira etapa, mesmo antes da exposição do painel compartilhado.

## Registro das decisões

As linhas marcadas como **Decidido** orientam a implementação. As demais continuam pendentes.

| ID     | Decisão                                                              | Recomendação ou alternativas registradas                                                                                     | Impacto                                        |
| ------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| DEC-01 | Uma conta pode cuidar da própria rotina e acompanhar outras pessoas? | **Decidido:** permitir os dois contextos na mesma conta.                                                                     | Identidade, navegação e vínculos.              |
| DEC-02 | Toda pessoa acompanhada precisa de conta própria?                    | Definir conta própria ou perfil assistido, incluindo como a autorização será estabelecida.                                   | Cadastro, convite e controle da rotina.        |
| DEC-03 | O acompanhante pode registrar ou corrigir doses?                     | **Decidido:** permitir com autorização específica e autoria visível.                                                         | Regras de dose, histórico e interface.         |
| DEC-04 | Como serão realizados acesso e recuperação?                          | **Decidido:** Supabase Auth; detalhes de sessões conectadas serão implementados por operação protegida.                      | Fluxos de conta e integrações.                 |
| DEC-05 | Qual será a arquitetura de serviços e persistência?                  | **Decidido:** PostgreSQL, RLS, Edge Functions e Cron pelo Supabase.                                                          | Serviços, banco e ambiente.                    |
| DEC-06 | Quais dispositivos e canais de notificação serão atendidos?          | **Decidido inicialmente:** aplicação web instalável e OneSignal Web Push; validar a matriz de dispositivos antes da entrega. | Plataforma e entrega de lembretes.             |
| DEC-07 | O aplicativo permitirá registros sem conexão?                        | **Decidido:** o shell informa o estado offline; gravações de dose exigem internet para validar versão, permissão e autoria.  | Evita conflitos clínicos silenciosos.          |
| DEC-08 | Como serão tratados fuso horário e mudança de local?                 | **Decidido:** a programação mantém seu fuso; mudar o perfil não altera rotinas ou ocorrências históricas.                    | Programação e indicadores.                     |
| DEC-09 | Como serão calculados os indicadores?                                | **Decidido:** tomadas divididas por todas as ocorrências previstas no período; período sem doses apresenta valor indefinido. | Histórico e apresentação de percentuais.       |
| DEC-10 | Quais serão os limites dos lembretes e alertas?                      | **Decidido:** lembrete no horário, alerta após 0–1440 minutos, adiamento de 5–120 minutos e resolução pelo registro.         | Notificações e experiência de uso.             |
| DEC-11 | Quais serão os efeitos de exportação, exclusão e retenção?           | **Decidido:** exportação JSON; exclusão remove dados próprios e anonimiza a autoria preservada em rotinas alheias.           | Gerenciamento de conta e dados compartilhados. |
| DEC-12 | Haverá funções específicas para profissionais autorizados?           | Manter como participante do acompanhamento enquanto um módulo específico não for definido.                                   | Escopo funcional e permissões.                 |

## Registro de decisões tomadas

| Data       | Registro                                                                                                                                                     | Alcance                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 05/09/2026 | O responsável solicitou uma pasta filha para documentar o projeto antes de prosseguir com a implementação.                                                   | Criação da pasta `docs/` e desta documentação inicial.                                                   |
| 06/09/2026 | O responsável aprovou as melhorias funcionais e o desenvolvimento em etapas.                                                                                 | As regras propostas passam a orientar o produto.                                                         |
| 06/09/2026 | Stack aprovada: React/Vite no frontend e Supabase/PostgreSQL no backend, com ferramentas de formulários, testes, PWA e notificações documentadas no item 08. | Início da Etapa 1A, dedicada à fundação técnica e às contas.                                             |
| 06/09/2026 | A Etapa 1A foi implementada e verificada localmente.                                                                                                         | Autenticação, perfil, preferências, RLS, migração reproduzível e PWA passam a compor a base operacional. |
| 06/09/2026 | A Etapa 1B foi implementada e verificada pela API local.                                                                                                     | Medicamentos, programações versionadas e ocorrências futuras passam a usar dados persistidos.            |
| 06/09/2026 | A Etapa 1C foi implementada e verificada pela API local.                                                                                                     | Hoje, agenda, histórico e registros de dose passam a usar ocorrências persistidas e auditadas.           |
| 06/09/2026 | A Etapa 2 foi implementada e verificada com duas contas temporárias.                                                                                         | Convites, vínculos, permissões, autoria e revogação passam a controlar o cuidado compartilhado.          |
| 06/09/2026 | A Etapa 3 foi implementada e verificada no ambiente local.                                                                                                   | Indicadores, avisos, exportação, exclusão e PWA ficam prontos para a configuração dos serviços remotos.  |

Ao resolver uma decisão, registrar seu ID, data, escolha, justificativa e efeitos nos requisitos. Atualizar a tabela de pendências e os documentos afetados, sem apagar a justificativa histórica da escolha.

## Critério de conclusão de uma funcionalidade

Uma tela pronta não basta para concluir uma funcionalidade de negócio. Para cada história, verificar os critérios de aceite aplicáveis, os dados persistidos, as permissões, os estados de erro e os efeitos nas telas dependentes.

Registrar quais verificações foram executadas e seus resultados. Os critérios descritos nas [histórias de usuário](02-personas-e-historias.md) são propostas a detalhar por entrega, não testes já concluídos.

## Manutenção do planejamento

- Relacionar tarefas aos identificadores de histórias, requisitos e regras.
- Definir os responsáveis e a ordem das tarefas antes de atribuir datas.
- Atualizar o [estado atual](06-estado-atual.md) quando houver mudanças verificadas.
- Registrar novas funcionalidades como propostas até que seu escopo seja definido.

## Referência para a avaliação de notificações

A versão web precisa de mecanismos próprios para receber eventos em segundo plano. A avaliação técnica deve considerar as capacidades e restrições dos dispositivos escolhidos: [MDN — Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API).
