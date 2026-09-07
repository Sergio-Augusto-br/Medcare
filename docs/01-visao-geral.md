# Visão geral e objetivos

[Voltar ao índice](README.md)

**Data de referência:** 05/09/2026.  
**Natureza:** descrição do produto baseada no protótipo e objetivos formulados para orientar seu desenvolvimento.

## Contexto

O Medcare é um projeto de aplicação voltada à organização e ao acompanhamento da rotina de medicamentos. A descrição do projeto aponta pacientes idosos, cuidadores e famílias como público-alvo. O protótipo apresenta uma interface em português, com foco no uso em telas de celular.

O cenário demonstrado envolve Maria Oliveira, que acompanha seus medicamentos, e Carlos Oliveira, seu filho, que consulta as pendências da rotina dela. Os nomes e os registros são exemplos da interface.

## Problema que o projeto procura atender

A proposta responde às dificuldades de organizar vários medicamentos e horários, lembrar das doses, revisar o que foi registrado e compartilhar esse acompanhamento com pessoas de confiança.

O projeto procura tornar claras quatro informações: qual medicamento está programado, em que horário, qual o estado do registro daquela dose e quem pode acompanhar a rotina.

Essa descrição é uma interpretação dos fluxos existentes. Ainda não representa uma conclusão de pesquisa com usuários ou uma comprovação de benefício clínico.

## Proposta de valor

**Rotina clara, cuidado compartilhado.**

Reunir medicamentos, horários, lembretes, registros e acompanhamento autorizado em uma experiência simples e legível. O paciente consulta a própria rotina; familiares ou cuidadores acessam as informações que lhes forem disponibilizadas.

## Objetivo geral

Desenvolver uma aplicação acessível para organizar rotinas de medicamentos conforme as informações da prescrição fornecidas pelo usuário, registrar doses e permitir o acompanhamento autorizado por familiares e cuidadores, favorecendo a autonomia do paciente e a clareza das informações compartilhadas.

## Objetivos específicos

| ID    | Objetivo                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------- |
| OE-01 | Permitir cadastro, acesso, recuperação e gerenciamento da conta.                                         |
| OE-02 | Organizar medicamentos, apresentações, quantidades por tomada e horários informados pelo usuário.        |
| OE-03 | Apresentar a agenda de doses e destacar ocorrências que ainda precisam de registro.                      |
| OE-04 | Disponibilizar lembretes configuráveis e mostrar o estado de ativação das notificações.                  |
| OE-05 | Registrar cada dose individualmente, com horários, autoria e possibilidade de correção.                  |
| OE-06 | Oferecer histórico e indicadores calculados a partir dos registros do período consultado.                |
| OE-07 | Permitir compartilhar o acompanhamento por meio de vínculos e permissões explícitas.                     |
| OE-08 | Aplicar preferências de acessibilidade e apresentar mensagens compreensíveis nos fluxos principais.      |
| OE-09 | Manter os dados consistentes entre as telas e indicar quando uma atualização ainda não foi sincronizada. |

Esses objetivos descrevem o resultado desejado. Seu atendimento atual está detalhado no [inventário da implementação](06-estado-atual.md).

## Escopo funcional

O escopo representado pelo protótipo reúne entrada e cadastro, medicamentos, rotina, agenda, registro de doses, histórico, indicadores, acompanhamento por terceiros, alertas e preferências de uso.

As extensões sugeridas na conversa incluem uma conta com rotina própria e acompanhamento de outras pessoas, gerenciamento de sessões, exportação de dados, encerramento da conta, convites com aceite e rastreabilidade das alterações. Elas estão documentadas como propostas nos [modelos e regras](04-contas-e-regras-de-negocio.md).

Não há escopo definido para diagnóstico, emissão de prescrições, cálculo de doses pelo sistema, consultas, telemedicina, prontuário clínico ou venda de medicamentos. A opção “Profissional autorizado” no convite não estabelece um módulo clínico.

## Resultado esperado e avaliação

O fluxo central desejado é: cadastrar conta → configurar medicamento e rotina → consultar agenda → registrar uma dose → consultar o mesmo registro no histórico e, quando autorizado, no acompanhamento compartilhado.

A primeira entrega funcional deve demonstrar esse percurso com dados persistidos, sem substituir automaticamente os dados por exemplos do protótipo. As condições de avaliação por etapa estão no [planejamento](07-planejamento-e-decisoes.md).

Os indicadores devem descrever registros realizados no aplicativo. “Sem registro” não comprova ausência de tomada, e os percentuais não comprovam ingestão ou resultado clínico.

## Fontes

- [Descrição original e público-alvo](../.figma/make/site.json).
- [Apresentação inicial e percursos no código](../src/App.tsx): componentes `Onboarding`, `Signup`, `Home`, `Caregiver` e `App`.
