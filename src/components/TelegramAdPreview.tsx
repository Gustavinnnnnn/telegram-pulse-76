// Highly realistic Telegram chat preview that simulates the experience
// of an outgoing DM being delivered to a real Telegram user.
// Used in the create-campaign wizard and on the campaign overview page.
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Phone, Video, MoreVertical, Search, Paperclip, Smile, Mic } from "lucide-react";

interface Props {
  channelName?: string;
  channelHandle?: string;
  text: string;
  description?: string;
  buttonLabel?: string;
  mediaUrl?: string;
  /** When true, renders an animated DM thread (typing → received → seen → reply). */
  simulateDelivery?: boolean;
}

const RECIPIENT_NAMES = ["Lucas Almeida", "Mariana Costa", "Rafael Souza", "Camila Rocha", "Bruno Lima"];

function pickRecipient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return RECIPIENT_NAMES[h % RECIPIENT_NAMES.length];
}

export function TelegramAdPreview({
  channelName = "Sua marca",
  channelHandle = "@sua_marca",
  text,
  description,
  buttonLabel,
  mediaUrl,
  simulateDelivery = false,
}: Props) {
  const recipient = pickRecipient((text || "") + channelName);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(simulateDelivery ? 0 : 4);
  const [now, setNow] = useState<Date | null>(null); // null on SSR to avoid hydration mismatch
  const startedAt = useRef(0);

  // Initialise time on the client only
  useEffect(() => { setNow(new Date()); startedAt.current = Date.now(); }, []);

  useEffect(() => {
    if (!simulateDelivery) return;
    setPhase(0);
    startedAt.current = Date.now();
    const t1 = setTimeout(() => setPhase(1), 1100); // single tick (sent)
    const t2 = setTimeout(() => setPhase(2), 2200); // double tick (delivered)
    const t3 = setTimeout(() => setPhase(3), 3600); // read (cyan ticks)
    const t4 = setTimeout(() => setPhase(4), 5800); // reply
    const ticker = setInterval(() => setNow(new Date()), 30_000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearInterval(ticker); };
  }, [simulateDelivery, text]);

  const time = now ? now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--";

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Phone bezel */}
      <div className="relative rounded-[40px] border border-border-strong bg-[oklch(0.08_0.01_240)] p-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
        {/* Notch */}
        <div className="absolute left-1/2 top-2.5 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-black" />
        <div className="overflow-hidden rounded-[32px] bg-[#17212B]">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-1.5 pb-1 text-[10px] font-semibold text-white/90">
            <span>{time}</span>
            <span className="flex items-center gap-1">
              <span className="font-mono">5G</span>
              <span className="ml-1 inline-block h-2 w-3 rounded-sm border border-white/70" />
              <span className="ml-0.5">100%</span>
            </span>
          </div>

          {/* Telegram chat header */}
          <div className="flex items-center gap-2 bg-[#17212B] border-b border-black/40 px-3 py-2">
            <button className="text-[#6BB7F0] text-[14px]">‹</button>
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#5DA3DD] to-[#3A7BB8] text-[12px] font-bold text-white">
                {recipient.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#17212B] bg-[#4FAE4D]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white">{recipient}</p>
              <p className="truncate text-[10px] text-[#6BB7F0]">
                {phase === 0 ? "digitando…" : "online"}
              </p>
            </div>
            <Search className="h-4 w-4 text-[#6BB7F0]" />
            <Phone className="h-4 w-4 text-[#6BB7F0]" />
            <MoreVertical className="h-4 w-4 text-[#6BB7F0]" />
          </div>

          {/* Chat area with TG-like pattern */}
          <div
            className="relative min-h-[340px] px-2.5 py-3 space-y-2"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath fill='%23304560' fill-opacity='0.18' d='M20 0 L40 20 L20 40 L0 20 Z'/%3E%3C/svg%3E\"), linear-gradient(180deg, #182533, #0E1620)",
            }}
          >
            {/* Date chip */}
            <div className="flex justify-center">
              <span className="rounded-full bg-black/35 px-2.5 py-0.5 text-[9.5px] font-semibold text-white/80 backdrop-blur">
                hoje
              </span>
            </div>

            {/* Outgoing sponsored message bubble */}
            <div className="flex justify-end">
              <div className="relative max-w-[82%] rounded-2xl rounded-br-md bg-[#2B5278] p-2 shadow-md text-white">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="rounded-sm bg-white/20 px-1 py-px text-[8.5px] font-bold uppercase tracking-wider text-white/90">
                    Sponsored
                  </span>
                  <span className="text-[9px] text-white/60">via {channelHandle}</span>
                </div>

                {mediaUrl ? (
                  <div className="mb-1.5 aspect-[1.6/1] overflow-hidden rounded-lg bg-black/40">
                    <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}

                <p className="text-[12.5px] font-semibold leading-snug text-white">{channelName}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-snug text-white/95">
                  {text || <span className="italic text-white/50">Seu texto aparecerá aqui…</span>}
                </p>
                {description && (
                  <p className="mt-1 text-[11px] leading-snug text-white/75">{description}</p>
                )}

                {buttonLabel && (
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-white/10 px-2.5 py-2 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    {buttonLabel}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}

                <div className="mt-1 flex items-center justify-end gap-1 text-[9.5px] text-white/70">
                  <span>{time}</span>
                  <Ticks phase={phase} />
                </div>
              </div>
            </div>

            {/* Typing indicator from recipient */}
            {simulateDelivery && phase >= 3 && phase < 4 && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-[#182533] px-3 py-2 shadow">
                  <span className="inline-flex gap-1">
                    <Dot delay="0s" /><Dot delay=".15s" /><Dot delay=".3s" />
                  </span>
                </div>
              </div>
            )}

            {/* Auto-reply from recipient */}
            {simulateDelivery && phase === 4 && (
              <div className="flex justify-start animate-[fade-in_0.3s_ease-out]">
                <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-[#182533] p-2 text-white shadow">
                  <p className="text-[12px] leading-snug">Opa, vou conferir agora 🚀</p>
                  <p className="mt-0.5 text-right text-[9.5px] text-white/55">{time}</p>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-1.5 border-t border-black/40 bg-[#17212B] px-2 py-1.5">
            <Smile className="h-5 w-5 text-white/45" />
            <div className="flex-1 rounded-full bg-[#242F3D] px-3 py-1 text-[11px] text-white/45">Mensagem</div>
            <Paperclip className="h-5 w-5 text-white/45" />
            <Mic className="h-5 w-5 text-white/45" />
          </div>
        </div>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
        {simulateDelivery ? "Pré-visualização do disparo em tempo real" : "Pré-visualização ao vivo no Telegram"}
      </p>
    </div>
  );
}

function Ticks({ phase }: { phase: 0 | 1 | 2 | 3 | 4 }) {
  if (phase === 0) {
    // clock icon
    return (
      <svg viewBox="0 0 12 12" className="h-3 w-3 text-white/60"><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" /></svg>
    );
  }
  const cyan = phase >= 3;
  return (
    <svg viewBox="0 0 16 12" className="h-3 w-4" fill="none" stroke={cyan ? "#5BC8F7" : "rgba(255,255,255,0.7)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7l3 3 6-7" />
      {phase >= 2 && <path d="M6 10l1 0M9 10l5-7" />}
    </svg>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" style={{ animationDelay: delay }} />;
}
