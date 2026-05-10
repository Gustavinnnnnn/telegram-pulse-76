import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, MousePointerClick, Eye } from "lucide-react";
import { gradientForName } from "@/lib/format";

const NAMES = ["Lucas Silva","Ana Souza","Pedro Lima","Mariana Costa","Bruno Alves","Carolina Rocha","Rafael Gomes","Letícia Dias","Diego Pereira","Juliana Martins"];
const ACTIONS = [
  { label: "abriu sua mensagem", icon: Eye, color: "text-primary" },
  { label: "clicou no botão", icon: MousePointerClick, color: "text-cyan" },
  { label: "respondeu seu bot", icon: MessageCircle, color: "text-success" },
  { label: "recebeu sua DM", icon: CheckCircle2, color: "text-success" },
];

interface Event { id: number; name: string; action: typeof ACTIONS[number]; ago: number }

export function LiveActivityFeed({ height = 320 }: { height?: number }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // seed
    const seed = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
      ago: i * 7 + 3,
    }));
    setEvents(seed);
    setCounter(seed.length);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setEvents((prev) => {
        const next: Event = {
          id: counter + Math.random(),
          name: NAMES[Math.floor(Math.random() * NAMES.length)],
          action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
          ago: 0,
        };
        return [next, ...prev.map((e) => ({ ...e, ago: e.ago + 1 }))].slice(0, 12);
      });
      setCounter((c) => c + 1);
    }, 3500);
    return () => clearInterval(t);
  }, [counter]);

  return (
    <div className="tile flex flex-col p-4" style={{ minHeight: height }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Atividade ao vivo</h3>
          <p className="text-[10px] text-muted-foreground">eventos em tempo real</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
          <span className="dot-live" /> ao vivo
        </span>
      </div>
      <ul className="mt-3 flex-1 space-y-2 overflow-y-auto scroll-thin">
        {events.map((e) => {
          const Icon = e.action.icon;
          return (
            <li
              key={e.id}
              className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-surface-1/60 px-2.5 py-2 animate-[tick_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: gradientForName(e.name) }}>
                {e.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px]">
                  <span className="font-semibold">{e.name.split(" ")[0]}</span>{" "}
                  <span className="text-muted-foreground">{e.action.label}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">há {e.ago === 0 ? "instantes" : `${e.ago * 3}s`}</p>
              </div>
              <Icon className={`h-3.5 w-3.5 ${e.action.color}`} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
