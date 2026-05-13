import Image from 'next/image';

export default function GuideSection() {
  const steps = [
    { title: '신청 기간', desc: '매주 금요일 13:00 ~ 차주 운영일 전일 17:00' },
    { title: '신청 방법', desc: 'OPEN LAB 신청 메뉴에서 희망 일시 및 기자재 선택' },
    { title: '주의 사항', desc: '실습실 내 음식물 반입 금지 및 사용 후 원상복구 필수' },
  ];

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="section-title">
          <span>이용 안내</span>
        </div>
        <div style={{ marginTop: '-15px', marginRight: '-5px' }}>
          <Image 
            src="/hylion-nursing.png" 
            alt="하리온 캐릭터" 
            width={60} 
            height={60} 
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ padding: '4px' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                fontSize: '0.6875rem' 
              }}>{idx + 1}</span>
              {step.title}
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: '1.5' }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
