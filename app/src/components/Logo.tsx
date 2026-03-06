export default function Logo({ size = 28, wordmark = false }: { size?: number; wordmark?: boolean }) {
  if (wordmark) {
    // Full wordmark: "Hormesis" with stylized H
    const scale = size / 32;
    return (
      <span
        className="inline-flex items-center gap-0 font-bold tracking-tight select-none"
        style={{ fontSize: `${size}px`, lineHeight: 1 }}
      >
        {/* Custom H with rising crossbar */}
        <svg
          width={size * 0.75}
          height={size}
          viewBox="0 0 24 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block"
          style={{ marginRight: `-${2 * scale}px` }}
        >
          {/* Left pillar */}
          <line x1="4" y1="6" x2="4" y2="28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          {/* Right pillar */}
          <line x1="20" y1="6" x2="20" y2="28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          {/* Rising crossbar — the hormesis curve */}
          <line x1="4" y1="19" x2="20" y2="13" stroke="#22c55e" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
        <span className="relative" style={{ left: `${2 * scale}px` }}>
          ormesis
        </span>
      </span>
    );
  }

  // Symbol only: H with rising crossbar
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Hormesis"
    >
      <line x1="7" y1="5" x2="7" y2="27" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="25" y1="5" x2="25" y2="27" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="7" y1="19" x2="25" y2="12" stroke="#22c55e" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
