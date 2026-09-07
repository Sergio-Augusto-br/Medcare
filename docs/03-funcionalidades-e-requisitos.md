# Funcionalidades e requisitos

Data da análise: **2026-09-05**. [Índice da documentação](README.md).

Este catálogo organiza o comportamento representado no protótipo MedCare e as melhorias sugeridas na análise. Os identificadores RF e RNF foram criados para esta documentação; não representam um backlog previamente aprovado.

A fonte principal é [src/App.tsx](../src/App.tsx). A autorização para documentar não implica aprovação das propostas de implementação. Nenhuma das funcionalidades de negócio abaixo está completa de ponta a ponta.

## Como interpretar os estados

- **Parcial:** existe interação local ou navegação relacionada à função, mas faltam dados persistentes, regras ou integração para concluí-la.
- **Visual:** a interface representa a função; campos HTML podem responder à digitação ou seleção, sem executar o processo indicado.
- **Anunciado:** a função é mencionada em texto, sem um fluxo que a realize.

Esses estados descrevem o código atual, não a prioridade de desenvolvimento. O detalhamento das limitações está em [Estado atual](06-estado-atual.md).

## Catálogo funcional derivado do protótipo

| ID    | Funcionalidade representada                                                                                              | Origem em `src/App.tsx`               | Estado atual                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| RF-01 | Criar conta, entrar e indicar uso próprio ou acompanhamento de outra pessoa. O perfil apresenta opções de conta e saída. | Rotas de autenticação e `/app/perfil` | **Implementado:** cadastro, confirmação, acesso, recuperação, perfil, credenciais, sessões e exclusão.         |
| RF-02 | Cadastrar nome, dosagem, unidade e forma do medicamento; consultar a lista e buscar medicamentos.                        | `/app/medicamentos`                   | **Implementado:** cadastro, busca, edição e arquivamento persistentes.                                         |
| RF-03 | Organizar horários diários conforme a prescrição e visualizar uma confirmação da rotina.                                 | `/app/medicamentos/novo`              | **Implementado:** horários, dias, vigência, fuso, versões e ocorrências futuras.                               |
| RF-04 | Consultar as doses do dia e a agenda, identificando horários e estados.                                                  | `/app`, `/app/agenda`                 | **Implementado:** painel diário e consulta por data usam as ocorrências persistidas.                           |
| RF-05 | Receber lembretes nos horários programados e solicitar novo aviso.                                                       | `/app/notificacoes`                   | **Parcial:** geração, central, resolução e adiamento implementados; push fechado aguarda configuração externa. |
| RF-06 | Confirmar a tomada de uma dose e visualizar o registro realizado.                                                        | `/app/doses/:doseId`                  | **Implementado:** salva ocorrência, horário efetivo, autoria e evento sem duplicar requisições.                |
| RF-07 | Informar opcionalmente um motivo para não registrar uma dose como tomada.                                                | `/app/doses/:doseId`                  | **Implementado:** salva “não tomada” e o motivo opcional na ocorrência.                                        |
| RF-08 | Consultar o histórico por períodos de 7, 30 ou 90 dias.                                                                  | `/app/historico`                      | **Implementado:** lista ocorrências e recalcula contagens e percentual por período.                            |
| RF-09 | Corrigir no histórico uma confirmação feita por engano.                                                                  | `/app/doses/:doseId`                  | **Implementado:** corrige ou remove o registro e preserva eventos de auditoria.                                |
| RF-10 | Consultar indicadores de doses registradas, evolução semanal e distribuição por período do dia.                          | `/app/indicadores`                    | **Implementado:** períodos, totais, percentual, faixas do dia e evolução semanal calculados no banco.          |
| RF-11 | Convidar uma pessoa de confiança e escolher permissões de acompanhamento.                                                | `/app/cuidados`, `/app/convites`      | **Implementado:** convite, aceite, recusa, cancelamento, permissões, atualização e revogação persistentes.     |
| RF-12 | Permitir ao cuidador consultar o resumo diário, pendências e indicadores da pessoa acompanhada.                          | Seletor global e rotas `/app`         | **Implementado:** seleciona pessoas vinculadas e aplica permissões no servidor e na navegação.                 |
| RF-13 | Mostrar ao acompanhante alertas de doses não registradas e sua resolução.                                                | `/app/notificacoes`                   | **Implementado no aplicativo:** geração autorizada, preferência, atraso e resolução vinculada à dose.          |
| RF-14 | Escolher tamanho do texto, contraste, redução de animações e texto nos estados.                                          | `/app/perfil`                         | **Implementado:** preferências são persistidas e aplicadas globalmente.                                        |

O indicador chamado “adesão” apresenta **doses registradas**. A ausência de registro não comprova que uma dose deixou de ser tomada. O protótipo também não demonstra resultados clínicos.

## Melhorias sugeridas, ainda sujeitas a validação

As propostas seguintes estendem ou tornam operacionais os fluxos existentes. Os critérios indicam como verificar a proposta caso seja aprovada; não descrevem comportamento já entregue.

