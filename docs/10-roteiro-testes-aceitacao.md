# Roteiro de testes de aceitação do MedCare

**Atualizado em:** 06/09/2026.  
**Ambiente publicado:** <https://resilient-valkyrie-cafe0b.netlify.app>

Este roteiro permite conferir manualmente o MedCare no celular e no navegador. Ele cobre os
fluxos implementados, a instalação como PWA, o isolamento entre contas e os comportamentos que
ainda dependem do navegador ou de serviços externos.

## Como registrar o resultado

Use um dos estados abaixo em cada caso:

- `PASSOU`: o resultado observado corresponde ao esperado;
- `FALHOU`: o fluxo terminou, mas o comportamento ou os dados ficaram incorretos;
- `BLOQUEADO`: não foi possível concluir por indisponibilidade, permissão ou dependência externa;
- `NÃO TESTADO`: o caso ainda não foi executado.

As prioridades significam:

- `P0`: bloqueia o uso principal do aplicativo;
- `P1`: função importante que deve operar antes da entrega;
- `P2`: acabamento, compatibilidade ou situação menos frequente.

## Preparação

1. Abra o endereço publicado no Chrome ou Firefox do computador e no Chrome do Android ou
   Safari do iPhone.
2. Crie duas contas com e-mails que você consegue confirmar:
   - **Conta A — Paciente Teste**;
   - **Conta B — Cuidador Teste**.
3. Não coloque nomes de pacientes reais, medicamentos reais, documentos, senhas pessoais ou
   informações clínicas verdadeiras no ambiente de teste.
4. Use `Medicamento Teste` como nome e uma senha exclusiva criada para esse teste.
5. Para testar lembretes, escolha um horário próximo do momento do teste e marque o dia atual.
6. Guarde a Conta A para a regressão. Crie uma terceira conta descartável apenas para o teste de
   exclusão permanente.

## Teste rápido antes de enviar um report

Este percurso leva cerca de 20 a 30 minutos e verifica o caminho principal:

| ID  | Ação                                                                                                                                     | Resultado esperado                                                                           | Estado      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| R01 | Abra a página inicial no celular e toque em **Começar**.                                                                                 | A página abre sem tela branca, o conteúdo cabe na largura e o botão leva ao acesso da conta. | NÃO TESTADO |
| R02 | Entre com a Conta A.                                                                                                                     | A sessão é iniciada e a tela **Hoje** aparece.                                               | NÃO TESTADO |
| R03 | Em **Medicamentos**, adicione `Medicamento Teste`, concentração `10 mg`, quantidade `1 comprimido`, dia atual e dois horários distintos. | A confirmação aparece e o medicamento fica visível com os dois horários.                     | NÃO TESTADO |
| R04 | Abra **Hoje** e depois **Agenda**.                                                                                                       | As doses previstas aparecem na data e nos horários cadastrados, sem duplicação.              | NÃO TESTADO |
| R05 | Abra uma dose, marque **Tomei**, informe o horário e salve.                                                                              | A dose muda para tomada e aparece no histórico com data, hora e autor.                       | NÃO TESTADO |
| R06 | Abra a mesma dose, escolha **Não tomei**, escreva um motivo e salve.                                                                     | A correção é exibida e o histórico de alterações preserva os dois eventos.                   | NÃO TESTADO |
| R07 | Abra **Histórico** e **Indicadores**.                                                                                                    | O registro aparece no histórico e as contagens refletem o estado atual da dose.              | NÃO TESTADO |
| R08 | Atualize a página diretamente em uma rota interna, como `/app/medicamentos`.                                                             | O aplicativo recarrega normalmente e mantém a sessão.                                        | NÃO TESTADO |
| R09 | Instale o MedCare pelo menu do navegador e abra o ícone criado.                                                                          | O app abre em janela própria, com nome e ícone do MedCare.                                   | NÃO TESTADO |
| R10 | Saia da conta e tente abrir `/app`.                                                                                                      | O app solicita autenticação e não exibe os dados anteriores.                                 | NÃO TESTADO |

