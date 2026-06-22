export function Skeleton({ height = 20, width = '100%' }: { height?: number; width?: string | number }) {
  return (
    <div
      className="skeleton"
      style={{
        height: typeof height === 'number' ? height : undefined,
        width: typeof width === 'number' ? width : undefined,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton height={18} width="60%" />
      <Skeleton height={14} width="40%" />
      <Skeleton height={36} />
    </div>
  );
}
