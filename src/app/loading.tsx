export default function Loading() {
  return (
    <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <span className="ld-spin" role="status" aria-label="불러오는 중" />
      <style>{`
        .ld-spin { width: 28px; height: 28px; border-radius: 50%; border: 3px solid rgba(127,127,127,.25); border-top-color: var(--primary); animation: ldspin .8s linear infinite; }
        @keyframes ldspin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .ld-spin { animation-duration: 2.4s; } }
      `}</style>
    </main>
  );
}
