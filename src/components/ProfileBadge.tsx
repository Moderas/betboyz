interface Props {
  text: string;
  index: number;
}

const SHAME_COLORS = [
  { bg: 'rgba(255, 87, 87, 0.1)', border: 'rgba(255, 87, 87, 0.3)', text: '#ff5757' },
  { bg: 'rgba(245, 200, 66, 0.1)', border: 'rgba(245, 200, 66, 0.3)', text: '#f5c842' },
  { bg: 'rgba(154, 87, 255, 0.1)', border: 'rgba(154, 87, 255, 0.3)', text: '#b87fff' },
];

export default function ProfileBadge({ text, index }: Props) {
  const colors = SHAME_COLORS[index % SHAME_COLORS.length];
  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '0.6rem 0.9rem',
        fontSize: '0.88rem',
        color: colors.text,
        lineHeight: 1.4,
      }}
    >
      😬 {text}
    </div>
  );
}
