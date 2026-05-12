import { cn } from "@/lib/utils";
import { SUPPORT } from "@/lib/support";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.555-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.683 5.522l-.99 3.617 3.796-.838zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/>
  </svg>
);

export function WhatsAppButton({
  variant = "solid",
  size = "md",
  label,
  className,
}: {
  variant?: "solid" | "outline" | "ghost" | "pill";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const sizes = {
    sm: "h-8 px-3 text-[11px] gap-1.5",
    md: "h-10 px-4 text-[13px] gap-2",
    lg: "h-12 px-5 text-[14px] gap-2",
  } as const;
  const variants = {
    solid: "bg-[#25D366] text-white hover:bg-[#1ebe5a] shadow-lg shadow-[#25D366]/25",
    outline: "border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10",
    ghost: "text-[#25D366] hover:bg-[#25D366]/10",
    pill: "rounded-full bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 border border-[#25D366]/30",
  } as const;
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <a
      href={SUPPORT.whatsappGroupUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-bold transition",
        sizes[size],
        variants[variant],
        className,
      )}
    >
      <WhatsAppIcon className={iconSize} />
      <span>{label ?? "Suporte WhatsApp"}</span>
    </a>
  );
}

// Floating action button — para colocar fixo em qualquer tela
export function WhatsAppFab() {
  return (
    <a
      href={SUPPORT.whatsappGroupUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={SUPPORT.whatsappLabel}
      className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40 transition hover:scale-110 md:bottom-6 md:right-6 md:h-14 md:w-14"
    >
      <WhatsAppIcon className="h-6 w-6 md:h-7 md:w-7" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#25D366]" />
      </span>
    </a>
  );
}
