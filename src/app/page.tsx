import Header from '@/components/Header';
import Logo from '@/components/Logo';
import NoticeList from '@/components/NoticeList';
import ScheduleSummary from '@/components/ScheduleSummary';
import LoginSection from '@/components/LoginSection';
import GuideSection from '@/components/GuideSection';

export default function Home() {
  return (
    <>
      <Header />
      
      <main style={{ flex: 1, backgroundColor: 'var(--muted-background)', padding: '40px 0' }}>
        <div className="container">
          {/* Main Grid Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 340px', 
            gap: '24px',
            alignItems: 'start'
          }}>
            
            {/* Left Column: Notices and Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '24px' 
              }}>
                <NoticeList />
                <ScheduleSummary />
              </div>
              
              <GuideSection />
              
              {/* Quick Links / Additional Info */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>실습실 및 기자재 사용신청</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--sub-text)' }}>기자재 대여 및 반납은 행정팀을 방문해 주시기 바랍니다.</p>
                  </div>
                  <button className="btn-primary">바로가기</button>
                </div>
              </div>
            </div>
            
            {/* Right Column: Login and Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <LoginSection />
              
              <div className="card" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                <h4 style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '12px' }}>오늘의 신청 현황</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800' }}>12</span>
                  <span style={{ fontSize: '0.875rem' }}>건 신청됨</span>
                </div>
              </div>

              <div className="card">
                <h4 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '12px' }}>담당자 연락처</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sub-text)' }}>간호대학 행정팀</span>
                    <span>02-2220-XXXX</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sub-text)' }}>실습 지원 센터</span>
                    <span>02-2220-XXXX</span>
                  </li>
                </ul>
              </div>
            </div>
            
          </div>
        </div>
      </main>
      
      <footer style={{ 
        backgroundColor: 'var(--white)', 
        borderTop: '1px solid var(--border)', 
        padding: '40px 0',
        color: 'var(--sub-text)',
        fontSize: '0.8125rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Logo width={160} className="mb-4" />
              <p>서울특별시 성동구 왕십리로 222 한양대학교 간호대학</p>
              <p style={{ marginTop: '16px' }}>© 2026 Hanyang University College of Nursing. All Rights Reserved.</p>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
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
