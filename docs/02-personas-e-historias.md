# Personas e histórias de usuário

[Voltar ao índice](README.md) · Atualizado em 05/09/2026

Este documento deriva as personas e histórias das telas de [src/App.tsx](../src/App.tsx), da [descrição do projeto](../.figma/make/site.json) e da discussão inicial sobre o Medcare. Não há pesquisa de campo de personas registrada nas fontes analisadas. Maria e Carlos são personagens demonstrativos da interface.

## Personas

| Persona                                               | Contexto e necessidades                                                                                                                                                 | Representação atual                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Paciente — Maria Oliveira**                         | Organizar medicamentos e horários, identificar pendências e registrar doses com autonomia. O público declarado inclui pessoas idosas; a idade de Maria não é informada. | Percurso principal: cadastro, rotina, acompanhamento diário, histórico e compartilhamento. |
| **Familiar ou cuidador — Carlos Oliveira**            | Acompanhar uma pessoa e perceber quando pode oferecer apoio, conforme o acesso concedido. Carlos aparece como filho de Maria.                                           | Painel de acompanhamento de Maria e exemplos de alertas.                                   |
| **Profissional autorizado — participante secundário** | Consultar informações compartilhadas conforme autorização e permissões a definir. Não se presume atribuição clínica dentro do aplicativo.                               | Opção de relação no formulário de convite; não possui percurso próprio.                    |

Acessibilidade é uma necessidade transversal: o projeto prevê leitura ampliada, contraste e redução de movimentos. Isso não define uma condição de saúde ou deficiência específica para os personagens.

## Como interpretar as histórias

As histórias descrevem a intenção do produto. O campo **Estado atual** registra apenas o comportamento observado no código em 05/09/2026. As interações locais usam dados de exemplo e não persistem entre recargas.

Todos os **critérios de aceite abaixo são propostos para o desenvolvimento futuro**: não são testes executados nem evidência de funcionalidade pronta. A aprovação e priorização dessas regras ainda precisam ser consolidadas.

### HU-01 — Criar conta e acessar a rotina

Como usuário, quero criar uma conta e indicar como usarei o Medcare, para acessar minha rotina ou o acompanhamento de outra pessoa.

- **Estado atual:** formulários demonstrativos; a escolha de paciente/cuidador muda o destino da navegação. Entrar não valida credenciais nem cria sessão.
- **Aceite proposto:** validar e armazenar os dados de cadastro; autenticar o usuário e disponibilizar somente os dados aos quais ele tem acesso.

### HU-02 — Cadastrar e consultar medicamentos

Como paciente, quero cadastrar e localizar meus medicamentos, para manter minha lista organizada.

- **Estado atual:** entregue na Etapa 1B com cadastro persistente, lista, busca, edição e arquivamento.
- **Aceite proposto:** um cadastro válido deve aparecer na lista após recarregar a página; a busca deve filtrar os medicamentos cadastrados pelo usuário.

### HU-03 — Definir horários da rotina

Como paciente, quero cadastrar os horários da minha prescrição, para organizar quando cada medicamento está programado.

- **Estado atual:** entregue na Etapa 1B com vários horários, dias da semana, vigência, fuso e versões de programação. Doses futuras são geradas sem duplicação.
- **Aceite proposto:** permitir escolher e salvar os horários; alterações devem atualizar a programação futura sem modificar registros anteriores.

### HU-04 — Consultar o dia e a agenda

Como paciente, quero ver as doses previstas por dia e seus estados, para identificar o que está programado e o que já registrei.

- **Estado atual:** entregue na Etapa 1C com painel do dia, resumo e agenda por data a partir das ocorrências persistidas.
- **Aceite proposto:** exibir as ocorrências reais da data escolhida; refletir os registros individuais de cada ocorrência na agenda e no resumo diário.

### HU-05 — Receber e adiar lembretes

Como paciente, quero receber avisos nos horários programados e solicitar um novo lembrete, para acompanhar minha rotina.

- **Estado atual:** entregue na Etapa 3 com central persistida, lembrete por dose, permissão do navegador, resolução e adiamento. O push com o aplicativo fechado depende da configuração OneSignal em produção.
- **Aceite proposto:** enviar lembretes conforme programação e preferências habilitadas; adiar um aviso sem alterar o horário cadastrado da dose e cancelar avisos pendentes após seu registro.

### HU-06 — Confirmar uma dose

Como paciente, quero confirmar que tomei uma dose, para manter o acompanhamento atualizado.

- **Estado atual:** entregue na Etapa 1C com horário efetivo, atualização das visões e proteção contra requisições duplicadas.
- **Aceite proposto:** registrar somente a ocorrência selecionada, com horário informado e responsável pelo registro; impedir duplicidade e atualizar os resumos a partir dos registros reais.

