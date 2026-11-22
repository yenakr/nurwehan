'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getLeaveGuard } from '@/lib/leaveGuard';
import { confirmDialog } from '@/components/Dialog';

const HIDE = ['/login', '/register', '/find-pw'];

const I = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ITEMS = [
  { href: '/', label: '홈', icon: I('M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10') },
  { href: '/clinical', label: '실습 노트', icon: I('M5 4h11l3 3v13H5zM9 11h6M9 15h6') },
  { href: '/quiz', label: '퀴즈', icon: I('M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 17v.01') },
  { href: '/calendar', label: '캘린더', icon: I('M4 6h16v14H4zM4 10h16M8 3v4M16 3v4') },
  { href: '/mypage', label: '마이', icon: I('M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6') },
];

export default function BottomNav() {
  const path = usePathname() || '/';
  const router = useRouter();
  if (HIDE.some(h => path.startsWith(h))) return null;
  const on = (h: string) => (h === '/' ? path === '/' : path.startsWith(h));
  return (
    <>
      <nav className="bnav" aria-label="하단 메뉴">
        {ITEMS.map(it => (
          <Link
            key={it.href}
            href={it.href}
            className={on(it.href) ? 'on' : ''}
            aria-current={on(it.href) ? 'page' : undefined}
            onClick={e => {
              const g = getLeaveGuard();
              if (!g || on(it.href)) return;
              e.preventDefault();
              confirmDialog(g).then(ok => { if (ok) router.push(it.href); });
            }}
          >
            {it.icon}
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <style jsx global>{`
        .bnav { display: none; }
        @media (max-width: 991px) {
          :root { --bnav-h: calc(58px + env(safe-area-inset-bottom, 0px)); }
          body { height: auto; min-height: 100%; padding-bottom: var(--bnav-h); }
          .bnav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1100; height: var(--bnav-h); padding-bottom: env(safe-area-inset-bottom, 0px); display: flex; background: var(--white); border-top: 1px solid var(--border); }
          .bnav a { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; color: var(--sub-text); font-size: 11px; font-weight: 600; text-decoration: none; }
          .bnav a.on { color: var(--primary); }
        }
      `}</style>
    </>
  );
}
