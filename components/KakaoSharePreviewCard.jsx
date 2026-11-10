'use client';

export default function KakaoSharePreviewCard({ invitation }) {
  const groomName = invitation?.groom_name || '신랑';
  const brideName = invitation?.bride_name || '신부';
  const coupleText = `${groomName} ♥ ${brideName}`;

  // 대표 이미지: cover 우선 -> main -> fallback
  const rawImage =
    invitation?.images?.cover ||
    invitation?.images?.main ||
    invitation?.images?.couple_profile ||
    '/samples/main-01-garden.jpg';

  const dateStr = invitation?.wedding_date
    ? invitation.wedding_date.replace('T', ' ').slice(0, 16)
    : '2026. 12. 12 (토) 14:00';

  const venueStr = [invitation?.venue_name, invitation?.venue_hall]
    .filter(Boolean)
    .join(' ') || '아틀리에 웨딩홀 라포레홀';

  return (
    <div className="w-full h-full min-h-[500px] bg-[#B2C7D9] p-4 sm:p-6 flex flex-col items-center justify-center select-none overflow-y-auto">
      
      {/* 카카오톡 날짜 뱃지 */}
      <div className="inline-block px-3 py-1 bg-black/15 text-white/95 rounded-full text-[10.5px] font-sans font-medium mb-6 shadow-2xs">
        카카오톡 대화방 미리보기
      </div>

      {/* 카카오톡 메시지 단위 (프로필 + 말풍선 카드) */}
      <div className="w-full max-w-[340px] flex items-start gap-2.5">
        
        {/* 프로필 아바타 */}
        <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-amber-800 text-sm font-bold shrink-0 shadow-2xs">
          💌
        </div>

        {/* 메시지 본체 */}
        <div className="flex-1 space-y-1">
          {/* 보낸 사람 이름 */}
          <span className="text-[11.5px] text-slate-800 font-medium block">
            {coupleText}
          </span>

          {/* 카카오 공유 카드 (말풍선) */}
          <div className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/5 transition-all">
            
            {/* 1. 대표 썸네일 이미지 (카카오톡 1.91:1 공식 와이드 비율) */}
            <div className="w-full aspect-[1.91/1] bg-stone-100 relative overflow-hidden">
              <img
                src={rawImage}
                alt="카카오톡 청첩장 공유 썸네일"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/samples/main-01-garden.jpg';
                }}
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[9.5px] font-mono text-white/90">
                1.91 : 1
              </div>
            </div>

            {/* 2. 텍스트 영역 (타이틀 & 일시 & 장소) */}
            <div className="p-3.5 space-y-1">
              <h4 className="text-[13.5px] font-bold text-[#111111] leading-snug line-clamp-1">
                {coupleText} 결혼합니다
              </h4>
              <p className="text-[11.5px] text-[#444444] leading-relaxed line-clamp-1 font-medium">
                {dateStr}
              </p>
              <p className="text-[11px] text-[#777777] leading-relaxed line-clamp-1">
                {venueStr}
              </p>
              <p className="text-[10.5px] text-[#999999] pt-0.5">
                소중한 분들을 초대합니다.
              </p>
            </div>

            {/* 3. 하단 링크 버튼 */}
            <div className="p-2.5 pt-0">
              <div className="w-full py-2 bg-[#FEE500] hover:bg-[#ffe812] text-[#191919] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
                <span>모바일 청첩장 열기</span>
                <span className="text-[10px]">➔</span>
              </div>
            </div>

          </div>

          {/* 전송 시간 */}
          <span className="text-[10px] text-slate-600 block text-right pt-0.5">
            오후 12:30
          </span>
        </div>

      </div>

      {/* 하단 안심 안내 가이드 팁 */}
      <div className="mt-8 max-w-[340px] w-full p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 text-left space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <span>💡</span>
          <span>카카오톡 전송 시 자동 적용</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed break-keep">
          지인과 하객들에게 카카오톡으로 청첩장 링크를 전송했을 때 위와 동일한 말풍선 카드로 표시됩니다. 대표 사진(메인/커버)과 예식 일시가 잘리지 않고 가장 예쁜 비율로 자동 조율됩니다.
        </p>
      </div>

    </div>
  );
}
