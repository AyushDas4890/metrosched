/**
 * MetroSched mark: three stabling lines; the middle one leaves the depot through a chevron.
 * The idea: one decision per train, inducting it into service.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--plate)" />
      <path d="M7 10h11M7 22h11" stroke="var(--plate-ink)" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <path d="M7 16h14" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 11.5 25 16l-5 4.5" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-condensed text-[1.6rem] font-bold leading-none tracking-[-0.01em]">MetroSched</span>
    </span>
  );
}
