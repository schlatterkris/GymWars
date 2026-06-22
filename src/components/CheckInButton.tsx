interface Props {
  checkedIn: boolean;
  streak: number;
  onCheckIn: () => void;
  loading: boolean;
}

export function CheckInButton({ checkedIn, streak, onCheckIn, loading }: Props) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <button
        className="btn btn-primary"
        onClick={onCheckIn}
        disabled={checkedIn || loading}
        style={{
          width: '100%', padding: '16px', fontSize: '1.1rem',
          opacity: checkedIn ? 0.6 : 1,
        }}
      >
        {loading ? '...' : checkedIn ? '✓ Checked In Today' : 'Check In'}
      </button>
      <p style={{ marginTop: 12, fontSize: '1.5rem', fontWeight: 700, color: 'var(--orange-500)' }}>
        {streak} day{streak !== 1 ? 's' : ''}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>workday streak</p>
    </div>
  );
}
