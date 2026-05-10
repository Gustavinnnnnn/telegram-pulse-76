// Faithful Telegram chat-bubble preview of a sponsored message.
// Used in the create-campaign wizard and the campaign overview.
import { ExternalLink } from "lucide-react";

interface Props {
  channelName?: string;
  channelHandle?: string;
  text: string;
  description?: string;
  buttonLabel?: string;
  mediaUrl?: string;
}

export function TelegramAdPreview({
  channelName = "Sponsored",
  channelHandle = "@telegram",
  text,
  description,
  buttonLabel,
  mediaUrl,
}: Props) {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Phone bezel */}
      <div className="relative rounded-[36px] border border-border-strong bg-surface-1 p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
        <div className="overflow-hidden rounded-[30px] bg-[oklch(0.2_0.025_240)]">
          {/* Telegram header */}
          <div className="flex items-center gap-2.5 bg-[oklch(0.235_0.026_236)] px-3 py-2.5 border-b border-black/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-xs font-bold text-white">
              {channelName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white">{channelName}</p>
              <p className="truncate text-[10px] text-white/50">{channelHandle}</p>
            </div>
            <span className="text-[10px] text-white/40">agora</span>
          </div>

          {/* Chat area with TG-like pattern */}
          <div
            className="relative min-h-[280px] px-3 py-4"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 10%, oklch(0.32 0.06 240 / 0.4), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.28 0.08 200 / 0.35), transparent 45%), linear-gradient(180deg, oklch(0.18 0.02 240), oklch(0.16 0.02 240))",
            }}
          >
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[oklch(0.5_0.16_220)] p-2.5 shadow-md">
              {/* Sponsored badge */}
              <div className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-white/70">
                <span className="rounded-sm bg-white/20 px-1 py-px">Sponsored</span>
              </div>

              {mediaUrl ? (
                <div className="mb-2 aspect-video overflow-hidden rounded-lg bg-black/30">
                  <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="mb-2 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/0 text-[10px] text-white/40">
                  mídia opcional
                </div>
              )}

              <p className="whitespace-pre-wrap text-[12.5px] leading-snug text-white">
                {text || <span className="italic text-white/40">Seu texto aparecerá aqui…</span>}
              </p>
              {description && (
                <p className="mt-1 text-[11px] leading-snug text-white/80">{description}</p>
              )}

              {buttonLabel && (
                <button
                  type="button"
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-2 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/25"
                >
                  {buttonLabel}
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}

              <p className="mt-1.5 text-right text-[9px] text-white/50">12:34 ✓✓</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Pré-visualização ao vivo no app Telegram
      </p>
    </div>
  );
}
