import Link from 'next/link';
import Header from '@/components/Header';
import Logo from '@/components/Logo';
import Image from 'next/image';

export default function Home() {
  // TODO: 실제 상태 연동
  const isLoggedIn = false;
  const approvalStatus = 'pending'; // pending, approved, rejected

  return (
    <>
      <Header />
      
      <main style={{ flex: 1, backgroundColor: 'var(--white)', padding: '60px 0' }}>
        <div className="container">
          
          {/* Hero / Application Section */}
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            backgroundColor: 'var(--muted-background)',
            borderRadius: '8px',
            marginBottom: '48px',
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>
              한양대학교 간호대학 OPEN LAB 신청
            </h2>
            <p style={{ color: 'var(--sub-text)', marginBottom: '32px', fontSize: '1rem' }}>
              안전하고 효율적인 실습실 사용을 위해 신청 수칙을 반드시 준수해 주시기 바랍니다.
            </p>
            
            <Link href="/open-lab" className="btn-accent">
              OPEN LAB 신청하기
            </Link>
            
            {!isLoggedIn && (
              <p style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--sub-text)' }}>
                * 로그인이 필요한 서비스입니다.
              </p>
            )}
            
            {isLoggedIn && approvalStatus === 'pending' && (
              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '4px', fontSize: '0.875rem', display: 'inline-block' }}>
                현재 관리자 승인 대기 중입니다. 승인 완료 후 신청이 가능합니다.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            
            {/* Notice Section */}
            <section>
              <h3 className="section-title">
                <span>OPEN LAB 사용 시 공지사항</span>
              </h3>
              <div className="card" style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text)' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>3. 신청 방법</h4>
                  <ul style={{ paddingLeft: '16px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Open lab 진행할 인원을 모아 조를 구성하고, 한 명이 대표로 신청서를 작성합니다.</li>
                    <li>한 타임에 최대 2가지 술기까지 신청 가능합니다.</li>
                    <li>학생 1명당 <strong>주 1회</strong> 신청 가능합니다. (동일 학생이 중복 신청 불가)</li>
                    <li>신청은 선착순으로 마감됩니다.</li>
                    <li>불참 또는 시작 30분 이후 참여 시 <strong>2주간 신청 및 참여가 불가</strong>합니다.</li>
                  </ul>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>4. 신청 기간</h4>
                  <ul style={{ paddingLeft: '16px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Open lab 날짜 일주일 전부터 공휴일 제외 이틀 전까지 신청합니다.</li>
                    <li>월요일 신청은 전 주 금요일 오전까지 가능합니다.</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>7. 유의 사항</h4>
                  <ul style={{ paddingLeft: '16px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>마지막 10분은 정리를 실시합니다.</li>
                    <li><strong>정리 상태 불량 3회 적발 시</strong> 해당 조원 모두 이용이 불가합니다.</li>
                    <li>일반의료 폐기물과 손상성 폐기물을 반드시 구별하여 폐기합니다.</li>
                    <li>밀폐되는 텀블러 외 음료 반입 및 섭취를 금지합니다.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* My Recent History (Visible only when logged in) */}
            <section>
              <h3 className="section-title">
                <span>최근 내 신청 내역</span>
              </h3>
              <div className="card">
                {isLoggedIn ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>날짜</th>
                          <th>시간</th>
                          <th>상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>2026-05-20</td>
                          <td>13:00 - 15:00</td>
                          <td><span className="badge badge-pending">승인대기</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub-text)' }}>
                    <p style={{ fontSize: '0.875rem' }}>로그인 후 신청 내역을 확인할 수 있습니다.</p>
                    <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '12px', display: 'inline-block' }}>로그인하기</Link>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Image 
                  src="/hylion-nursing.png" 
                  alt="하리온" 
                  width={120} 
                  height={120} 
                  style={{ opacity: 0.6 }}
                />
              </div>
            </section>

          </div>
        </div>
      </main>
      
      <footer style={{ 
        backgroundColor: 'var(--muted-background)', 
        borderTop: '1px solid var(--border)', 
        padding: '60px 0',
        color: 'var(--sub-text)',
        fontSize: '0.8125rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '12px', fontSize: '0.9375rem' }}>한양대학교 간호대학</p>
              <p>서울특별시 성동구 왕십리로 222 한양대학교 간호대학 행정팀</p>
              <p>TEL: 02-2220-XXXX | FAX: 02-2220-XXXX</p>
              <p style={{ marginTop: '24px', opacity: 0.8 }}>© 2026 Hanyang University College of Nursing. All Rights Reserved.</p>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontWeight: '500' }}>
              <a href="#">개인정보처리방침</a>
              <a href="#">이용약관</a>
              <a href="#">이메일무단수집거부</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
