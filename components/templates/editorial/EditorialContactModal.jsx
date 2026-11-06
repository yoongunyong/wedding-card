'use client';

import { useEffect } from 'react';

export default function EditorialContactModal({ invitation, onClose }) {
  const config = invitation?.template_config || {};
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'editorial');

  const isGroomFatherDeceased = invitation?.groom_father_deceased ?? config.groom_father_deceased ?? false;
  const isGroomMotherDeceased = invitation?.groom_mother_deceased ?? config.groom_mother_deceased ?? false;
  const isBrideFatherDeceased = invitation?.bride_father_deceased ?? config.bride_father_deceased ?? false;
  const isBrideMotherDeceased = invitation?.bride_mother_deceased ?? config.bride_mother_deceased ?? false;

  const formatName = (name, isDeceased) => {
    if (!name) return '';
    return isDeceased ? `故 ${name}` : name;
  };

  // 모달 활성화 시 배경 스크롤 방지 및 ESC 키 닫기 이벤트 핸들링
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 피그마 실측 Group 1113 기준 6명 인물 순서 및 신랑측/신부측 테마 분기
  const contacts = [
    // 1. 신랑측 (블루 테마: 라벨 & 아이콘 #4C62A2, 성함 #575757 Bold)
    {
      role: '신랑',
      side: 'groom',
      name: invitation?.groom_name || (isSample ? '권기득' : ''),
      phone: invitation?.groom_phone || (isSample ? '010-2345-6789' : ''),
    },
    {
      role: '신랑 아버지',
      side: 'groom',
      name: formatName(invitation?.groom_father, isGroomFatherDeceased) || (isSample ? '권순민' : ''),
      phone: isGroomFatherDeceased ? '' : (invitation?.groom_father_phone || (isSample ? '010-2345-6789' : '')),
    },
    {
      role: '신랑 어머니',
      side: 'groom',
      name: formatName(invitation?.groom_mother, isGroomMotherDeceased) || (isSample ? '이미자' : ''),
      phone: isGroomMotherDeceased ? '' : (invitation?.groom_mother_phone || (isSample ? '010-3456-7890' : '')),
    },
    // 2. 신부측 (로즈 핑크 테마: 라벨 #DB84A8, 아이콘 #D25C8D, 성함 #575757 Bold)
    {
      role: '신부',
      side: 'bride',
      name: invitation?.bride_name || (isSample ? '장민기' : ''),
      phone: invitation?.bride_phone || (isSample ? '010-8765-4321' : ''),
    },
    {
      role: '신부 아버지',
      side: 'bride',
      name: formatName(invitation?.bride_father, isBrideFatherDeceased) || (isSample ? '장철규' : ''),
      phone: isBrideFatherDeceased ? '' : (invitation?.bride_father_phone || (isSample ? '010-8765-4321' : '')),
    },
    {
      role: '신부 어머니',
      side: 'bride',
      name: formatName(invitation?.bride_mother, isBrideMotherDeceased) || (isSample ? '이정자' : ''),
      phone: isBrideMotherDeceased ? '' : (invitation?.bride_mother_phone || (isSample ? '010-7654-3210' : '')),
    },
  ].filter((p) => p.name || p.phone);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 피그마 실측 모달 전체: 너비 643px -> 1x 321.5px, 높이 1183px -> 1x 591.5px, rounded-[20px], bg-white */}
      <div
        className="bg-white w-[322px] max-w-[92vw] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] relative select-none animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 우측 상단 닫기 X 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[22px] right-[22px] w-[26px] h-[26px] flex items-center justify-center text-[#999999] hover:text-[#333333] transition-colors cursor-pointer select-none"
          aria-label="닫기"
        >
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        {/* 헤더: 타이틀 '연락처' (Figma: NanumSquare Neo OTF 34px -> 1x 17px, #333333, pt-[55.5px]) & 구분선 (Line 127: 너비 546px -> 1x 273px, mt-[28.5px], border: 1px solid #999999) */}
        <div className="pt-[55.5px] text-center">
          <h3 className="font-nanumsquare text-[17px] text-[#333333] font-normal tracking-tight leading-none">
            연락처
          </h3>
          <div className="w-[273px] mx-auto border-t border-[#999999] mt-[28.5px]" />
        </div>

        {/* 인물 리스트 (Figma Group 1113: 너비 524px -> 1x 262px 중앙 정렬, mt-[37.5px], pb-[50px], space-y-[20px]) */}
        <div className="w-[262px] mx-auto mt-[37.5px] pb-[50px] space-y-[20px]">
          {contacts.map((person, idx) => {
            const isGroom = person.side === 'groom';
            const roleColorClass = isGroom ? 'text-[#4C62A2]' : 'text-[#DB84A8]';
            const iconColorClass = isGroom ? 'text-[#4C62A2]' : 'text-[#D25C8D]';

            return (
              <div key={idx} className="h-[48px] flex items-center justify-between">
                {/* 좌측: 역할(NanumSquare Neo 14px) + 성함(NanumSquare Neo Bold 17px #575757) */}
                <div className="flex flex-col text-left justify-center">
                  <span className={`text-[14px] font-nanumsquare font-normal ${roleColorClass} tracking-tight leading-none mb-[6px] select-none`}>
                    {person.role}
                  </span>
                  <span className="font-nanumsquare text-[17px] text-[#575757] font-bold tracking-tight leading-none">
                    {person.name}
                  </span>
                </div>

                {/* 우측: 원형 버튼 2개 (Figma: 너비 96px -> 1x 48px, bg #F4F3F1, gap 42px -> 1x 21px) */}
                <div className="flex items-center gap-[21px] shrink-0">
                  {person.phone ? (
                    <>
                      {/* 전화 걸기 원형 버튼 (피그마 솔리드 수화기 아이콘) */}
                      <a
                        href={`tel:${person.phone.replace(/[^0-9+]/g, '')}`}
                        aria-label={`${person.name} 전화걸기`}
                        title="전화 걸기"
                        className={`w-[48px] h-[48px] rounded-full bg-[#F4F3F1] ${iconColorClass} flex items-center justify-center transition-all duration-200 cursor-pointer hover:opacity-85 active:scale-95`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.93c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.05z" />
                        </svg>
                      </a>

                      {/* 문자 보내기 원형 버튼 (피그마 솔리드 2줄 말풍선 아이콘) */}
                      <a
                        href={`sms:${person.phone.replace(/[^0-9+]/g, '')}`}
                        aria-label={`${person.name} 문자보내기`}
                        title="문자 보내기"
                        className={`w-[48px] h-[48px] rounded-full bg-[#F4F3F1] ${iconColorClass} flex items-center justify-center transition-all duration-200 cursor-pointer hover:opacity-85 active:scale-95`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 11H7v-2h10v2zm0-4H7V7h10v2z" />
                        </svg>
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] font-nanumsquare text-stone-300">연락처 미등록</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
