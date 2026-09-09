# Validação das análises de padrões de projeto

**Data da revisão:** 09/09/2026.
**Escopo:** confronto entre os três documentos produzidos pela equipe e o código atual do MedCare.

> Este documento registra o diagnóstico anterior à refatoração. A implementação aprovada e seus resultados estão documentados em [14 — Refatoração com padrões de projeto e testes](14-refatoracao-padroes-e-testes.md).

## Critérios do parecer

- **Válido:** o problema está presente no código e o padrão proposto trata sua causa principal.
- **Parcialmente válido:** o problema existe, mas a justificativa, o alcance ou a solução precisa ser corrigida.
- **Não válido:** o comportamento apontado não ocorre no código atual ou o padrão apenas recria uma solução que o projeto já possui.

Os documentos recebidos foram usados como material de análise. Suas sugestões não foram tratadas como instruções para alterar o código.

## Resultado consolidado

| Documento e proposta                                      | Problema identificado                                                          | Padrão proposto   | Parecer                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------- | ---------------------------------------------------- |
| `analise-padroes-medcare.pdf` — acesso ao Supabase        | APIs das funcionalidades dependem diretamente do SDK e expõem DTOs do banco    | Adapter           | **Válido, com ajustes**                              |
| `analise-padroes-medcare.pdf` — notificações do navegador | A página mistura interface, permissões e APIs do navegador                     | Adapter           | **Válido, com ajustes**                              |
| `analise-padroes-medcare.pdf` — wrappers de RPC           | Há repetição de chamada, verificação de erro e retorno                         | “Abstract Method” | **Problema pequeno; padrão inadequado**              |
| `Refatoração.pdf` — cliente Supabase                      | Alega criação descontrolada de clientes e risco de múltiplas conexões          | Singleton         | **Não válido**                                       |
| `Refatoração.pdf` — mensagens de erro                     | O normalizador não reconhece strings nem objetos simples com `message`         | Adapter           | **Problema válido; solução precisa ser fortalecida** |
| `12-padroes-adapter-facade.md` — fronteira de dados       | DTOs em `snake_case`, coerções e modelos inconsistentes chegam à aplicação     | Adapter           | **Válido**                                           |
| `12-padroes-adapter-facade.md` — rotina diária            | Páginas coordenam autorização, datas, sincronização e consultas                | Facade            | **Válido**                                           |
| `12-padroes-adapter-facade.md` — chave de notificações    | A chave não representa corretamente a identidade e as dependências da consulta | Ajuste do cache   | **Válido, mas a correção proposta é parcial**        |

## 1. Parecer sobre `analise-padroes-medcare.pdf`

### Dependência direta do Supabase — válido

Os arquivos `src/features/*/api.ts` combinam três responsabilidades:

1. conhecem o protocolo do Supabase e os nomes de tabelas e RPCs;
2. decidem como erros de infraestrutura são propagados;
3. entregam diretamente DTOs do banco para a interface.

Em `src/features/doses/api.ts`, por exemplo, o retorno é convertido com `as DoseOccurrenceRow[]`. Em `src/features/medications/api.ts`, as funções repetem o formato `rpc` + teste de `error` + retorno de `data`. Isso cria acoplamento e permite que uma resposta inesperada atravesse o TypeScript sem validação em tempo de execução.

O **Adapter é adequado** quando usado na fronteira entre Supabase e a aplicação. Ele deve receber um `SupabaseClient`, validar a resposta e convertê-la para um modelo usado pela aplicação. Apenas envolver `createClient` em outra classe não resolveria o vazamento dos DTOs.

O benefício concreto é isolamento e testabilidade. A possibilidade de trocar todo o backend existe, mas é uma justificativa secundária e especulativa no estágio atual.

### APIs do navegador na página de notificações — válido

`NotificationsPage.tsx` exibe a tela e também controla `Notification.permission`, `Notification.requestPermission`, `localStorage`, foco da janela e redirecionamento. Essa mistura dificulta testes unitários e a inclusão de outro fornecedor de notificações.

