'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Notice {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export default function NoticeManager({ initial }: { initial: Notice[] }) {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>(initial);
  const [editing, setEditing] = useState<Notice | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = (n: Notice | 'new') => {
    setEditing(n);
    setTitle(n === 'new' ? '' : n.title);
    setContent(n === 'new' ? '' : n.content);
    setPinned(n === 'new' ? false : n.isPinned);
  };

  const save = async () => {
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 입력해 주세요.');
    setBusy(true);
    try {
      const isNew = editing === 'new';
      const res = await fetch(isNew ? '/api/admin/notices' : `/api/admin/notices/${(editing as Notice).id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, isPinned: pinned }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || '저장하지 못했어요.');
      setNotices(prev => (isNew ? [data, ...prev] : prev.map(n => (n.id === data.id ? data : n))));
      setEditing(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async (n: Notice) => {
    const res = await fetch(`/api/admin/notices/${n.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !n.isPinned }),
    });
    if (res.ok) {
      setNotices(prev => prev.map(x => (x.id === n.id ? { ...x, isPinned: !n.isPinned } : x)));
      router.refresh();
    }
  };

  const remove = async (n: Notice) => {
    if (!confirm(`"${n.title}" 공지를 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/notices/${n.id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotices(prev => prev.filter(x => x.id !== n.id));
      router.refresh();
    }
  };

  return (
    <div className="nm">
      {editing ? (
        <div className="editor">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" maxLength={200} autoFocus />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용" rows={10} />
          <label className="pin">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
            상단 고정
          </label>
          <div className="btns">
            <button className="cancel" onClick={() => setEditing(null)}>취소</button>
            <button className="save" onClick={save} disabled={busy}>{busy ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      ) : (
        <>
          <button className="new" onClick={() => open('new')}>+ 새 공지</button>
          <div className="list">
            {notices.map(n => (
              <div key={n.id} className="row">
                <div className="main">
                  <div className="t">
                    {n.isPinned && <span className="pin-tag">고정</span>}
                    {n.title}
                  </div>
                  <div className="d">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</div>
                </div>
                <div className="acts">
                  <button onClick={() => togglePin(n)}>{n.isPinned ? '고정 해제' : '고정'}</button>
                  <button onClick={() => open(n)}>수정</button>
                  <button className="danger" onClick={() => remove(n)}>삭제</button>
                </div>
              </div>
            ))}
            {notices.length === 0 && <div className="empty">공지가 없어요.</div>}
          </div>
        </>
      )}

      <style jsx>{`
        .nm { display: flex; flex-direction: column; gap: 12px; }
        .new { align-self: flex-start; background: var(--primary); color: #fff; border: none; border-radius: 10px; padding: 9px 16px; font-size: 0.875rem; font-weight: 800; cursor: pointer; }
        .list { background: var(--background); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-top: 1px solid #f1f5f9; }
        .row:first-child { border-top: none; }
        .main { flex: 1; min-width: 0; }
        .t { font-weight: 800; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pin-tag { font-size: 0.6875rem; font-weight: 800; color: var(--primary); background: #e0ecf8; border-radius: 999px; padding: 2px 8px; margin-right: 6px; }
        .d { font-size: 0.8125rem; color: #94a3b8; margin-top: 2px; }
        .acts { display: flex; gap: 2px; flex: 0 0 auto; }
        .acts button { background: none; border: none; padding: 5px 7px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; color: var(--sub-text); cursor: pointer; white-space: nowrap; }
        .acts button:hover { background: #f1f5f9; color: var(--text); }
        .acts .danger:hover { background: #fee2e2; color: #b91c1c; }
        .empty { text-align: center; color: #94a3b8; padding: 40px 12px; }
        .editor { display: flex; flex-direction: column; gap: 10px; background: var(--background); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
        .editor input[type='text'], .editor input:not([type]), .editor textarea { width: 100%; padding: 11px 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 0.9375rem; background: var(--background); color: var(--text); }
        .editor textarea { resize: vertical; line-height: 1.6; }
        .pin { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; font-weight: 600; color: var(--text); }
        .btns { display: flex; justify-content: flex-end; gap: 8px; }
        .btns button { border-radius: 10px; padding: 9px 18px; font-size: 0.875rem; font-weight: 800; cursor: pointer; border: 1px solid transparent; }
        .cancel { background: transparent; color: var(--sub-text); border-color: var(--border) !important; }
        .save { background: var(--primary); color: #fff; }
        .save:disabled { opacity: 0.6; }
        @media (max-width: 520px) {
          .row { flex-direction: column; align-items: stretch; gap: 6px; }
          .acts { justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
}
