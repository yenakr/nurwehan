'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '8px' }}>로그인</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>NUR위한 시스템에 오신 것을 환영합니다.</p>
      </div>
      
      {error && (
        <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '16px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>학번 (또는 관리자 ID)</label>
          <input 
            type="text" 
            required
            placeholder="학번을 입력하세요" 
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            style={{ width: '100%' }} 
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>비밀번호</label>
          <input 
            type="password" 
            required
            placeholder="비밀번호를 입력하세요" 
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ width: '100%' }} 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary" 
          style={{ padding: '14px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
        <Link href="#">비밀번호 초기화</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <Link href="/register">회원가입</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