Um `BrowserNotificationAdapter` é uma boa fronteira. Entretanto, o contrato sugerido no PDF precisa preservar o comportamento de clique e navegação. Uma simples função `show(title, body)` perderia parte da funcionalidade atual. A adoção futura do OneSignal também exigiria service worker, registro do dispositivo e envio pelo backend; trocar apenas o Adapter do navegador não concluiria a integração push.

### Repetição das RPCs — problema real, impacto baixo

A repetição existe, mas cada wrapper é curto e mantém a tipagem específica da operação. O documento chama a solução de **Abstract Method**, que não é um padrão GoF independente. O exemplo apresentado corresponde ao **Template Method**: uma operação concreta define o algoritmo e métodos abstratos fornecem as partes variáveis.

Mesmo com o nome corrigido, Template Method não é a melhor escolha aqui. Uma hierarquia de classes, parâmetros genéricos e nomes de RPC em strings acrescentaria mais estrutura do que a duplicação removida e poderia enfraquecer a inferência de tipos do Supabase. Um pequeno helper tipado ou o próprio Adapter da funcionalidade resolve essa repetição com menos custo.

**Conclusão do documento:** o diagnóstico de acoplamento é válido e os Adapters são defensáveis. A proposta “Abstract Method” deve ser rejeitada ou reescrita como Template Method, deixando claro que é uma demonstração acadêmica e não a solução recomendada para o código atual.

## 2. Parecer sobre `Refatoração.pdf`

### Singleton para o Supabase — não válido

`src/lib/supabase.ts` já executa `createClient` uma única vez no escopo do módulo e exporta essa referência. Módulos ES são armazenados em cache, portanto todos os imports normais recebem a mesma instância. Além disso, `createClient` cria um cliente do SDK; não abre uma nova conexão exclusiva com o banco a cada consulta.

Também não ocorre a falha de inicialização descrita no PDF. As variáveis `import.meta.env` são lidas de forma síncrona. Quando estão ausentes, o módulo exporta `supabase = null`, registra `configurationError` e `requireSupabase()` produz um erro controlado.

Transformar isso em `SupabaseSingleton.getInstance()` seria uma segunda implementação do comportamento que o sistema de módulos já fornece. A versão sugerida ainda armazenaria URL e chave ausentes em constantes, portanto a inicialização tardia não faria essas configurações aparecerem durante a execução.

**Decisão:** não usar Singleton como refatoração deste trecho. Caso o trabalho exija demonstrar Singleton, é necessário escolher outro problema real ou apresentar o módulo atual como uma implementação idiomática de instância única, sem alegar múltiplas conexões.

### Normalização de erros — problema válido

`src/lib/errors.ts` só extrai mensagens quando o valor é uma instância de `Error`. Objetos simples como `{ message: "..." }` e strings caem na mensagem genérica. Como SDKs e integrações podem devolver erros estruturais, o comportamento é insuficiente.

A função proposta no PDF reconhece mais formatos, mas faz uma coerção insegura e pode exibir ao usuário mensagens técnicas ou dados enviados pelo servidor. A implementação deve usar verificações de tipo, traduzir mensagens ou códigos conhecidos e aplicar uma mensagem segura para valores desconhecidos.

Esse componente pode ser descrito como um **Adapter de erros** se houver um contrato explícito que converta diferentes formatos externos para a linguagem da aplicação. Se for apenas uma função com verificações condicionais, “normalizador” ou “mapper” é uma classificação mais precisa que o Adapter GoF clássico.

**Conclusão do documento:** rejeitar o Singleton. Aceitar o problema de erros, revisando a implementação e explicando com precisão em que sentido ela representa um Adapter.

## 3. Parecer sobre `12-padroes-adapter-facade.md`

### Vazamento de DTOs e modelos inconsistentes — válido

