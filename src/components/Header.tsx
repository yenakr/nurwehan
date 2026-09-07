'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { isAdminRole } from '@/lib/auth-core';
import LogoutButton from './LogoutButton';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setActiveDropdown(null);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLoggedIn = !!user;
  const isAdmin = isAdminRole(user?.role);
  const userName = user?.name || '';

  const categories = [
    {
      title: '학업 & 캘린더',
      key: 'academic',
      items: [
        { label: 'MY ROADMAP', href: '/roadmap', desc: '1~4학년 학업·진로 로드맵' },
        { label: '캘린더', href: '/calendar', desc: '통합 학사 및 시험 일정' },
      ],
    },
    {
      title: '실습 & OPEN LAB',
      key: 'clinical',
      items: [
        { label: 'OPEN LAB 신청', href: '/open-lab', desc: '실습실 및 기자재 자율연습 신청' },
        { label: '임상실습 가이드', href: '/clinical', desc: '건강요건 및 실습전후 체크' },
        { label: '신청서 작성 내역', href: '/history', desc: '내 OPEN LAB 신청 확인' },
      ],
    },
    {
      title: '진로 & 캠퍼스',
      key: 'career',
      items: [
        { label: '취업 준비', href: '/career', desc: '어학 및 병원 채용 일정' },
        { label: '학부연구 & 비교과', href: '/campus', desc: '연구실 Open Lab 및 장학' },
        { label: '유틸리티 도구', href: '/tools', desc: '지원서 작성 도우미 모음' },
      ],
    },
  ];

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--white)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        className="container"
        ref={dropdownRef}
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo width={110} />
            <span className="logo-text">NUR위한</span>
          </Link>

          <nav className="desktop-nav">
            <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0, alignItems: 'center' }}>
              <li>
                <Link
                  href="/"
                  className={`nav-btn ${pathname === '/' ? 'active' : ''}`}
                >
                  HOME
                </Link>
              </li>

              {categories.map(cat => {
                const isCatActive = cat.items.some(i => pathname?.startsWith(i.href));
                const isOpen = activeDropdown === cat.key;

                return (
                  <li
                    key={cat.key}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setActiveDropdown(cat.key)}
                  >
                    <button
                      onClick={() => setActiveDropdown(isOpen ? null : cat.key)}
                      className={`nav-btn ${isCatActive ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {cat.title}
                      <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div
                        className="dropdown-panel"
                        onMouseLeave={() => setActiveDropdown(null)}
                      >
                        {cat.items.map(subItem => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="dropdown-item"
                            onClick={() => setActiveDropdown(null)}
                          >
                            <span className="dropdown-label">{subItem.label}</span>
                            <span className="dropdown-desc">{subItem.desc}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}

              <li>
                <Link
                  href="/mypage"
                  className={`nav-btn ${pathname === '/mypage' ? 'active' : ''}`}
                >
                  마이페이지
                </Link>
              </li>

              {isAdmin && (
                <li>
                  <Link href="/admin" className="admin-link">
                    관리자
                  </Link>
                </li>
              )}
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

      {/* Mobile Menu Accordion Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <Link href="/" style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--primary)' }}>
                  HOME
                </Link>
              </li>

              {categories.map(cat => (
                <li key={cat.key} style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--sub-text)', marginBottom: '8px' }}>
                    {cat.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                    {cat.items.map(subItem => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}

              <li style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <Link href="/mypage" style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                  마이페이지
                </Link>
              </li>

              {isAdmin && (
                <li>
                  <Link href="/admin" className="admin-link">
                    관리자 대시보드
                  </Link>
                </li>
              )}

              {isLoggedIn && (
                <li style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
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
          padding-left: 10px;
        }
        .desktop-nav {
          display: none;
        }
        .desktop-nav :global(.nav-btn) {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text);
          background: none;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .desktop-nav :global(.nav-btn:hover) {
          color: var(--primary);
          background-color: var(--muted-background);
        }
        .desktop-nav :global(.nav-btn.active) {
          color: var(--primary);
          font-weight: 800;
          background-color: rgba(14, 74, 132, 0.06);
        }
        .dropdown-panel {
          position: absolute;
          top: 100%;
          left: 0;
          width: 240px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 1100;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .desktop-nav :global(.dropdown-item) {
          display: flex;
          flex-direction: column;
          padding: 10px 12px;
          border-radius: 6px;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .desktop-nav :global(.dropdown-item:hover) {
          background-color: var(--muted-background);
        }
        .desktop-nav :global(.dropdown-label) {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text);
        }
        .desktop-nav :global(.dropdown-desc) {
          font-size: 0.75rem;
          color: var(--sub-text);
          margin-top: 2px;
        }
        .admin-link {
          color: #DC2626 !important;
          font-weight: 800 !important;
          font-size: 0.875rem;
          padding: 8px 12px;
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
          padding: 20px 24px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          max-height: calc(100vh - 64px);
          overflow-y: auto;
        }
        
        @media (min-width: 900px) {
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
