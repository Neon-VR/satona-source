type Props = {
  compact?: boolean;
};

export default function SatonaLogo({ compact = false }: Props) {
  return (
    <div className={`satona-logo ${compact ? "compact" : ""}`}>
      <img src="/satona-logo.png" alt="" />
      {!compact && <span>Satona</span>}
    </div>
  );
}
