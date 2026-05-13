'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: formData.studentId,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('회원가입이 완료되었습니다! 로그인 해주세요.');
        router.push('/login');
      } else {
        setError(data.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '8px' }}>회원가입</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>NUR위한 시스템 이용을 위해 가입해주세요.</p>
          </div>
          
          {error && (
            <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>학번</label>
              <input 
                type="text" 
                required
                placeholder="202XXXXXXX" 
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>이름</label>
              <input 
                type="text" 
                required
                placeholder="홍길동" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>비밀번호</label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', marginBottom: '6px' }}>비밀번호 확인</label>
              <input 
                type="password" 
                required
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px' }} 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary" 
              style={{ padding: '12px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--sub-text)' }}>
            이미 계정이 있으신가요? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>로그인</Link>
          </div>
        </div>
      </main>
    </>
  );
}