### HU-07 — Informar que uma dose não foi tomada

Como paciente, quero informar quando não tomei uma dose e, opcionalmente, o motivo, para contextualizar meu histórico.

- **Estado atual:** entregue na Etapa 1C com estado “não tomada” e motivo opcional persistido.
- **Aceite proposto:** salvar a informação e o motivo opcional na ocorrência correta; distinguir “não tomada” de “sem registro”, sem inferir a tomada pela ausência de confirmação.

### HU-08 — Consultar o histórico

Como paciente, quero consultar meus registros por período, para revisar o acompanhamento da minha rotina.

- **Estado atual:** entregue na Etapa 1C com períodos de 7, 30 ou 90 dias, estados e resumo calculados.
- **Aceite proposto:** listar os registros persistidos dentro do período escolhido; apresentar claramente o estado de cada ocorrência e a ausência de resultados.

### HU-09 — Corrigir um registro

Como paciente, quero corrigir uma confirmação feita por engano, para manter meu histórico correto.

- **Estado atual:** entregue na Etapa 1C; cada correção mantém autoria, estado anterior e novo estado na trilha de eventos.
- **Aceite proposto:** permitir corrigir a ocorrência selecionada; preservar informação sobre a alteração e recalcular os resumos afetados.

### HU-10 — Consultar indicadores

Como paciente ou acompanhante autorizado, quero ver quantidades e proporções de doses registradas, para identificar períodos com mais pendências.

- **Estado atual:** entregue na Etapa 3 com percentual, contagens, agrupamento por período do dia e evolução semanal para 7, 30 ou 90 dias.
- **Aceite proposto:** calcular os indicadores a partir das ocorrências do período selecionado; explicar o numerador, o denominador e o tratamento de períodos sem doses previstas.

### HU-11 — Compartilhar com pessoas autorizadas

Como paciente, quero convidar uma pessoa de confiança e escolher suas permissões, para controlar o acesso à minha rotina.

- **Estado atual:** entregue na Etapa 2 com convite por e-mail de conta, prazo, aceite, recusa, cancelamento, permissões editáveis e revogação.
- **Aceite proposto:** conceder acesso somente após aceite de um convite válido; permitir revisar e revogar o vínculo, com permissões verificadas no servidor.

### HU-12 — Acompanhar a rotina de outra pessoa

Como familiar ou cuidador autorizado, quero consultar a rotina da pessoa acompanhada, para identificar pendências e oferecer apoio.

- **Estado atual:** entregue na Etapa 2; a conta alterna entre pessoas autorizadas e as telas consultam os dados reais conforme as permissões.
- **Aceite proposto:** identificar claramente a pessoa acompanhada e consultar seus dados reais; respeitar as permissões do vínculo e informar quando os dados foram atualizados.

### HU-13 — Receber alertas de acompanhamento

Como familiar ou cuidador autorizado, quero receber alertas de pendências e saber quando foram resolvidas, para acompanhar mudanças na rotina.

- **Estado atual:** entregue na Etapa 3; alertas respeitam vínculo, permissão, preferência e atraso, e são resolvidos quando a dose recebe um registro.
- **Aceite proposto:** gerar alertas conforme regras e preferências definidas para o vínculo; atualizar a situação do alerta quando a ocorrência correspondente for registrada.

### HU-14 — Ajustar a acessibilidade

Como usuário, quero ajustar texto, contraste e movimentos da interface, para utilizar o aplicativo com mais conforto.

- **Estado atual:** há tela e controles demonstrativos, mas eles não alteram a apresentação global nem salvam preferências.
- **Aceite proposto:** aplicar e persistir as preferências escolhidas; manter leitura e operação dos fluxos principais com texto ampliado, teclado e leitor de tela.

## Sugestões que podem ampliar estas histórias

Estas sugestões da discussão inicial ainda não constituem decisões de implementação:

- Permitir que uma conta cuide da própria rotina e acompanhe outras pessoas, incluindo múltiplos vínculos.
- Separar autorização para consultar dados, receber alertas, registrar doses e gerenciar medicamentos/horários; identificar quem registra em nome do paciente.
- Completar o gerenciamento de conta com recuperação de acesso, edição de dados, sessões conectadas, exportação e encerramento da conta.
- Definir sincronização sem conexão e o comportamento de conflitos, além dos dispositivos e canais que receberão notificações.

As regras específicas do profissional autorizado e dos indicadores permanecem a detalhar. Os registros expressam informações declaradas pelos usuários; não comprovam, por si só, a ingestão do medicamento.