O código funcional consome tipos como `DoseOccurrenceRow`, enquanto `src/types.ts` também define `Dose`, `DoseEvent` e `AppNotification`. Esses modelos de aplicação quase não são usados e divergem do banco em pontos relevantes: `actor_id` e `patient_id` podem ser nulos nas linhas persistidas, mas os modelos correspondentes os declaram como obrigatórios.

Isso produz uma fronteira ambígua: parte dos tipos representa o banco, parte descreve um domínio pretendido, e coerções afirmam que dados externos são válidos sem verificá-los. Um **Adapter com mapeamento e validação em tempo de execução** é uma solução adequada. Como o projeto já possui Zod, a validação proposta é compatível com a stack.

### Orquestração em `TodayPage` e `AgendaPage` — válido

`TodayPage` calcula uma janela de 90 dias, verifica permissões, atualiza ocorrências, atualiza notificações e então consulta doses. `AgendaPage` repete parte desse fluxo para um único dia. As páginas acumulam apresentação, política de data, decisão de autorização e sequência de chamadas remotas.

Os efeitos são:

- testes da tela precisam simular muitos detalhes de infraestrutura;
- a ordem das operações pode divergir entre telas;
- novas regras precisam ser repetidas em mais de um componente;
- falhas intermediárias ficam acopladas ao carregamento visual.

Uma **Facade** estreita, como `DailyRoutineFacade`, é válida porque oferece à interface uma operação simples sobre os subsistemas de doses e notificações. Em uma arquitetura em camadas, o mesmo objeto também pode ser chamado de serviço de aplicação. O nome Facade continua defensável para o trabalho porque ele oculta a coordenação de interfaces menores.

O parâmetro `canManage` ajuda a definir o fluxo na interface, mas não substitui autorização. As políticas RLS do Supabase continuam responsáveis pela segurança efetiva.

### Chave de consulta das notificações — problema válido, correção parcial

A chave atual é apenas `["notifications"]`, embora a função dependa do paciente selecionado e do usuário autenticado. Isso pode impedir a atualização esperada e, como o `QueryClient` permanece em memória, pode reutilizar por alguns instantes dados de outra sessão iniciada no mesmo navegador.

Adicionar somente `patient.id` à chave, como sugere o documento, não modela completamente a consulta: `fetchNotifications()` retorna a lista do destinatário, enquanto a atualização anterior é específica do paciente. A solução mais correta é separar:

1. a sincronização das notificações, identificada pelo paciente e pelas permissões;
2. a consulta da caixa do destinatário, identificada pelo usuário autenticado;
3. a limpeza do cache relacionado à sessão no logout.

### Plano de testes — válido

Os testes sugeridos cobrem responsabilidades reais: conversão de DTO, rejeição de dados inválidos, parâmetros de RPC, ordem de chamadas, ausência de permissão, propagação de falhas e limites de datas. Antes da refatoração, convém manter ou acrescentar testes de caracterização para provar que o comportamento visível não mudou.

**Conclusão do documento:** esta é a análise mais consistente e deve servir como base do trabalho. Adapter e Facade tratam problemas distintos e observáveis. O escopo deve ser aplicado por etapas para que a equipe consiga atribuir cada mudança e cada teste ao problema original.

## Recomendação para o trabalho da equipe

A melhor implementação acadêmica e técnica é:

1. selecionar o fluxo diário de doses como recorte;
2. criar um Adapter que converta e valide os DTOs do Supabase;
3. criar uma Facade para coordenar atualização de ocorrências, notificações e consulta da rotina;
4. migrar primeiro `TodayPage` e depois `AgendaPage`;
5. testar Adapter, Facade e comportamento das páginas;
6. tratar o normalizador de erros e o Adapter do navegador como extensões separadas;
7. não implementar o Singleton proposto nem a hierarquia chamada “Abstract Method”.

Essa escolha permite demonstrar dois padrões reconhecidos, ligar cada padrão a uma responsabilidade problemática e medir a melhoria por testes, redução de dependências nas páginas e eliminação de coerções na fronteira refatorada.

