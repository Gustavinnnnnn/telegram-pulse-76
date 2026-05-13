import logoSrc from "@/assets/noctra-logo.png";

// Noctra brand mark — logo já contém o nome, não acompanhar wordmark.
export function Logo({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoSrc}
      alt="Noctra"
      className={`block object-contain ${className}`}
      style={{
        height: size,
        width: "auto",
        filter: "drop-shadow(0 0 18px color-mix(in oklab, var(--primary) 55%, transparent))",
      }}
    />
  );
}

// Wordmark mantido como no-op pra compatibilidade com imports existentes.
export function Wordmark(_: { className?: string }) {
  return null;
}
