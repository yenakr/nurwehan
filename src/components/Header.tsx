'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { isAdminRole } from '@/lib/auth-core';
import LogoutButton from './LogoutButton';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const isLoggedIn = !!user;
  const isAdmin = isAdminRole(user?.role);
  const userName = user?.name || '';

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--white)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo width={150} />
            <span style={{ 
              fontSize: '1.125rem', 
              fontWeight: '800', 
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              borderLeft: '1px solid var(--border)',
              paddingLeft: '12px'
            }}>
              NUR위한
            </span>
          </Link>
          
          <nav className="desktop-nav hide-mobile">
            <ul style={{ display: 'flex', gap: '20px' }}>
              <li><Link href="/open-lab" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>OPEN LAB 신청</Link></li>
              <li><Link href="/history" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>신청 내역</Link></li>
              <li><Link href="/notices" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>공지사항</Link></li>
              <li><Link href="/mypage" style={{ fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sub-text)' }}>마이페이지</Link></li>
              {isAdmin && <li><Link href="/admin" style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--primary)' }}>관리자</Link></li>}
            </ul>
          </nav>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!loading && (
            isLoggedIn ? (
              <>
                <span className="hide-mobile" style={{ fontSize: '0.875rem', fontWeight: '500' }}>{userName}님</span>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.875rem' }}>
                로그인
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