Se qualquer caso `R01` a `R10` falhar, registre o report antes de continuar a regressão completa.

## 1. Página pública, navegação e responsividade

| ID     | Pri. | Procedimento                                              | Resultado esperado                                                                | Estado      |
| ------ | ---- | --------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------- |
| NAV-01 | P0   | Abra a raiz do site com conexão normal.                   | A apresentação do MedCare carrega sem erro ou tela vazia.                         | NÃO TESTADO |
| NAV-02 | P1   | Teste os botões e links da página inicial.                | Cada controle leva à tela indicada e o botão voltar do navegador funciona.        | NÃO TESTADO |
| NAV-03 | P0   | Abra `/login`, atualize a página e repita em `/cadastro`. | As duas rotas continuam abertas depois da atualização; não ocorre erro 404.       | NÃO TESTADO |
| NAV-04 | P1   | No celular, percorra todas as telas em modo retrato.      | Não existe rolagem horizontal, texto cortado, botão fora da tela ou sobreposição. | NÃO TESTADO |
| NAV-05 | P2   | Gire o celular para paisagem e volte ao retrato.          | O layout se reorganiza sem perder campos preenchidos ou a tela atual.             | NÃO TESTADO |

## 2. Cadastro, autenticação e recuperação

| ID     | Pri. | Procedimento                                                                                                                                                  | Resultado esperado                                                                                       | Estado      |
| ------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------- |
| AUT-01 | P1   | No cadastro, tente enviar nome curto, e-mail inválido, senha com menos de 10 caracteres, sem maiúscula, sem minúscula ou sem número, e confirmação diferente. | Cada erro é explicado junto ao campo e a conta não é criada.                                             | NÃO TESTADO |
| AUT-02 | P0   | Cadastre a Conta A com dados válidos.                                                                                                                         | O app informa que o cadastro foi realizado e solicita a confirmação do e-mail quando aplicável.          | NÃO TESTADO |
| AUT-03 | P0   | Abra o e-mail de confirmação e use o link recebido.                                                                                                           | O link retorna ao MedCare, confirma a conta e permite o acesso.                                          | NÃO TESTADO |
| AUT-04 | P0   | Tente entrar com senha incorreta e depois com a senha correta.                                                                                                | A tentativa inválida não abre a conta; a válida abre a tela **Hoje**.                                    | NÃO TESTADO |
| AUT-05 | P1   | Saia, toque em **Esqueci minha senha**, informe o e-mail da Conta A e abra o link recebido.                                                                   | O app permite definir uma senha válida e confirma a alteração.                                           | NÃO TESTADO |
| AUT-06 | P1   | Após recuperar a senha, teste a antiga e a nova.                                                                                                              | A senha antiga é recusada e a nova inicia a sessão.                                                      | NÃO TESTADO |
| AUT-07 | P0   | Com a sessão encerrada, cole uma URL protegida, como `/app/historico`.                                                                                        | O usuário é enviado para o login e nenhum dado da conta aparece.                                         | NÃO TESTADO |
| AUT-08 | P1   | Entre, feche completamente o navegador, abra novamente e retorne ao app.                                                                                      | A sessão válida é restaurada de forma segura ou o login é solicitado; nunca aparece dado de outra conta. | NÃO TESTADO |

## 3. Perfil, acessibilidade e segurança da conta

