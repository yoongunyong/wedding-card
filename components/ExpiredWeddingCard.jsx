'use client';

export default function ExpiredWeddingCard({ invitation }) {
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const coupleName = [groomName, brideName].filter(Boolean).join(' & ');
  
  // 예식 일시 포맷
  const formattedDate = (() => {
    if (!invitation?.wedding_date) return '';
    try {
      const d = new Date(invitation.wedding_date.replace(' ', 'T'));
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    } catch {
      return '';
    }
  })();

  const endingImage = 
    invitation?.images?.cover || 
    invitation?.images?.main || 
    invitation?.images?.ending || 
    '';

  return (
    <div 
      className="min-h-screen w-full bg-[#F6F5F2] flex items-center justify-center p-4 font-sans text-stone-900 selection:bg-stone-200 antialiased"
      style={{ colorScheme: 'light' }}
    >
      <div className="w-full max-w-[430px] bg-white rounded-3xl p-8 sm:p-10 text-center shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-stone-200/80 overflow-hidden relative">
        
        {/* 상단 레이블 */}
        <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-stone-400 mb-3">
          ATELIER DE MUKIRU · ARCHIVE
        </p>

        {/* 웨딩 대표 썸네일 (은은한 흑백 감성) */}
        {endingImage && (
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-2 border-stone-100 shadow-xs">
            <img 
              src={endingImage} 
              alt="Wedding Archive" 
              className="w-full h-full object-cover grayscale opacity-90"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-serif text-stone-900 font-normal tracking-tight mb-2">
          서비스 기간이 만료되었습니다
        </h1>
        
        <p className="text-xs text-stone-400 font-mono tracking-widest uppercase mb-6">
          SERVICE PERIOD COMPLETED (1 YEAR)
        </p>

        <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/70 mb-6 text-left">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-400">주인공</span>
            <span className="font-semibold text-stone-900">{coupleName || '신랑 & 신부'}</span>
          </div>
          {formattedDate && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">예식일자</span>
              <span className="font-mono text-stone-600">{formattedDate}</span>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-[13px] text-stone-600 font-light leading-relaxed mb-8 break-keep">
          두 분의 소중했던 예식이 성황리에 마무리되었으며,<br />
          안내된 서비스 보증 기간(예식일로부터 1년)이 만료되어<br />
          청첩장 열람 및 참석자 기능이 안전하게 종료되었습니다.<br /><br />
          축복해 주신 모든 분들께 진심으로 감사드리며,<br />
          두 분의 앞날에 늘 행복과 사랑이 가득하기를 기원합니다.
        </p>

        <div className="pt-6 border-t border-stone-100 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">
            ATELIER DE MUKIRU
          </span>
          <span className="text-[9px] text-stone-300 font-light">
            아름다운 순간을 기록하는 감성 모바일 청첩장
          </span>
        </div>

      </div>
    </div>
  );
}
