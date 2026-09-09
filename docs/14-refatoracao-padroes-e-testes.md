# Refatoração com padrões de projeto e testes

**Data da implementação:** 09/09/2026.
**Escopo:** fluxo diário de doses, notificações, permissões, datas e consistência do cache do MedCare.

## Objetivo

Esta etapa aplica padrões de projeto aos quatro problemas validados nos documentos da equipe e a três problemas adicionais encontrados na análise do código. O objetivo é separar apresentação, regras da aplicação e integrações externas sem alterar as regras de autorização mantidas pelo Supabase.

## Problemas, responsabilidades e padrões escolhidos

| Problema                            | Componentes e responsabilidades antes da refatoração                                                                             | Malefícios observados                                                                                        | Padrão aplicado          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Acesso direto ao Supabase           | `features/doses/api.ts` conhecia o SDK, RPCs, tabelas e formato dos dados retornados.                                            | Alto acoplamento à infraestrutura, coerções inseguras e testes dependentes do SDK.                           | **Repository + Adapter** |
| Notificações do navegador           | `NotificationsPage` renderizava a tela e também operava `Notification`, `localStorage`, foco da janela e navegação.              | Mistura entre interface e infraestrutura, repetição de política e baixa testabilidade.                       | **Adapter**              |
| Fronteira de dados                  | Componentes consumiam DTOs em `snake_case` e pressupunham que respostas externas correspondiam aos tipos TypeScript.             | Dados inválidos podiam atravessar a aplicação; modelos do banco vazavam para a interface.                    | **Data Mapper**          |
| Rotina diária                       | `TodayPage` e `AgendaPage` coordenavam janela de datas, atualização de ocorrências, geração de notificações e consulta de doses. | Duplicação de sequência, páginas com muitas responsabilidades e risco de comportamentos divergentes.         | **Facade**               |
| Invalidação do cache                | Cada mutação escolhia isoladamente quais chaves do React Query invalidar.                                                        | Detalhes, histórico, métricas e notificações podiam permanecer desatualizados; o cache sobrevivia ao logout. | **Mediator**             |
| Permissão pelo paciente selecionado | Telas de detalhe calculavam ações usando o paciente ativo no contexto, mesmo quando o recurso da URL pertencia a outro paciente. | A interface podia oferecer ou esconder ações incorretamente, embora o banco ainda aplicasse RLS.             | **Specification**        |
| Data pelo fuso do dispositivo       | O formulário calculava a data inicial no relógio local do cuidador e salvava o fuso do paciente separadamente.                   | A rotina podia começar no dia anterior ou seguinte para pacientes em outro fuso.                             | **Strategy**             |

`Repository`, `Data Mapper` e `Specification` são padrões de arquitetura de aplicações empresariais. `Adapter`, `Facade`, `Mediator` e `Strategy` são padrões comportamentais ou estruturais conhecidos do catálogo GoF. Essa distinção deve ser mantida na apresentação do trabalho.

## Refatorações realizadas

### 1. Repository e Adapter para doses

O contrato `DoseRepository` define as operações usadas pela aplicação. `SupabaseDoseAdapter` implementa esse contrato e recebe um `SupabaseClient`, isolando nomes de tabelas, RPCs, filtros e tratamento de erros do Supabase. As funções públicas antigas de `features/doses/api.ts` foram preservadas como uma camada de compatibilidade e agora delegam ao Adapter.

Arquivos principais:

- `src/features/doses/repository.ts`
- `src/features/doses/SupabaseDoseAdapter.ts`
- `src/features/doses/api.ts`

### 2. Data Mapper na fronteira externa

Os schemas Zod validam ocorrências e eventos recebidos em tempo de execução. O Mapper converte os DTOs em `snake_case` para modelos de domínio em `camelCase`. Uma resposta incompatível passa a gerar um erro controlado antes de alcançar os componentes.

Arquivos principais:

- `src/features/doses/data-mapper.ts`
- `src/features/doses/model.ts`
- `src/features/doses/DoseCard.tsx`
- `src/features/doses/DoseDetailsPage.tsx`
- `src/features/doses/utils.ts`

### 3. Facade para a rotina diária

`DailyRoutineFacade` fornece operações para carregar o dia atual e uma data da agenda. Ela coordena a atualização da janela de ocorrências, a atualização de notificações e a consulta das doses. `TodayPage` e `AgendaPage` passaram a solicitar esse caso de uso sem conhecer a sequência de serviços internos.