| ID     | Pri. | Procedimento                                                                                                            | Resultado esperado                                                                                  | Estado      |
| ------ | ---- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------- |
| CTA-01 | P1   | Em **Perfil**, altere nome, fuso horário e salve. Atualize a página.                                                    | A confirmação aparece e os novos dados permanecem após recarregar.                                  | NÃO TESTADO |
| CTA-02 | P1   | Selecione texto **Muito grande**, ative contraste, redução de animações e rótulos de estado.                            | A interface aplica as preferências sem esconder informações ou controles.                           | NÃO TESTADO |
| CTA-03 | P1   | Feche a sessão, entre novamente e confira as preferências.                                                              | As escolhas de acessibilidade continuam ativas.                                                     | NÃO TESTADO |
| CTA-04 | P1   | Informe atraso menor que `0` e maior que `1440`; depois salve um valor válido.                                          | Valores inválidos são recusados; o valor válido é salvo.                                            | NÃO TESTADO |
| CTA-05 | P1   | Tente mudar a senha usando senha atual incorreta, nova senha fraca e confirmação diferente. Depois use valores válidos. | Cada erro impede a alteração; a combinação válida atualiza a senha.                                 | NÃO TESTADO |
| CTA-06 | P1   | Solicite a troca de e-mail para outro endereço acessível e conclua as confirmações recebidas.                           | O app informa o envio das confirmações e, ao concluir o processo, usa o novo e-mail.                | NÃO TESTADO |
| CTA-07 | P1   | Toque em **Exportar meus dados** após criar medicamento e registro de dose.                                             | Um JSON é baixado com perfil, rotina própria, registros, vínculos e notificações da conta.          | NÃO TESTADO |
| CTA-08 | P1   | Entre na mesma conta em dois navegadores. No primeiro, use **Encerrar outras sessões**; atualize o segundo.             | A sessão usada para executar a ação continua ativa e a outra deixa de acessar a conta.              | NÃO TESTADO |
| CTA-09 | P1   | Na conta descartável, tente excluir com senha errada e texto diferente de `EXCLUIR`; depois use os valores corretos.    | Os valores incorretos não excluem a conta; os corretos removem a conta e retornam à página pública. | NÃO TESTADO |
| CTA-10 | P0   | Tente entrar novamente com a conta descartável excluída.                                                                | O acesso é recusado e os dados próprios da conta não reaparecem.                                    | NÃO TESTADO |

## 4. Medicamentos e programação

| ID     | Pri. | Procedimento                                                                      | Resultado esperado                                                                                             | Estado      |
| ------ | ---- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| MED-01 | P1   | Tente salvar sem nome, concentração ou quantidade e sem selecionar dia.           | O formulário destaca os campos inválidos e não cria o medicamento.                                             | NÃO TESTADO |
| MED-02 | P1   | Adicione e remova horários, deixando dois horários distintos no dia atual. Salve. | A rotina é criada uma única vez com os horários escolhidos.                                                    | NÃO TESTADO |
| MED-03 | P1   | Tente repetir o mesmo horário e informe data final anterior à inicial.            | O formulário recusa a programação inválida e explica o problema.                                               | NÃO TESTADO |
| MED-04 | P0   | Cadastre um medicamento com instrução, dias alternados e vigência definida.       | A lista apresenta os dados e a agenda gera doses apenas nos dias válidos.                                      | NÃO TESTADO |
| MED-05 | P1   | Edite nome, instrução e horários de uma rotina que já possui uma dose registrada. | A mudança vale a partir de hoje e a dose anterior mantém o retrato dos dados usados quando foi registrada.     | NÃO TESTADO |
| MED-06 | P1   | Abra a mesma edição em duas abas, salve mudanças diferentes nas duas.             | A segunda gravação conflitante é recusada ou solicita atualização; não sobrescreve silenciosamente a primeira. | NÃO TESTADO |
| MED-07 | P0   | Arquive uma rotina que tenha dose passada registrada e dose futura pendente.      | O medicamento sai da rotina ativa, o futuro pendente é removido e o passado permanece no histórico.            | NÃO TESTADO |

## 5. Doses, agenda, histórico e autoria

