'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { isAdminRole } from '@/lib/auth-core';
import LogoutButton from './LogoutButton';
import { usePathname } from 'next/navigation';
export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isLoggedIn = !!user;
  const isAdmin = isAdminRole(user?.role);
  const userName = user?.name || '';

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--white)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container" style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo width={120} />
            <span className="logo-text">NUR위한</span>
          </Link>
          
          <nav className="desktop-nav">
            <ul>
              <li><Link href="/open-lab">OPEN LAB 신청</Link></li>
              <li><Link href="/history">신청 내역</Link></li>
              <li><Link href="/notices">공지사항</Link></li>
              <li><Link href="/mypage">마이페이지</Link></li>
              {isAdmin && <li><Link href="/admin" className="admin-link">관리자</Link></li>}
            </ul>
          </nav>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!loading && (
            isLoggedIn ? (
              <>
                <span className="user-name-label">
                  {userName}{userName === '시스템 관리자' ? '' : '님'}
                </span>
                <div className="hide-mobile">
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link href="/login" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.875rem' }}>
                로그인
              </Link>
            )
          )}
          
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav>
            <ul>
              <li><Link href="/open-lab">OPEN LAB 신청</Link></li>
              <li><Link href="/history">신청 내역</Link></li>
              <li><Link href="/notices">공지사항</Link></li>
              <li><Link href="/mypage">마이페이지</Link></li>
              {isAdmin && <li><Link href="/admin" className="admin-link">관리자</Link></li>}
              {isLoggedIn && (
                <li style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <LogoutButton />
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}

      <style jsx>{`
        .logo-text {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.02em;
          border-left: 1px solid var(--border);
          padding-left: 12px;
        }
        .desktop-nav {
          display: none;
        }
        .desktop-nav ul {
          display: flex;
          gap: 24px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .desktop-nav a {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--sub-text);
          text-decoration: none;
          transition: color 0.2s;
        }
        .desktop-nav a:hover {
          color: var(--primary);
        }
        .admin-link {
          color: var(--primary) !important;
          font-weight: 800 !important;
        }
        .user-name-label {
          display: none;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .mobile-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text);
        }
        .mobile-menu {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid var(--border);
          padding: 24px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .mobile-menu ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .mobile-menu a {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text);
          text-decoration: none;
          display: block;
        }
        
        @media (min-width: 768px) {
          .desktop-nav { display: block; }
          .mobile-toggle { display: none; }
          .user-name-label { display: inline; }
        }
        @media (max-width: 480px) {
          .logo-text { display: none; }
        }
      `}</style>
    </header>
  );
}
