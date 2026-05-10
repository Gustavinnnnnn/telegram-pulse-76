// Custom logo mark — paper-plane / send glyph reimagined as ad pulse.
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lg-tele" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.69 0.15 230)" />
          <stop offset="100%" stopColor="oklch(0.84 0.16 178)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#lg-tele)" />
      <path
        d="M11 19.5 L29 12 L25.5 29 L20 23.5 L16.5 27 L17.2 22 L11 19.5 Z"
        fill="white"
        fillOpacity="0.96"
      />
      <circle cx="30" cy="11" r="3.2" fill="oklch(0.78 0.18 158)" stroke="oklch(0.155 0.02 240)" strokeWidth="1.2" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[15px] font-bold tracking-tight ${className}`}>
      tele<span className="text-gradient-primary">Ads</span>
      <span className="ml-1 align-top text-[9px] font-semibold text-muted-foreground">PRO</span>
    </span>
  );
}