| ID     | Pri. | Procedimento                                                                        | Resultado esperado                                                                                      | Estado      |
| ------ | ---- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| DOS-01 | P0   | Abra **Hoje** com uma programação válida para o dia atual.                          | Cada horário aparece uma única vez com nome, dose, horário e estado.                                    | NÃO TESTADO |
| DOS-02 | P0   | Registre uma dose como **Tomei** com um horário válido.                             | O estado muda para tomada e o evento registra autor e data da alteração.                                | NÃO TESTADO |
| DOS-03 | P0   | Registre outra dose como **Não tomei** com um motivo.                               | O estado e o motivo aparecem nos detalhes e no histórico de alterações.                                 | NÃO TESTADO |
| DOS-04 | P1   | Corrija uma dose tomada para não tomada e depois escolha **Remover registro**.      | Cada correção entra na auditoria; ao remover, a dose volta a pendente sem apagar os eventos anteriores. | NÃO TESTADO |
| DOS-05 | P1   | Ao salvar uma dose, toque repetidamente no botão ou simule conexão lenta.           | Apenas um registro lógico é criado e o botão indica que está salvando.                                  | NÃO TESTADO |
| DOS-06 | P1   | Consulte **Agenda** em datas com e sem programação.                                 | As doses aparecem somente nas datas esperadas e o estado vazio é claro.                                 | NÃO TESTADO |
| DOS-07 | P1   | Consulte **Histórico** depois de registrar e corrigir doses.                        | A lista apresenta os resultados atuais sem perder a rastreabilidade disponível nos detalhes.            | NÃO TESTADO |
| DOS-08 | P1   | Confira uma dose perto da meia-noite e compare o fuso mostrado com o perfil/rotina. | Data e horário pertencem ao dia correto no fuso exibido.                                                | NÃO TESTADO |

## 6. Indicadores de adesão

| ID     | Pri. | Procedimento                                                                                     | Resultado esperado                                                                                 | Estado      |
| ------ | ---- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------- |
| IND-01 | P1   | Registre um pequeno conjunto conhecido, por exemplo duas tomadas, uma não tomada e uma pendente. | Os totais exibem `2`, `1` e `1`, e o percentual considera os estados conforme a regra apresentada. | NÃO TESTADO |
| IND-02 | P1   | Alterne os períodos de 7, 30 e 90 dias.                                                          | Os totais e agrupamentos são recalculados para o período selecionado.                              | NÃO TESTADO |
| IND-03 | P1   | Corrija o estado de uma dose e volte aos indicadores.                                            | A contagem é atualizada sem duplicar o registro corrigido.                                         | NÃO TESTADO |
| IND-04 | P2   | Confira os agrupamentos por dia e semana em relação às datas do histórico.                       | Datas, semanas, totais e percentuais são coerentes entre si.                                       | NÃO TESTADO |

## 7. Cuidado compartilhado e permissões

Execute estes casos com a Conta A como paciente e a Conta B como cuidador. Use uma janela normal
para uma conta e uma janela anônima ou outro navegador para a outra.