## 4. Problemas adicionais encontrados no código

Esta seção registra problemas observados durante a revisão do projeto completo que não foram desenvolvidos nas análises da equipe.

### Prioridade alta

#### Cache não é limpo ao encerrar a sessão

O `QueryClient` é criado uma vez em `src/Root.tsx` e permanece vivo entre sessões. O logout em `src/app/AppShell.tsx` encerra a autenticação e navega para o login, mas não cancela nem remove as consultas. Algumas chaves incluem o usuário, porém outras são globais, como `['notifications']` e `['my-invitations']`; detalhes de dose e medicamento usam apenas o identificador do recurso.

Uma segunda pessoa que entrar no mesmo navegador pode receber dados ainda considerados recentes pelo React Query antes de uma nova consulta protegida por RLS. Como são dados de saúde e relacionamentos de cuidado, isso é também um problema de privacidade no cliente.

**Correção recomendada:** depois de um logout confirmado, cancelar consultas em andamento e limpar o cache da sessão. Chaves de recursos pertencentes ao usuário também devem carregar a identidade ou ser removidas na mudança de autenticação.

#### Mutações deixam telas relacionadas com dados antigos

Após registrar uma dose, `DoseDetailsPage.tsx` invalida `['doses', patientId]` e `['dose-history', patientId]`, mas não atualiza ou invalida `['dose', doseId]`, `['dose-events', doseId]`, `['metrics', ...]` nem `['notifications']`. Ao voltar ao detalhe dentro do `staleTime`, a própria dose e a auditoria podem continuar exibindo a versão anterior.

As mutações de medicamentos invalidam a lista, mas preservam `['medication', medicationId]`. Abrir novamente a edição pode restaurar a versão antiga e provocar um conflito de versão na próxima gravação. Criar, editar e arquivar uma rotina também altera ocorrências, mas o cache das doses não é invalidado.

**Correção recomendada:** definir uma política central de chaves e efeitos de cada mutação. A Facade proposta pode coordenar parte desse trabalho, enquanto funções de query keys evitam nomes incompatíveis como `dose` e `doses`.

#### Permissão da tela pode pertencer a outro paciente

`DoseDetailsPage.tsx` busca a dose pelo identificador da URL, mas calcula `canRecord` usando o paciente atualmente selecionado em `PatientContext`. Uma notificação pode abrir uma dose pertencente a outra rotina acessível. Nesse caso, a tela pode mostrar uma ação que o usuário não possui para aquela dose ou esconder uma ação permitida.

O banco volta a conferir a permissão sobre o paciente real, evitando a gravação indevida, mas a interface permanece inconsistente e conduz o usuário a erros. A edição de medicamento por URL possui risco semelhante, embora o caminho normal parta da lista do paciente selecionado.

**Correção recomendada:** associar o recurso carregado ao paciente correspondente e calcular permissões para esse paciente. Quando necessário, sincronizar a seleção antes de renderizar a ação.

### Prioridade média

#### Datas de uma nova rotina dependem do fuso do dispositivo do cuidador

O formulário inicial calcula `startDate` com `new Date()` no fuso do navegador. Ao salvar uma nova medicação, o código substitui apenas o campo `timezone` pelo fuso do paciente. Se cuidador e paciente estiverem em fusos ou dias diferentes, a data enviada pode representar ontem ou amanhã para o paciente e até ser rejeitada pelo banco.

**Correção recomendada:** calcular a data inicial com `dateInTimezone(new Date(), patient.timezone)` e atualizar os valores iniciais quando o paciente ficar disponível.

#### Adiar um lembrete impede um novo aviso do navegador

O navegador registra para sempre `medcare.browserNotification.<notificationId>` no `localStorage`. O banco reutiliza a mesma notificação após um adiamento, removendo sua resolução, mas o efeito da página encontra a chave antiga e não mostra novamente o aviso do sistema.

