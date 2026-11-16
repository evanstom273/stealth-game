// Icons are shapes (guide §10): an arrow for Jump, a glove for Grab, a half-shut eye for Sneak, scattered squares for Blink.

type P = { className?: string }

export const JumpIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="5,15 12,7 19,15" />
  </svg>
)

export const GrabIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="13.5" r="6.5" fill="#20202c" />
    <path d="M6.5 8.5 Q12 3 17.5 8.5" strokeLinecap="round" />
  </svg>
)

export const SneakIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 12 Q12 3.5 21.5 12 Q12 20.5 2.5 12Z" />
    <path d="M2.5 12 Q12 3.5 21.5 12Z" fill="currentColor" />
    <circle cx="13" cy="13.6" r="2.4" fill="currentColor" stroke="none" />
  </svg>
)

export const AttackIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="12" r="6.5" fill="currentColor" stroke="none" />
    <path d="M8 9.5 Q11 7.6 14 9.5" stroke="#14141c" strokeLinecap="round" />
    <path d="M18.5 7 L21.5 5.5 M19 12 L22.5 12 M18.5 17 L21.5 18.5" strokeLinecap="round" />
  </svg>
)

export const DodgeIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6,6 12,12 6,18" />
    <polyline points="13,6 19,12 13,18" opacity=".55" />
  </svg>
)

export const BlinkIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="4" y="13" width="4" height="4" />
    <rect x="10" y="9" width="4" height="4" opacity=".85" />
    <rect x="15" y="4" width="3.4" height="3.4" opacity=".7" />
    <rect x="17" y="12" width="3" height="3" opacity=".55" />
    <rect x="9" y="17" width="3" height="3" opacity=".65" />
    <rect x="5" y="6" width="2.6" height="2.6" opacity=".45" />
  </svg>
)
