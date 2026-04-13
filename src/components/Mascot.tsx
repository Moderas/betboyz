interface MascotProps {
  size?: number;
  animate?: boolean;
}

export default function Mascot({ size = 64, animate = true }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      style={
        animate
          ? { animation: 'mascot-bounce 2.8s ease-in-out infinite', flexShrink: 0 }
          : { flexShrink: 0 }
      }
      aria-label="Baron von Bet mascot"
    >
      {/* ── Coin body ── */}
      <circle cx="50" cy="65" r="36" fill="#f5c842" stroke="#c49b28" strokeWidth="3" />
      <circle
        cx="50"
        cy="65"
        r="30"
        fill="none"
        stroke="#c49b28"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />

      {/* Shekel symbol */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill="#9a7010"
        fontFamily="serif"
      >
        ₪
      </text>

      {/* ── Top hat ── */}
      <rect x="28" y="15" width="44" height="30" rx="3" fill="#1a1208" />
      {/* Hat brim */}
      <rect x="20" y="42" width="60" height="7" rx="2" fill="#0f0803" />
      {/* Gold hat band */}
      <rect x="28" y="37" width="44" height="6" fill="#f5c842" opacity="0.75" />

      {/* ── Face ── */}
      {/* Left eye */}
      <circle cx="38" cy="61" r="4.5" fill="#1a1208" />
      <circle cx="39.5" cy="59.5" r="1.5" fill="white" />
      {/* Right eye */}
      <circle cx="62" cy="61" r="4.5" fill="#1a1208" />
      <circle cx="63.5" cy="59.5" r="1.5" fill="white" />

      {/* Monocle on right eye */}
      <circle
        cx="62"
        cy="61"
        r="7"
        fill="none"
        stroke="#c49b28"
        strokeWidth="1.8"
        style={{ animation: 'monocle-flash 4.5s ease-in-out infinite' }}
      />
      <line x1="68" y1="67" x2="72" y2="73" stroke="#c49b28" strokeWidth="1.8" />

      {/* Smile */}
      <path
        d="M 38 72 Q 50 81 62 72"
        fill="none"
        stroke="#9a7010"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Moustache */}
      <path
        d="M 40 75 Q 45 72 50 75 Q 55 72 60 75"
        fill="none"
        stroke="#9a7010"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* ── Arms ── */}
      <line x1="17" y1="76" x2="28" y2="72" stroke="#c49b28" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="83" y1="76" x2="72" y2="72" stroke="#c49b28" strokeWidth="3.5" strokeLinecap="round" />

      {/* ── White gloves ── */}
      <circle cx="13" cy="78" r="7" fill="white" stroke="#ddd" strokeWidth="1" />
      <circle cx="87" cy="78" r="7" fill="white" stroke="#ddd" strokeWidth="1" />
      {/* Glove finger hints */}
      <line x1="9" y1="74" x2="11" y2="71" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13" y1="71" x2="13" y2="68" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="17" y1="74" x2="19" y2="71" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="83" y1="74" x2="81" y2="71" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="87" y1="71" x2="87" y2="68" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="91" y1="74" x2="89" y2="71" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