**Correção recomendada:** usar uma chave que represente a versão ou o instante de reativação do aviso, ou remover o marcador quando o lembrete for adiado. O Adapter de notificações é um bom local para encapsular essa política.

#### Geração de avisos depende de uma tela aberta

Há uma função SQL `refresh_all_patient_notifications()` reservada ao `service_role`, mas não existe Edge Function, agendamento Cron ou outro processo no repositório que a execute. No frontend, a atualização ocorre quando um usuário com permissão de gerenciamento abre determinadas telas.

Assim, o sistema não gera lembretes de forma autônoma. Esse é um requisito ainda incompleto, coerente com a documentação sobre a futura integração de push, mas precisa ser tratado antes de considerar as notificações prontas.

#### Preferência “Usar texto nos estados” não produz efeito

`state_labels` pode ser alterado e persistido no perfil, mas não é lido por nenhum componente visual nem transformado em atributo do documento. Os rótulos continuam visíveis independentemente da escolha.

**Correção recomendada:** aplicar a preferência de forma consistente ou remover a opção até que seu comportamento esteja implementado.

#### O fuso do perfil aceita valores inexistentes

O schema do frontend exige apenas três caracteres e o banco verifica somente o comprimento. A conta pode salvar um texto que não corresponde a um fuso IANA válido. As RPCs de medicamentos fazem uma validação mais forte usando `pg_timezone_names`, mas perfis e pacientes não compartilham essa garantia.

**Correção recomendada:** oferecer seleção limitada a fusos válidos e validar o valor também no banco.

### Prioridade baixa

#### Falha de logout é ignorada

`AppShell.logout()` navega para o login mesmo que `auth.signOut()` falhe. Se a sessão continuar válida, a tela de login pode redirecionar o usuário imediatamente para a aplicação, sem explicar o erro.

#### A tela vazia oferece uma ação sem permissão

Quando um acompanhante pode consultar doses, mas não gerenciar medicamentos, a tela Hoje sem ocorrências ainda mostra “Adicionar medicamento”. O destino bloqueia a operação corretamente, porém a ação não deveria ser oferecida nesse contexto.

#### Nome do perfil e nome da rotina própria podem divergir

O cadastro cria o perfil e o paciente próprio com o mesmo nome. A edição da conta atualiza somente `profiles.name`; o cabeçalho da rotina usa `patients.name`. Depois da alteração, partes do aplicativo podem exibir nomes diferentes para a mesma pessoa.

## 5. Lacunas de testes

A execução atual possui 12 testes em 4 arquivos e cobre schemas de autenticação e medicamentos, utilitários de doses e resolução da URL local do Supabase. Não foram encontrados testes de componentes nem arquivos E2E, embora o Playwright esteja configurado.

Antes das refatorações, devem ser acrescentados testes para:

- limpeza do cache na troca de sessão;
- invalidações após registrar dose e alterar medicamento;
- abertura de uma dose de paciente diferente do selecionado;
- criação de rotina quando cuidador e paciente estão em fusos diferentes;
- reapresentação do aviso após adiamento;
- aplicação das preferências de acessibilidade;
- autorização das RPCs e políticas RLS com proprietário, cuidador autorizado e usuário sem vínculo.

## Arquivos do código usados como evidência

- `src/lib/supabase.ts`
- `src/lib/errors.ts`
- `src/features/doses/api.ts`
- `src/features/doses/TodayPage.tsx`
- `src/features/doses/AgendaPage.tsx`
- `src/features/medications/api.ts`
- `src/features/notifications/NotificationsPage.tsx`
- `src/types.ts`
- `supabase/migrations/202609060001_initial_schema.sql`
- `supabase/migrations/202609060002_medication_routines.sql`
- `supabase/migrations/202609060004_dose_records.sql`
- `supabase/migrations/202609060005_care_sharing.sql`
- `supabase/migrations/202609060006_insights_notifications_account.sql`
