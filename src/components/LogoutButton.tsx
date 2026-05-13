'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Logout error:', err);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className="btn-outline" 
      style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
    >
      로그아웃
    </button>
  );
}
