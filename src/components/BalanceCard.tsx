import { Wifi } from "lucide-react";
import { Logo } from "./Logo";

export function BalanceCard({ balance, accountId }: { balance: number; accountId: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl gradient-card-virtual p-5 text-white shadow-[0_20px_50px_-15px_rgba(34,158,217,0.45)]">
      {/* Mesh shimmer */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-20 h-40 w-40 rounded-full bg-cyan/40 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-sm font-bold tracking-tight">teleAds</span>
        </div>
        <Wifi className="h-5 w-5 rotate-90 opacity-70" />
      </div>

      <div className="relative mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Saldo disponível</p>
        <p className="mt-1 font-display text-4xl font-bold tabular tracking-tight">
          R$ {balance.toFixed(2).replace(".", ",")}
        </p>
      </div>

      <div className="relative mt-6 flex items-end justify-between text-[11px]">
        <div>
          <p className="text-white/50 uppercase tracking-wider text-[9px]">Conta</p>
          <p className="font-mono font-semibold tracking-widest">TLG · {accountId}</p>
        </div>
        <div className="text-right">
          <p className="text-white/50 uppercase tracking-wider text-[9px]">Status</p>
          <p className="font-semibold text-success">● Ativa</p>
        </div>
      </div>
    </div>
  );
}