| ID     | Pri. | Procedimento                                                                                                   | Resultado esperado                                                                                   | Estado      |
| ------ | ---- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------- |
| CUI-01 | P0   | Na Conta A, convide o e-mail da Conta B com todas as permissões.                                               | O convite fica pendente para A e aparece em **Convites** para B.                                     | NÃO TESTADO |
| CUI-02 | P1   | Na Conta B, rejeite o primeiro convite.                                                                        | O vínculo não é criado e B não consegue selecionar nem consultar a rotina de A.                      | NÃO TESTADO |
| CUI-03 | P0   | Envie novo convite e aceite com a Conta B.                                                                     | B passa a poder selecionar a pessoa acompanhada; A vê o vínculo ativo.                               | NÃO TESTADO |
| CUI-04 | P0   | Em B, selecione a rotina de A e consulte Hoje, Agenda, Medicamentos, Histórico e Indicadores.                  | Com todas as permissões, B vê somente os dados de A autorizados pelo vínculo.                        | NÃO TESTADO |
| CUI-05 | P1   | Na Conta A, deixe para B apenas **Ver medicamentos**. Atualize a sessão de B.                                  | B consulta medicamentos/agenda permitidos e recebe mensagens de falta de permissão nas demais áreas. | NÃO TESTADO |
| CUI-06 | P0   | Conceda **Registrar doses** e retire **Gerenciar rotina**. Em B, registre uma dose e tente editar medicamento. | B registra a dose com sua autoria, mas não altera medicamento nem horário.                           | NÃO TESTADO |
| CUI-07 | P1   | Conceda **Gerenciar rotina** e teste uma edição feita por B.                                                   | A alteração autorizada é salva na rotina de A e mantém registros anteriores.                         | NÃO TESTADO |
| CUI-08 | P1   | Teste isoladamente **Ver histórico**, **Ver indicadores** e **Receber alertas**.                               | Cada área só fica disponível quando sua permissão correspondente está ativa.                         | NÃO TESTADO |
| CUI-09 | P0   | A revoga o vínculo ativo e B atualiza o aplicativo.                                                            | A rotina de A desaparece de B e URLs antigas deixam de entregar os dados.                            | NÃO TESTADO |
| CUI-10 | P1   | A cria outro convite pendente e o cancela antes da aceitação.                                                  | O convite deixa de poder ser aceito por B e não cria vínculo.                                        | NÃO TESTADO |
| CUI-11 | P0   | Sem vínculo, tente usar B para acessar diretamente uma URL/identificador pertencente a A.                      | O acesso é recusado e nenhum dado clínico de A é revelado.                                           | NÃO TESTADO |

## 8. Notificações no navegador

As notificações atuais são produzidas enquanto o app está aberto e consegue atualizar os dados.
O recebimento em segundo plano com o aplicativo totalmente fechado ainda depende da futura
integração com um serviço de push.

| ID     | Pri. | Procedimento                                                                                                                     | Resultado esperado                                                                                                                   | Estado      |
| ------ | ---- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| NOT-01 | P1   | Em **Notificações**, toque em **Ativar no navegador** e permita o acesso.                                                        | O navegador exibe o aviso de ativação do MedCare.                                                                                    | NÃO TESTADO |
| NOT-02 | P1   | Recuse a permissão de notificações e continue usando o app.                                                                      | O restante do aplicativo continua funcionando, sem repetição invasiva do pedido.                                                     | NÃO TESTADO |
| NOT-03 | P1   | Ative lembretes no perfil, crie dose próxima do horário atual e mantenha o app aberto. Atualize **Notificações** após o horário. | Um lembrete aparece no centro de notificações e, se autorizado, como aviso do navegador.                                             | NÃO TESTADO |
| NOT-04 | P1   | No lembrete, selecione **Lembrar em 10 min**.                                                                                    | O lembrete é adiado e volta a ficar disponível no momento previsto.                                                                  | NÃO TESTADO |
| NOT-05 | P1   | Marque uma notificação como lida.                                                                                                | O estado muda e não é gerado um segundo aviso do navegador para o mesmo item.                                                        | NÃO TESTADO |
| NOT-06 | P1   | Abra a dose pelo aviso e registre um resultado.                                                                                  | O link abre a dose correta e o aviso correspondente fica resolvido.                                                                  | NÃO TESTADO |
| NOT-07 | P1   | Com a permissão **Receber alertas**, deixe uma dose da Conta A sem registro pelo atraso configurado.                             | A Conta B recebe o alerta autorizado quando o app atualiza as notificações.                                                          | NÃO TESTADO |
| NOT-08 | P2   | Teste com o app totalmente fechado.                                                                                              | Registre como `BLOQUEADO — push em segundo plano pendente` caso nenhum aviso chegue; esse comportamento ainda não está implementado. | NÃO TESTADO |

## 9. Instalação PWA, atualização e funcionamento sem rede

