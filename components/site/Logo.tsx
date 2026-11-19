export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3.5 L28 9.5 L16 15.5 L4 9.5 Z" fill="#e0ecf9" stroke="#1d1b18" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 9.5 L16 15.5 L16 28.5 L4 22.5 Z" fill="#bcd3ef" stroke="#1d1b18" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M16 15.5 L28 9.5 L28 22.5 L16 28.5 Z" fill="#a7c3e7" stroke="#1d1b18" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="16" cy="9.5" r="2.2" fill="#f6b98a" stroke="#1d1b18" strokeWidth="1.3" />
    </svg>
  );
}
