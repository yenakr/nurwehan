'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('이 신청서를 삭제할까요? 복구할 수 없어요.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/applications');
        router.refresh();
      } else {
        alert('삭제하지 못했어요.');
      }
    } catch {
      alert('서버 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      style={{ padding: '8px 14px', fontSize: '0.8125rem', fontWeight: 700, color: '#c0392b', background: '#fff', border: '1px solid #f0c9c4', borderRadius: 8, cursor: 'pointer' }}
    >
      삭제
    </button>
  );
}
