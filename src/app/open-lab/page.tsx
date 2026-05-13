import Header from '@/components/Header';

export default function OpenLabPage() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container">
          <div className="card">
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', borderBottom: '2px solid var(--primary)', paddingBottom: '12px', display: 'inline-block' }}>
              OPEN LAB 신청
            </h1>
            
            <div style={{ backgroundColor: '#EFF6FF', padding: '16px', borderRadius: '6px', marginBottom: '32px', border: '1px solid #DBEAFE' }}>
              <p style={{ fontSize: '0.875rem', color: '#1E40AF', fontWeight: '500' }}>
                ※ 신청 전 반드시 [이용 안내]를 숙지하시기 바랍니다. 무단 불참 시 향후 이용에 제한이 있을 수 있습니다.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              {/* Form Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>신청 일자</label>
                  <input type="date" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>희망 시간</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'white' }}>
                    <option>시간을 선택하세요</option>
                    <option>09:00 - 11:00</option>
                    <option>11:00 - 13:00</option>
                    <option>13:00 - 15:00</option>
                    <option>15:00 - 17:00</option>
                    <option>17:00 - 19:00 (야간)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>사용 목적</label>
                  <textarea rows={4} placeholder="간호술기 연습 항목 등 구체적인 사유를 입력하세요." style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'none' }}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button className="btn-primary" style={{ flex: 1, padding: '12px' }}>신청하기</button>
                  <button className="btn-outline" style={{ flex: 1, padding: '12px' }}>취소</button>
                </div>
              </div>

              {/* Info Section */}
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '40px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>신청 가능 인원 현황</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.875rem' }}>제 {i} 실습실</span>
                      <span style={{ fontSize: '0.8125rem', color: i % 2 === 0 ? '#DC2626' : 'var(--primary)', fontWeight: '600' }}>
                        {i % 2 === 0 ? '마감' : '3명 가능'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