Arquivos principais:

- `src/features/doses/DailyRoutineFacade.ts`
- `src/features/doses/TodayPage.tsx`
- `src/features/doses/AgendaPage.tsx`

### 4. Adapter para notificações do navegador

`BrowserNotificationAdapter` concentra suporte, permissão, solicitação de acesso, exibição, deduplicação em armazenamento local, foco da janela e navegação ao clicar. Ao adiar um aviso, a página libera a marca de deduplicação para permitir uma nova apresentação do mesmo lembrete.

Arquivos principais:

- `src/features/notifications/BrowserNotificationAdapter.ts`
- `src/features/notifications/NotificationsPage.tsx`

### 5. Mediator para o cache

`QueryCacheMediator` representa os efeitos de cada alteração de negócio sobre o cache. O registro de dose invalida rotina, histórico, detalhe, eventos, métricas e notificações. Alterações de medicamento invalidam medicamento, ocorrências e indicadores relacionados. O encerramento da sessão cancela e remove as consultas armazenadas.

A chave da caixa de notificações também passou a incluir o usuário autenticado.

Arquivos principais:

- `src/app/QueryCacheMediator.ts`
- `src/auth/AuthProvider.tsx`
- `src/app/AppShell.tsx`
- `src/features/doses/DoseDetailsPage.tsx`
- `src/features/medications/MedicationFormPage.tsx`
- `src/features/medications/MedicationListPage.tsx`
- `src/features/notifications/NotificationsPage.tsx`

### 6. Specification para permissões

`PatientPermissionSpecification` avalia se o usuário pode executar uma ação sobre o paciente ao qual o recurso carregado realmente pertence. Detalhes de dose e edição de medicamento deixaram de depender apenas do paciente selecionado no contexto e sincronizam a seleção quando necessário.

A Specification melhora a coerência da interface. A autorização definitiva continua nas políticas RLS e RPCs do Supabase.

Arquivos principais:

- `src/features/care/PatientPermissionSpecification.ts`
- `src/features/doses/DoseDetailsPage.tsx`
- `src/features/medications/MedicationFormPage.tsx`

### 7. Strategy para datas da rotina

`PatientTimezoneDateStrategy` calcula datas civis no fuso IANA do paciente. O formulário usa a estratégia ao criar uma rotina e ao definir limites de datas, evitando derivar o dia da rotina do dispositivo do cuidador.

Arquivos principais:

- `src/features/medications/RoutineDateStrategy.ts`
- `src/features/medications/MedicationFormPage.tsx`

## Testes realizados

| Unidade testada                          | Comportamentos verificados                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `data-mapper.test.ts`                    | Conversão para o domínio, campos opcionais e rejeição de DTO inválido.              |
| `SupabaseDoseAdapter.test.ts`            | Parâmetros enviados ao Supabase e mapeamento do retorno.                            |
| `DailyRoutineFacade.test.ts`             | Ordem da orquestração, fluxo sem permissão de gerenciamento e propagação de falhas. |
| `BrowserNotificationAdapter.test.ts`     | Exibição única, clique com foco e navegação, e reapresentação após adiamento.       |
| `QueryCacheMediator.test.ts`             | Invalidações relacionadas e limpeza no fim da sessão.                               |
| `PatientPermissionSpecification.test.ts` | Proprietário, cuidador autorizado e paciente diferente do recurso.                  |
| `RoutineDateStrategy.test.ts`            | Mudança da data civil entre fusos diferentes.                                       |

Além dos testes novos, os testes anteriores de autenticação, medicamentos, doses e configuração do Supabase foram mantidos.

## Resultado da verificação

A verificação automatizada executa:

1. formatação com oxfmt;
2. lint com ESLint;
3. verificação de tipos com TypeScript;
4. testes unitários com Vitest;
5. build de produção e geração da PWA com Vite.

O resultado final foi de **11 arquivos de teste e 28 casos aprovados**, sem falhas de formatação, lint, tipos ou build. Os testes de Adapter usam dependências simuladas e não escrevem dados no projeto Supabase remoto.

## Limites da validação

Os testes automatizados demonstram o comportamento isolado dos padrões e a integração estática da aplicação. A confirmação das políticas RLS, RPCs, permissões reais do navegador, instalação da PWA e comportamento em segundo plano ainda deve seguir o roteiro manual em `10-roteiro-testes-aceitacao.md` usando contas de teste.
