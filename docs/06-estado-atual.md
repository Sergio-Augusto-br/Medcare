# Estado atual do projeto

Data da atualização: **06/09/2026**. [Índice da documentação](README.md).

O MedCare concluiu localmente as Etapas 1, 2 e 3. Contas, rotina, doses, cuidado compartilhado, indicadores, avisos e dados pessoais usam fluxos persistidos, com rotas e políticas de acesso. O protótipo visual continua disponível em `/prototipo` como referência histórica.

## Funcionalidades operacionais

| Área                 | Implementação verificada                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cadastro             | Cria usuário no Supabase Auth e solicita confirmação por e-mail.                                            |
| Preparação da conta  | Um gatilho cria `profile` e a pessoa `self` no mesmo cadastro.                                              |
| Acesso               | Login por e-mail e senha, sessão persistida, rota protegida e saída.                                        |
| Recuperação          | Solicitação por e-mail e definição de nova senha pelo link temporário.                                      |
| Perfil               | Consulta e edição do nome e do fuso horário da conta.                                                       |
| Credenciais          | Troca de e-mail com confirmação e troca de senha após validar a senha atual.                                |
| Preferências         | Tamanho de texto, contraste, redução de movimento, rótulos de estado e alertas persistidos.                 |
| Medicamentos         | Cadastro, busca, consulta, edição e arquivamento pela rotina própria.                                       |
| Programação          | Um ou mais horários, dias da semana, início, término opcional, fuso e versões persistidas.                  |
| Ocorrências          | Geração transacional e idempotente de doses futuras para até 90 dias após cada alteração.                   |
| Acompanhamento       | Painel do dia, agenda por data e histórico de 7, 30 ou 90 dias calculados com ocorrências reais.            |
| Registro de dose     | Tomada, não tomada, motivo opcional, correção e remoção com controle de versão e requisição idempotente.    |
| Auditoria            | Cada registro ou correção cria um evento com autor, estado anterior, novo estado e data.                    |
| Convites             | Criação, prazo de sete dias, consulta pela conta convidada, aceite, recusa e cancelamento.                  |
| Vínculos             | Permissões por pessoa, seleção da rotina acompanhada, atualização de permissões e revogação imediata.       |
| Painel compartilhado | Hoje, agenda, histórico e medicamentos usam a pessoa selecionada e respeitam as permissões do vínculo.      |
| Indicadores          | Totais, percentual, períodos do dia e evolução semanal para 7, 30 ou 90 dias.                               |
| Avisos               | Lembretes e alertas persistidos, central, leitura, resolução pela dose e adiamento de dez minutos.          |
| Dados da conta       | Exportação JSON, encerramento de outras sessões e exclusão autenticada da conta.                            |
| Instalação           | Manifesto, service worker, ícone, estado de conexão e orientação de instalação no dispositivo.              |
| PWA                  | Manifesto e service worker gerados no build.                                                                |
| Segurança dos dados  | RLS habilitada em todas as tabelas do domínio; perfil e paciente são filtrados pela identidade autenticada. |

## Estrutura disponível no banco

A migração contém perfis, pessoas acompanhadas, vínculos, convites, medicamentos, versões de programação, ocorrências e eventos de dose, notificações e inscrições push. Perfil, pessoa própria, preferências, medicamentos e programações já possuem operações conectadas à interface.

As escritas de medicamentos, doses, convites e vínculos usam funções transacionais que verificam identidade, vínculo e permissões no banco.

## Protótipo ainda não migrado

As 24 telas do protótipo original usam dados fixos e estado local. A entrega de push com o aplicativo fechado e a publicação HTTPS dependem das credenciais e dos ambientes remotos. Operações de dose permanecem online para evitar conflitos clínicos silenciosos.

O código novo não trata esses exemplos como dados reais. Recarregar o protótipo reinicia suas interações locais.

## Verificações executadas em 06/09/2026

- TypeScript sem erros.
- ESLint sem erros.
- 12 testes unitários de conta, endereço local, rotina, datas, estados e indicadores de dose aprovados.
- Build de produção e artefatos PWA gerados.
- Migração aplicada e reaplicada com `supabase db reset`.
- Cadastro local enviou e-mail de confirmação e criou perfil e pessoa própria automaticamente.
- Consulta com papel `authenticated` retornou somente um perfil e uma pessoa autorizada.
- Atualização das preferências por RLS foi executada em transação e revertida.
- Cenário autenticado criou um medicamento e 16 ocorrências futuras.
- Repetir a geração criou zero duplicatas.
- A edição preservou duas versões e rejeitou uma gravação com versão antiga.
- O arquivamento removeu pendências futuras e preservou a ocorrência marcada como tomada.
- O registro autenticado marcou uma dose como tomada e a repetição da requisição não criou outro evento.
- Duas correções foram auditadas; uma gravação com versão antiga foi rejeitada.
- Duas contas temporárias validaram convite, aceite, visibilidade da rotina e registro por cuidador.
- A autoria do cuidador foi exibida pela consulta segura da trilha de eventos.
- Remover a permissão de registro bloqueou a ação no servidor; revogar o vínculo removeu as leituras compartilhadas.
- Uma massa com quatro doses produziu totais, percentual e três períodos do dia conferíveis.
- Foram gerados um lembrete do paciente e um alerta do cuidador; o adiamento e a resolução após registro foram confirmados.
- A exportação incluiu perfil, medicamento e doses; uma conta temporária foi excluída pela própria sessão.
- A conta temporária e seus dados foram removidos ao fim do teste.

## Próxima entrega

Configurar um projeto Supabase remoto, uma origem HTTPS e o provedor OneSignal para a homologação instalada no celular.
