import { useState } from "react";

type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "signup"
  | "setup"
  | "addMed"
  | "routine"
  | "successRoutine"
  | "home"
  | "dose"
  | "doseSuccess"
  | "agenda"
  | "history"
  | "adherence"
  | "meds"
  | "care"
  | "careInvite"
  | "caregiver"
  | "alerts"
  | "profile"
  | "accessibility"
  | "notifications"
  | "design"
  | "error";
type DoseState = "taken" | "upcoming" | "late" | "scheduled" | "missed" | "skipped";

const Icon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const paths: Record<string, string> = {
    pill: "M7 17 17 7a5 5 0 0 0-7-7L3 7a5 5 0 0 0 7 7l7-7M7 3l7 7",
    check: "m5 12 4 4L19 6",
    clock: "M12 6v6l4 2",
    calendar: "M4 5h16v15H4zM8 3v4m8-4v4M4 10h16",
    home: "M3 11 12 3l9 8v9H3z",
    user: "M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    chart: "M4 19V5m0 14h17M8 16v-4m5 4V7m5 9v-7",
    bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4",
    arrow: "m9 18 6-6-6-6",
    back: "m15 18-6-6 6-6",
    plus: "M12 5v14M5 12h14",
    people: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-9a4 4 0 1 0 0-8m-3 4a4 4 0 1 1-8 0",
    settings:
      "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.5-10h-2m-13 0h-2m14.5 6-1.4-1.4m-9.2-9.2L6.5 4.5m11 0-1.4 1.4m-9.2 9.2-1.4 1.4",
    info: "M12 17v-5m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    x: "M6 6l12 12M18 6 6 18",
    search: "m20 20-4-4m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    lock: "M6 11h12v10H6zm3 0V7a3 3 0 0 1 6 0v4",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || paths.info} />
    </svg>
  );
};
function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <i></i>
        <i></i>
      </span>
      {!small && (
        <strong>
          Med<span>Care</span>
        </strong>
      )}
    </div>
  );
}
function Status({ state, label }: { state: DoseState | "info"; label?: string }) {
  const x: any = {
    taken: ["✓", "Tomada", "success"],
    upcoming: ["◷", "Próxima", "info"],
    late: ["!", "Atrasada", "warning"],
    scheduled: ["◷", "Programada", "neutral"],
    missed: ["—", "Não registrada", "danger"],
    skipped: ["—", "Ignorada", "neutral"],
    info: ["i", "Informação", "info"],
  }[state];
  return (
    <span className={`status ${x[2]}`}>
      <b>{x[0]}</b>
      {label || x[1]}
    </span>
  );
}
function Button({ children, onClick, variant = "primary", className = "", disabled = false }: any) {
  return (
    <button disabled={disabled} onClick={onClick} className={`btn ${variant} ${className}`}>
      {children}
    </button>
  );
}
function Top({ title, back, action }: { title?: string; back?: () => void; action?: any }) {
  return (
    <header className="top">
      {back ? (
        <button className="icon-btn" onClick={back} aria-label="Voltar">
          <Icon name="back" />
        </button>
      ) : (
        <Brand small />
      )}
      {title && <h2>{title}</h2>}
      <div className="top-action">{action}</div>
    </header>
  );
}
function BottomNav({ current, go }: { current: string; go: (s: Screen) => void }) {
  const data: any[] = [
    ["home", "home", "Hoje"],
    ["agenda", "calendar", "Agenda"],
    ["history", "clock", "Histórico"],
    ["profile", "user", "Perfil"],
  ];
  return (
    <nav className="bottom-nav">
      {data.map(([s, i, l]) => (
        <button key={s} onClick={() => go(s)} className={current === s ? "active" : ""}>
          <Icon name={i} />
          <span>{l}</span>
        </button>
      ))}
    </nav>
  );
}
const doses = [
  {
    time: "08:00",
    name: "Losartana",
    dose: "50 mg",
    state: "taken",
    detail: "Tomada às 08:07",
  },
  {
    time: "08:00",
    name: "Metformina",
    dose: "500 mg",
    state: "taken",
    detail: "Tomada às 08:12",
  },
  {
    time: "18:00",
    name: "Metformina",
    dose: "500 mg",
    state: "upcoming",
    detail: "Próxima",
  },
  {
    time: "20:00",
    name: "Losartana",
    dose: "50 mg",
    state: "scheduled",
    detail: "Programada",
  },
  {
    time: "22:00",
    name: "Sinvastatina",
    dose: "20 mg",
    state: "scheduled",
    detail: "Programada",
  },
] as any[];
function DoseRow({ dose, onClick }: { dose: any; onClick?: () => void }) {
  return (
    <button className="dose-row" onClick={onClick}>
      <span className="dose-time">{dose.time}</span>
      <span className="pill-icon">
        <Icon name="pill" size={18} />
      </span>
      <span className="dose-copy">
        <b>
          {dose.name} <em>{dose.dose}</em>
        </b>
        <small>{dose.detail}</small>
      </span>
      <Status state={dose.state} />
      <Icon name="arrow" size={16} />
    </button>
  );
}
function MedicationHero({ late, onClick }: { late: boolean; onClick: () => void }) {
  return (
    <section className={`med-hero ${late ? "late" : ""}`}>
      <div className="hero-top">
        <span className="eyebrow">{late ? "AÇÃO PENDENTE" : "PRÓXIMA MEDICAÇÃO"}</span>
        <Status state={late ? "late" : "upcoming"} label={late ? "Atrasada" : "Em breve"} />
      </div>
      <div className="med-title">
        <span className="big-pill">
          <Icon name="pill" size={30} />
        </span>
        <div>
          <h1>Metformina</h1>
          <p>500 mg · 1 comprimido</p>
        </div>
      </div>
      <div className="hero-time">
        <strong>{late ? "18:00" : "18:00"}</strong>
        <span>{late ? "Atrasada há 20 minutos" : "Faltam 25 minutos"}</span>
      </div>
      <Button onClick={onClick}>
        {late ? "Registrar agora" : "Confirmar quando tomar"}
        <Icon name="arrow" size={19} />
      </Button>
    </section>
  );
}
function Home({
  go,
  late,
  completed,
}: {
  go: (s: Screen) => void;
  late: boolean;
  completed: boolean;
}) {
  return (
    <>
      <Top
        action={
          <button
            className="icon-btn"
            onClick={() => go("notifications")}
            aria-label="Notificações"
          >
            <Icon name="bell" />
          </button>
        }
      />
      <main className="screen-content home">
        {" "}
        <p className="hello">Bom dia, Maria</p>
        <p className="date">Quarta-feira, 20 de agosto</p>
        {completed ? (
          <section className="complete">
            <span>
              <Icon name="check" size={30} />
            </span>
            <h1>Tudo certo por hoje</h1>
            <p>Todas as doses de hoje foram registradas.</p>
            <div className="tomorrow">
              Amanhã · Losartana 50 mg <b>08:00</b>
            </div>
          </section>
        ) : (
          <MedicationHero late={late} onClick={() => go("dose")} />
        )}
        <section className="today-list">
          <div className="section-heading">
            <h2>Hoje</h2>
            <span>{completed ? "5 de 5 registradas" : "2 de 5 registradas"}</span>
          </div>
          {doses.map((d, i) => (
            <DoseRow
              key={i}
              dose={late && i === 2 ? { ...d, state: "late", detail: "Atrasada há 20 min" } : d}
              onClick={i === 2 ? () => go("dose") : undefined}
            />
          ))}
        </section>
      </main>
      <BottomNav current="home" go={go} />
    </>
  );
}
function Splash({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="splash">
      <Brand />
      <div className="splash-orbit"></div>
      <p>Sua rotina, com mais clareza.</p>
      <Button onClick={() => go("onboarding")}>Começar</Button>
    </main>
  );
}
function Onboarding({ go }: { go: (x: Screen) => void }) {
  const [step, setStep] = useState(0);
  const content = [
    [
      "Sua rotina de medicamentos mais simples",
      "Organize horários e acompanhe suas doses ao longo do dia.",
      "pill",
    ],
    [
      "Lembretes quando você precisar",
      "Receba avisos nos horários programados e registre suas doses com poucos toques.",
      "bell",
    ],
    [
      "Compartilhe o acompanhamento",
      "Se quiser, permita que familiares ou cuidadores acompanhem sua rotina.",
      "people",
    ],
  ];
  const c = content[step];
  return (
    <>
      <main className="onboard">
        <Top
          action={
            <button className="text-btn" onClick={() => go("login")}>
              Pular
            </button>
          }
        />
        <div className="onboard-art">
          <span>
            <Icon name={c[2]} size={66} />
          </span>
          <i></i>
          <i></i>
        </div>
        <div className="onboard-copy">
          <p className="eyebrow">MEDCARE</p>
          <h1>{c[0]}</h1>
          <p>{c[1]}</p>
        </div>
        <div className="onboard-bottom">
          <div className="dots">
            {content.map((_, i) => (
              <i key={i} className={step === i ? "on" : ""} />
            ))}
          </div>
          <Button onClick={() => (step < 2 ? setStep(step + 1) : go("login"))}>
            {step === 2 ? "Começar" : "Continuar"}
            <Icon name="arrow" />
          </Button>
        </div>
      </main>
    </>
  );
}
function Login({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="form-page">
      <Top back={() => go("onboarding")} />
      <Brand />
      <div>
        <h1>Que bom ver você</h1>
        <p>Entre para ver sua rotina.</p>
      </div>
      <label>
        E-mail
        <input placeholder="nome@email.com" type="email" />
      </label>
      <label>
        Senha
        <div className="password">
          <input placeholder="Sua senha" type="password" />
          <Icon name="lock" size={18} />
        </div>
      </label>
      <button className="text-link">Esqueci minha senha</button>
      <Button onClick={() => go("home")}>Entrar</Button>
      <p className="form-footer">
        Ainda não tem conta? <button onClick={() => go("signup")}>Criar conta</button>
      </p>
    </main>
  );
}
function Signup({ go }: { go: (x: Screen) => void }) {
  const [role, setRole] = useState<"patient" | "caregiver" | null>(null);
  return (
    <main className="form-page signup">
      <Top back={() => go("login")} />
      <p className="eyebrow">CRIAR CONTA · 1 DE 3</p>
      <h1>Vamos começar</h1>
      <p>Use seus dados para criar sua conta.</p>
      <label>
        Nome
        <input defaultValue="Maria Oliveira" />
      </label>
      <label>
        E-mail
        <input defaultValue="maria@email.com" />
      </label>
      <label>
        Senha
        <input type="password" placeholder="Crie uma senha" />
      </label>
      <div className="role-choice">
        <p>Como você usará o MedCare?</p>
        <button className={role === "patient" ? "chosen" : ""} onClick={() => setRole("patient")}>
          <Icon name="pill" />
          Para acompanhar meus medicamentos
        </button>
        <button
          className={role === "caregiver" ? "chosen" : ""}
          onClick={() => setRole("caregiver")}
        >
          <Icon name="people" />
          Para ajudar outra pessoa
        </button>
      </div>
      <Button onClick={() => go(role === "caregiver" ? "caregiver" : "setup")}>Continuar</Button>
    </main>
  );
}
function Setup({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="setup">
      <Top />
      <div className="setup-art">
        <Icon name="pill" size={56} />
      </div>
      <h1>Vamos organizar sua rotina</h1>
      <p>Comece adicionando um medicamento. Você poderá incluir os outros depois.</p>
      <Button onClick={() => go("addMed")}>Adicionar meu primeiro medicamento</Button>
      <Button variant="tertiary" onClick={() => go("home")}>
        Fazer isso depois
      </Button>
    </main>
  );
}
function AddMed({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="form-page">
      <Top title="Novo medicamento" back={() => go("setup")} />
      <p className="eyebrow">PASSO 1 DE 3</p>
      <h1>Qual é o medicamento?</h1>
      <p>Use o mesmo nome que aparece na sua prescrição.</p>
      <label>
        Nome do medicamento
        <input defaultValue="Losartana" />
      </label>
      <label>
        Dosagem e unidade
        <div className="inline-input">
          <input defaultValue="50" />
          <button>
            mg <Icon name="arrow" size={16} />
          </button>
        </div>
      </label>
      <label>
        Forma
        <select defaultValue="Comprimido">
          <option>Comprimido</option>
          <option>Cápsula</option>
          <option>Gotas</option>
        </select>
      </label>
      <div className="form-push">
        <Button onClick={() => go("routine")}>Continuar</Button>
      </div>
    </main>
  );
}
function Routine({ go }: { go: (x: Screen) => void }) {
  const [times, setTimes] = useState(["08:00", "20:00"]);
  return (
    <main className="form-page">
      <Top title="Criar rotina" back={() => go("addMed")} />
      <p className="eyebrow">PASSO 2 DE 3</p>
      <h1>Quando você precisa tomar?</h1>
      <p>Losartana 50 mg · todos os dias</p>
      <div className="time-list">
        {times.map((t, i) => (
          <div key={i}>
            <span className="time-dot"></span>
            <strong>{t}</strong>
            <button
              aria-label="Remover horário"
              onClick={() => setTimes(times.filter((_, idx) => idx !== i))}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="secondary" onClick={() => setTimes([...times, "12:00"])}>
        <Icon name="plus" />
        Adicionar horário
      </Button>
      <div className="notice">
        <Icon name="info" />
        <span>Use apenas os horários da sua prescrição.</span>
      </div>
      <div className="form-push">
        <Button onClick={() => go("successRoutine")}>Salvar rotina</Button>
      </div>
    </main>
  );
}
function SuccessRoutine({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="setup">
      <div className="success-icon">
        <Icon name="check" size={40} />
      </div>
      <h1>Tudo pronto, Maria!</h1>
      <p>Sua primeira rotina foi criada.</p>
      <div className="summary-card">
        <b>
          Losartana <em>50 mg</em>
        </b>
        <span>Todos os dias</span>
        <strong>08:00 · 20:00</strong>
      </div>
      <Button onClick={() => go("home")}>Ir para meu dia</Button>
    </main>
  );
}
function Dose({ go, confirm }: { go: (x: Screen) => void; confirm: () => void }) {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <main className="dose-detail">
        <Top title="Detalhes da dose" back={() => go("home")} />
        <div className="dose-detail-main">
          <span className="big-pill">
            <Icon name="pill" size={32} />
          </span>
          <Status state="late" />
          <h1>Metformina</h1>
          <h2>500 mg</h2>
          <p>1 comprimido · Hoje às 18:00</p>
          <div className="instruction">
            <Icon name="info" />
            <span>Tomar junto à refeição</span>
          </div>
        </div>
        <div className="dose-actions">
          <Button onClick={confirm}>
            Confirmar que tomei <Icon name="check" />
          </Button>
          <Button variant="secondary">Lembrar novamente</Button>
          <Button variant="tertiary" onClick={() => setSheet(true)}>
            Outras opções
          </Button>
        </div>
      </main>
      {sheet && (
        <div className="sheet-backdrop">
          <section className="bottom-sheet">
            <div className="handle"></div>
            <h2>Não registrar esta dose como tomada?</h2>
            <p>Você pode informar um motivo, se preferir.</p>
            {[
              "Esqueci",
              "Não estava com o medicamento",
              "Orientação do profissional",
              "Prefiro não informar",
            ].map((x) => (
              <label className="radio" key={x}>
                <input type="radio" name="skip" />
                {x}
              </label>
            ))}
            <Button onClick={() => go("home")}>Confirmar</Button>
            <Button variant="tertiary" onClick={() => setSheet(false)}>
              Cancelar
            </Button>
          </section>
        </div>
      )}
    </>
  );
}
function DoseSuccess({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="dose-success">
      <div className="success-icon">
        <Icon name="check" size={44} />
      </div>
      <p className="eyebrow">DOSE REGISTRADA</p>
      <h1>Pronto, Maria</h1>
      <p>
        Metformina <b>500 mg</b> foi registrada às <b>18:20</b>.
      </p>
      <div className="small-note">Se registrou por engano, você pode corrigir no histórico.</div>
      <Button onClick={() => go("home")}>Concluir</Button>
    </main>
  );
}
function Agenda({ go }: { go: (x: Screen) => void }) {
  const [tomorrow, setTomorrow] = useState(false);
  return (
    <>
      <Top
        title="Agenda"
        action={
          <button className="icon-btn">
            <Icon name="calendar" />
          </button>
        }
      />
      <main className="screen-content">
        <div className="day-tabs">
          <button className={!tomorrow ? "selected" : ""} onClick={() => setTomorrow(false)}>
            Hoje
            <br />
            <b>20</b>
          </button>
          <button className={tomorrow ? "selected" : ""} onClick={() => setTomorrow(true)}>
            Amanhã
            <br />
            <b>21</b>
          </button>
          <button>
            Sex
            <br />
            <b>22</b>
          </button>
          <button>
            Sáb
            <br />
            <b>23</b>
          </button>
        </div>
        <h1>{tomorrow ? "Amanhã, 21 de agosto" : "Hoje, 20 de agosto"}</h1>
        <section className="timeline">
          {doses.map((d, i) => (
            <div className="timeline-item" key={i}>
              <span className="line"></span>
              <span className="dose-time">{d.time}</span>
              <div>
                <b>
                  {d.name} <em>{d.dose}</em>
                </b>
                <p>{tomorrow ? "Programada" : d.detail}</p>
                <Status state={tomorrow ? "scheduled" : d.state} />
              </div>
            </div>
          ))}
        </section>
      </main>
      <BottomNav current="agenda" go={go} />
    </>
  );
}
function History({ go }: { go: (x: Screen) => void }) {
  const [period, setPeriod] = useState("7 dias");
  return (
    <>
      <Top
        title="Histórico"
        action={
          <button className="icon-btn" onClick={() => go("adherence")} aria-label="Ver sua rotina">
            <Icon name="chart" />
          </button>
        }
      />
      <main className="screen-content">
        <div className="segmented">
          {["7 dias", "30 dias", "90 dias"].map((x) => (
            <button className={period === x ? "on" : ""} onClick={() => setPeriod(x)} key={x}>
              {x}
            </button>
          ))}
        </div>
        <div className="history-date">
          <h2>Terça-feira, 19 de agosto</h2>
          <p>4 de 5 doses registradas</p>
        </div>
        {[
          { ...doses[0], detail: "Tomada às 08:04" },
          { ...doses[1], detail: "Tomada às 08:18" },
          { ...doses[2], state: "late", detail: "Tomada às 19:02" },
          { ...doses[3], detail: "Tomada às 20:10", state: "taken" },
          { ...doses[4], state: "missed", detail: "Não registrada" },
        ].map((d, i) => (
          <DoseRow dose={d} key={i} onClick={() => go("dose")} />
        ))}
      </main>
      <BottomNav current="history" go={go} />
    </>
  );
}
function Adherence({ go }: { go: (x: Screen) => void }) {
  const [days, setDays] = useState("30 dias");
  const bars = [65, 73, 88, 76];
  return (
    <>
      <Top title="Sua rotina" back={() => go("history")} />
      <main className="screen-content">
        <div className="segmented">
          {["7 dias", "30 dias"].map((x) => (
            <button key={x} className={days === x ? "on" : ""} onClick={() => setDays(x)}>
              {x}
            </button>
          ))}
        </div>
        <section className="adherence-lead">
          <div className="ring">
            <strong>
              91<small>%</small>
            </strong>
            <span>
              doses
              <br />
              registradas
            </span>
          </div>
          <div>
            <p>Últimos {days}</p>
            <h1>Uma rotina bem acompanhada</h1>
            <span>109 tomadas · 7 não registradas</span>
          </div>
        </section>
        <section className="chart-card">
          <div className="section-heading">
            <h2>Ao longo das semanas</h2>
            <span>Tendência estável</span>
          </div>
          <div className="bar-chart">
            {bars.map((h, i) => (
              <div key={i}>
                <i style={{ height: `${h}%` }}></i>
                <span>S{i + 1}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="metric-section">
          <h2>Por período do dia</h2>
          {[
            ["Manhã", "96%", 96],
            ["Tarde", "78%", 78],
            ["Noite", "92%", 92],
          ].map(([n, v, w]) => (
            <div className="progress" key={n}>
              <span>{n}</span>
              <i>
                <b style={{ width: `${w}%` }}></b>
              </i>
              <strong>{v}</strong>
            </div>
          ))}
        </section>
        <section className="insight-card" onClick={() => go("alerts")}>
          <span className="insight-icon">
            <Icon name="info" />
          </span>
          <div>
            <b>A tarde tem mais doses não registradas</b>
            <p>Nas últimas 4 semanas, a maior parte ocorreu entre 14h e 18h.</p>
          </div>
          <Icon name="arrow" size={16} />
        </section>
      </main>
    </>
  );
}
function Meds({ go }: { go: (x: Screen) => void }) {
  return (
    <>
      <Top title="Meus medicamentos" back={() => go("profile")} />
      <main className="screen-content">
        <div className="search">
          <Icon name="search" />
          <input placeholder="Buscar medicamento" />
        </div>
        {[
          ["Losartana", "50 mg"],
          ["Metformina", "500 mg"],
          ["Sinvastatina", "20 mg"],
        ].map((x) => (
          <button className="med-card" key={x[0]} onClick={() => go("routine")}>
            <span className="pill-icon">
              <Icon name="pill" />
            </span>
            <span>
              <b>{x[0]}</b>
              <p>{x[1]} · Comprimido</p>
            </span>
            <Icon name="arrow" />
          </button>
        ))}
        <Button variant="secondary" onClick={() => go("addMed")}>
          <Icon name="plus" />
          Adicionar medicamento
        </Button>
      </main>
    </>
  );
}
function Care({ go }: { go: (x: Screen) => void }) {
  return (
    <>
      <Top title="Quem acompanha você" back={() => go("profile")} />
      <main className="screen-content">
        <p className="lead">Você decide quem pode acompanhar sua rotina.</p>
        <section className="care-card">
          <div className="avatar">CO</div>
          <div>
            <h2>Carlos Oliveira</h2>
            <p>Filho</p>
          </div>
          <Status state="taken" label="Ativo" />
        </section>
        <section className="permissions">
          <h3>Carlos pode:</h3>
          {["Ver medicamentos", "Ver histórico", "Receber alertas"].map((x) => (
            <p key={x}>
              <Icon name="check" /> {x}
            </p>
          ))}
          <h3>Carlos não pode:</h3>
          <p>
            <Icon name="x" /> Editar prescrições
          </p>
        </section>
        <Button onClick={() => go("careInvite")}>
          <Icon name="plus" />
          Adicionar pessoa
        </Button>
        <Button variant="tertiary">Editar permissões</Button>
      </main>
    </>
  );
}
function CareInvite({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="form-page">
      <Top title="Adicionar pessoa" back={() => go("care")} />
      <h1>Convide alguém de confiança</h1>
      <p>Você poderá escolher exatamente o que essa pessoa pode ver.</p>
      <label>
        Nome
        <input defaultValue="Carlos Oliveira" />
      </label>
      <label>
        E-mail ou telefone
        <input defaultValue="carlos@email.com" />
      </label>
      <label>
        Tipo de relação
        <select>
          <option>Filho</option>
          <option>Cuidador</option>
          <option>Profissional autorizado</option>
        </select>
      </label>
      <h3>Permissões</h3>
      {[
        "Ver medicamentos",
        "Ver histórico",
        "Ver adesão",
        "Receber alertas",
        "Gerenciar rotina",
      ].map((x, i) => (
        <label className="switch-row" key={x}>
          {x}
          <input type="checkbox" defaultChecked={i < 3} />
          <i></i>
        </label>
      ))}
      <div className="form-push">
        <Button onClick={() => go("care")}>Enviar convite</Button>
      </div>
    </main>
  );
}
function Caregiver({ go }: { go: (x: Screen) => void }) {
  return (
    <>
      <Top
        action={
          <button className="icon-btn" onClick={() => go("alerts")}>
            <Icon name="bell" />
          </button>
        }
      />
      <main className="screen-content caregiver">
        <p className="hello">Boa tarde, Carlos</p>
        <p className="date">Acompanhamento de hoje</p>
        <section className="person-head">
          <div className="avatar large">MO</div>
          <div>
            <span>Paciente acompanhado</span>
            <h1>Maria Oliveira</h1>
          </div>
        </section>
        <section className="care-status">
          <p>HOJE</p>
          <strong>
            4 <em>de 5 doses registradas</em>
          </strong>
          <div>
            <i></i>
            <b>1 dose ainda não registrada</b>
          </div>
        </section>
        <section className="attention-card">
          <Status state="late" />
          <h2>
            Metformina <em>500 mg</em>
          </h2>
          <p>
            Programada para 18:00
            <br />
            Ainda não registrada
          </p>
          <Button onClick={() => go("dose")}>
            Ver detalhes <Icon name="arrow" />
          </Button>
        </section>
        <section className="care-summary">
          <h2>Últimos 7 dias</h2>
          <strong>94%</strong>
          <span>das doses registradas</span>
          <Button variant="tertiary" onClick={() => go("adherence")}>
            Ver adesão
          </Button>
        </section>
      </main>
      <nav className="bottom-nav caregiver-nav">
        {[
          ["caregiver", "home", "Início"],
          ["care", "people", "Pacientes"],
          ["alerts", "bell", "Alertas"],
          ["profile", "user", "Perfil"],
        ].map(([s, i, l]) => (
          <button
            onClick={() => go(s as Screen)}
            className={s === "caregiver" ? "active" : ""}
            key={s}
          >
            <Icon name={i} />
            <span>{l}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
function Alerts({ go }: { go: (x: Screen) => void }) {
  return (
    <>
      <Top title="Alertas" back={() => go("caregiver")} />
      <main className="screen-content">
        <div className="notification new">
          <div className="avatar">MO</div>
          <div>
            <Status state="late" label="Novo" />
            <h3>Maria</h3>
            <p>A dose de Metformina programada para 18:00 ainda não foi registrada.</p>
            <small>18:20</small>
          </div>
        </div>
        <div className="notification">
          <div className="avatar">MO</div>
          <div>
            <Status state="taken" label="Resolvido" />
            <h3>Maria</h3>
            <p>Maria registrou a dose de Metformina às 18:20.</p>
            <small>18:20</small>
          </div>
        </div>
        <section className="insight-card" onClick={() => go("adherence")}>
          <span className="insight-icon">
            <Icon name="chart" />
          </span>
          <div>
            <b>Ver adesão de Maria</b>
            <p>Últimos 30 dias</p>
          </div>
          <Icon name="arrow" />
        </section>
      </main>
    </>
  );
}
function Profile({ go }: { go: (x: Screen) => void }) {
  const items: any[] = [
    ["Meu perfil", "user"],
    ["Meus medicamentos", "pill", "meds"],
    ["Minha rotina", "clock", "routine"],
    ["Quem me acompanha", "people", "care"],
    ["Notificações", "bell", "notifications"],
    ["Acessibilidade", "info", "accessibility"],
    ["Privacidade", "lock"],
    ["Segurança", "settings"],
    ["Ajuda", "info"],
    ["MedCare Design System", "chart", "design"],
  ];
  return (
    <>
      <Top title="Perfil" />
      <main className="screen-content">
        <section className="profile-head">
          <div className="avatar large">MO</div>
          <div>
            <h1>Maria Oliveira</h1>
            <p>maria@email.com</p>
          </div>
        </section>
        <div className="settings-list">
          {items.map(([n, i, s]) => (
            <button key={n} onClick={() => s && go(s)}>
              <Icon name={i} />
              <span>{n}</span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
        </div>
        <Button variant="tertiary">Sair</Button>
      </main>
      <BottomNav current="profile" go={go} />
    </>
  );
}
function Accessibility({ go }: { go: (x: Screen) => void }) {
  return (
    <>
      <Top title="Acessibilidade" back={() => go("profile")} />
      <main className="screen-content">
        <p className="lead">
          Escolha preferências que deixem o MedCare mais confortável para você.
        </p>
        <section className="access-box">
          <h2>Tamanho do texto</h2>
          <div className="segmented three">
            <button>Padrão</button>
            <button className="on">Grande</button>
            <button>Muito grande</button>
          </div>
          <p>Exemplo de leitura</p>
          <strong className="large-example">Metformina 500 mg</strong>
          <span>Hoje às 18:00</span>
        </section>
        {[
          ["Aumentar contraste", "Melhora a distinção visual entre elementos."],
          ["Reduzir animações", "Diminui movimentos e transições."],
          ["Usar texto nos estados", "Mostra sempre o nome do estado junto ao ícone."],
        ].map(([n, d]) => (
          <label className="switch-row settings-switch" key={n}>
            <span>
              <b>{n}</b>
              <small>{d}</small>
            </span>
            <input type="checkbox" defaultChecked />
            <i></i>
          </label>
        ))}
      </main>
    </>
  );
}
function Notifications({ go }: { go: (x: Screen) => void }) {
  return (
    <>
      <Top title="Notificações" back={() => go("home")} />
      <main className="screen-content">
        <h3 className="group-title">Hoje</h3>
        {[
          ["18:00", "Hora da Metformina", "500 mg · programada para 18:00", "pill"],
          [
            "14:45",
            "Dose ainda não registrada",
            "A dose de 14:00 ainda não foi registrada.",
            "info",
          ],
        ].map((x) => (
          <div className="in-app-note" key={x[0]}>
            <span>
              <Icon name={x[3]} />
            </span>
            <div>
              <small>{x[0]}</small>
              <b>{x[1]}</b>
              <p>{x[2]}</p>
            </div>
          </div>
        ))}
        <h3 className="group-title">Ontem</h3>
        <div className="in-app-note">
          <span>
            <Icon name="pill" />
          </span>
          <div>
            <small>22:00</small>
            <b>Hora da Sinvastatina</b>
            <p>20 mg · programada para 22:00</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => go("profile")}>
          Preferências de notificações
        </Button>
      </main>
    </>
  );
}
function DesignSystem({ go }: { go: (x: Screen) => void }) {
  return (
    <>
      <Top title="MedCare Design System" back={() => go("profile")} />
      <main className="screen-content design-system">
        <p className="lead">
          Fundamentos e componentes para uma rotina simples, legível e consistente.
        </p>
        <h2>Foundations</h2>
        <div className="swatches">
          {[
            ["Primary", "#176B63"],
            ["Surface", "#FFFFFF"],
            ["Success", "#247454"],
            ["Warning", "#9A5B09"],
            ["Danger", "#AB3B3B"],
          ].map(([n, c]) => (
            <div key={n}>
              <i style={{ background: c }}></i>
              <b>{n}</b>
              <small>{c}</small>
            </div>
          ))}
        </div>
        <section className="type-sample">
          <p className="eyebrow">TYPOGRAPHY</p>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <p>Body · Texto claro, humano e confortável para ler.</p>
          <small>Caption · Labels com suporte textual.</small>
        </section>
        <h2>Components</h2>
        <div className="component-demo">
          <Button>Primary button</Button>
          <Button variant="secondary">Secondary button</Button>
          <div className="status-line">
            <Status state="taken" />
            <Status state="late" />
            <Status state="scheduled" />
          </div>
        </div>
        <section className="token-note">
          <b>Tokens semânticos</b>
          <p>color.primary · color.surface.default · color.text.primary · color.status.warning</p>
        </section>
      </main>
    </>
  );
}
function ErrorPage({ go }: { go: (x: Screen) => void }) {
  return (
    <main className="setup">
      <div className="error-icon">
        <Icon name="info" size={40} />
      </div>
      <h1>Não conseguimos carregar agora</h1>
      <p>Verifique sua conexão e tente novamente.</p>
      <Button onClick={() => go("home")}>Tentar novamente</Button>
      <div className="offline">
        <Icon name="info" /> Você está sem conexão
        <br />
        <small>Vamos sincronizar quando a conexão voltar.</small>
      </div>
    </main>
  );
}
function PrototypeApp() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [late, setLate] = useState(true);
  const [completed, setCompleted] = useState(false);
  const go = (s: Screen) => setScreen(s);
  const confirm = () => {
    setLate(false);
    setCompleted(true);
    go("doseSuccess");
  };
  const props = { go };
  const view: any = {
    splash: <Splash {...props} />,
    onboarding: <Onboarding {...props} />,
    login: <Login {...props} />,
    signup: <Signup {...props} />,
    setup: <Setup {...props} />,
    addMed: <AddMed {...props} />,
    routine: <Routine {...props} />,
    successRoutine: <SuccessRoutine {...props} />,
    home: <Home {...props} late={late} completed={completed} />,
    dose: <Dose {...props} confirm={confirm} />,
    doseSuccess: <DoseSuccess {...props} />,
    agenda: <Agenda {...props} />,
    history: <History {...props} />,
    adherence: <Adherence {...props} />,
    meds: <Meds {...props} />,
    care: <Care {...props} />,
    careInvite: <CareInvite {...props} />,
    caregiver: <Caregiver {...props} />,
    alerts: <Alerts {...props} />,
    profile: <Profile {...props} />,
    accessibility: <Accessibility {...props} />,
    notifications: <Notifications {...props} />,
    design: <DesignSystem {...props} />,
    error: <ErrorPage {...props} />,
  }[screen];
  return (
    <div className="app-stage">
      <div className="phone-shell">{view}</div>
      <aside className="prototype-guide">
        <Brand />
        <p>Protótipo demonstrativo</p>
        <h2>
          Rotina clara,
          <br />
          cuidado compartilhado.
        </h2>
        <p>Explore o fluxo de Maria e veja a confirmação chegar à visão do Carlos.</p>
        <div className="flow-buttons">
          <button onClick={() => go("home")}>1 · Dia da Maria</button>
          <button onClick={() => go("caregiver")}>2 · Visão do Carlos</button>
          <button onClick={() => go("adherence")}>3 · Adesão em 30 dias</button>
          <button onClick={() => go("design")}>Sistema visual</button>
        </div>
        <small>Base: 390 px · preparado para texto ampliado e navegação por leitor de tela.</small>
      </aside>
    </div>
  );
}

export default PrototypeApp;
