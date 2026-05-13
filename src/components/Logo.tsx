import logoSrc from "@/assets/noctra-logo.png";

// Noctra brand mark — uses the official logo image.
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoSrc}
      width={size}
      height={size}
      alt="Noctra"
      className={`block object-contain ${className}`}
      style={{ width: size, height: size, filter: "drop-shadow(0 0 12px color-mix(in oklab, var(--primary) 45%, transparent))" }}
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[15px] font-bold tracking-tight ${className}`}>
      Noc<span className="text-gradient-primary">tra</span>
    </span>
  );
}