| Referência                 | Proposta                                                                                                                                           | Critério de verificação sugerido                                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RF-01                      | Implementar cadastro, autenticação, recuperação de acesso, edição do perfil e saída; definir encerramento de conta e destino dos dados associados. | Criar uma conta, entrar com ela, atualizar um dado do perfil e sair; o estado exibido deve corresponder à identidade autenticada.                                                                                  |
| RF-01, RF-11, RF-12        | Separar identidade da conta, paciente e vínculo de acompanhamento; avaliar uso próprio e cuidado de terceiros pela mesma conta.                    | Uma pessoa autorizada acessa apenas os pacientes vinculados, com identificação clara de quem está sendo acompanhado. A possibilidade de acumular papéis depende de decisão de produto.                             |
| RF-02, RF-03               | Salvar medicamentos e horários escolhidos; permitir edição e arquivamento preservando registros anteriores.                                        | Um medicamento preenchido pelo usuário aparece na lista; os horários exibidos na confirmação correspondem aos salvos; arquivar interrompe programação futura sem apagar o histórico.                               |
| RF-04, RF-06, RF-07, RF-09 | Identificar cada ocorrência de dose, registrar horário efetivo e motivo opcional e permitir correção.                                              | Confirmar uma ocorrência altera apenas aquela dose; início, histórico e visão autorizada do cuidador exibem o mesmo resultado.                                                                                     |
| RF-05, RF-13               | Vincular lembretes e alertas às doses e às preferências de cada destinatário.                                                                      | Na condição de disparo definida, o aviso corresponde à dose e ao destinatário autorizado; confirmar a dose resolve a pendência e evita repetição indevida. Canal e regras de disparo ainda precisam ser definidos. |
| RF-08, RF-10               | Fazer filtros e indicadores utilizarem os registros do período selecionado.                                                                        | Uma massa conhecida de registros produz listagem e contagens conferíveis; período e regra do percentual ficam explícitos.                                                                                          |
| RF-11, RF-12               | Implementar convite com aceite, estados pendente/aceito/cancelado, revogação e permissões por paciente.                                            | Sem aceite não há acesso; após revogação, o acompanhante não consulta nem altera os dados daquele vínculo. As ações devem respeitar cada permissão.                                                                |
| RF-14                      | Persistir e aplicar as preferências de acessibilidade na interface.                                                                                | Alterar uma preferência modifica as telas correspondentes e a escolha permanece após reabrir a aplicação, conforme a política de conta definida.                                                                   |

“Gerenciar rotina” e “editar prescrições” não são equivalentes. O protótipo oferece a primeira permissão no convite e declara que Carlos não pode executar a segunda. A documentação não introduz um fluxo de prescrição.

## Requisitos não funcionais propostos

Estes RNF são critérios iniciais para discussão e verificação futura. Não há declaração de conformidade ou de atendimento atual.

| ID     | Proposta                                                                                          | Verificação sugerida                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RNF-01 | Preservar os dados que a aplicação informar como salvos.                                          | Cadastrar uma rotina, recarregar e consultar novamente; a rotina salva deve permanecer disponível.                                                                 |
| RNF-02 | Manter consistência entre as telas que representam a mesma dose.                                  | Confirmar e corrigir uma dose de teste; conferir estado e contagens no início, histórico, indicadores e visão autorizada do cuidador.                              |
| RNF-03 | Impedir acesso a dados de outro paciente sem vínculo e permissão válidos.                         | Tentar leitura e alteração com uma segunda conta sem acesso; ambas devem ser negadas, inclusive fora da navegação normal da interface.                             |
| RNF-04 | Permitir executar os fluxos centrais por teclado e apresentar nomes compreensíveis aos controles. | Percorrer cadastro de rotina e confirmação de dose por teclado; verificar foco visível, ordem de navegação e anúncio dos controles e mensagens por leitor de tela. |
| RNF-05 | Preservar leitura e operação com ampliação do texto.                                              | Ampliar o texto a 200% e verificar acesso aos campos, botões e conteúdo dos fluxos centrais, sem sobreposição que impeça uso.                                      |
| RNF-06 | Distinguir gravação concluída de tentativa que falhou.                                            | Simular falha ao salvar; a interface deve informar a falha, não anunciar sucesso e oferecer uma tentativa segura, sem duplicar o registro.                         |

## Decisões pendentes

- Uma conta poderá acompanhar a própria rotina e também outras pessoas?
- Todo paciente terá conta própria ou poderá existir uma pessoa acompanhada sem acesso ao aplicativo?
- Um cuidador poderá registrar uma tomada em nome do paciente? Se sim, qual permissão autoriza isso e como identificar o autor?
- Quais regras determinam atraso, não registro, lembrete repetido e resolução de alerta?
- Como calcular o percentual de doses registradas e tratar doses ignoradas ou rotinas alteradas?
- Qual será o efeito de encerrar uma conta sobre vínculos, dados compartilhados e histórico?

As respostas orientam o escopo futuro. A documentação não escolhe banco de dados, provedor de autenticação, serviço de notificações ou framework de backend.