| ID     | Pri. | Procedimento                                                                                | Resultado esperado                                                                                | Estado      |
| ------ | ---- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------- |
| PWA-01 | P0   | Android/Chrome: abra o site, use **Instalar app** ou **Adicionar à tela inicial**.          | O sistema oferece a instalação e cria um ícone do MedCare.                                        | NÃO TESTADO |
| PWA-02 | P0   | iPhone/Safari: use **Compartilhar > Adicionar à Tela de Início**.                           | O ícone é criado e abre o MedCare.                                                                | NÃO TESTADO |
| PWA-03 | P1   | Abra o app pelo ícone instalado.                                                            | O app abre em modo próprio, com ícone, nome e cores corretas.                                     | NÃO TESTADO |
| PWA-04 | P1   | Com uma tela já carregada, ative o modo avião e navegue pelo que estiver disponível.        | O shell do app abre, um aviso de falta de conexão aparece e nenhuma gravação exibe sucesso falso. | NÃO TESTADO |
| PWA-05 | P1   | Ainda sem rede, tente salvar uma alteração; depois restabeleça a conexão e tente novamente. | A falha é explicada; após reconectar, a operação pode ser concluída normalmente.                  | NÃO TESTADO |
| PWA-06 | P1   | Após uma nova publicação, feche e reabra o aplicativo ou atualize a página.                 | A versão nova é carregada sem misturar arquivos antigos nem apagar dados do Supabase.             | NÃO TESTADO |

## 10. Acessibilidade básica

| ID     | Pri. | Procedimento                                                                                                             | Resultado esperado                                                                     | Estado      |
| ------ | ---- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------- |
| ACE-01 | P1   | No computador, navegue por login, formulário de medicamento e dose usando apenas `Tab`, `Shift+Tab`, `Enter` e `Espaço`. | O foco é visível, segue ordem lógica e todos os controles essenciais podem ser usados. | NÃO TESTADO |
| ACE-02 | P1   | Aumente o zoom do navegador para 200%.                                                                                   | O conteúdo continua legível e operável sem sobreposição importante.                    | NÃO TESTADO |
| ACE-03 | P1   | Use leitor de tela para percorrer títulos, campos, erros e estados de dose.                                              | Os elementos possuem nome compreensível e erros não dependem somente de cor.           | NÃO TESTADO |
| ACE-04 | P2   | Ative a preferência do sistema para reduzir movimento e também a opção do perfil.                                        | Animações e transições deixam de causar movimento desnecessário.                       | NÃO TESTADO |

## Modelo de report de erro

Copie este bloco para cada falha:

```text
Título: [ID do teste] resumo curto do problema
Ambiente: celular/computador, marca e modelo
Sistema: Android/iOS/Linux/Windows e versão
Navegador: Chrome/Safari/Firefox e versão
URL ou tela: endereço/tela onde ocorreu
Conta usada: A, B ou descartável (não informar e-mail ou senha)
Conexão: Wi-Fi, dados móveis ou offline

Passos:
1.
2.
3.

Resultado esperado:

Resultado observado:

Frequência: sempre / às vezes / ocorreu uma vez
Horário aproximado: data e hora com fuso
Evidência: captura de tela ou vídeo sem dados pessoais
```

Não inclua senha, link de confirmação, token, chave do Supabase, conteúdo clínico real ou e-mail
completo no report. Se a identidade da conta for relevante, informe apenas `Conta A`, `Conta B`
ou os dois primeiros caracteres do e-mail ocultando o restante.

## Critério sugerido para aprovar a versão

A versão pode seguir para uma análise mais ampla quando:

1. todos os casos `P0` tiverem passado;
2. nenhum caso `P1` falhar com perda, vazamento ou alteração incorreta de dados;
3. falhas `P1` e `P2` restantes estiverem registradas com prioridade e forma de reprodução;
4. o teste rápido tiver passado em pelo menos um celular e um navegador de computador;
5. a limitação de push em segundo plano estiver explicitamente aceita até a integração do serviço.
