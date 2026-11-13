'use client';

import { useEffect } from 'react';
import ParentDeceasedName from '@/components/ParentDeceasedName';

export default function EditorialContactModal({ invitation, onClose, isNightMode = false }) {
  const config = invitation?.template_config || {};
  const isOfficialDemo = invitation?.slug === 'editorial';
  const hasUserEnteredNames = Boolean(invitation?.groom_name || invitation?.bride_name || invitation?.groom_father || invitation?.bride_father);
  const allowSampleFallback = isOfficialDemo || (!hasUserEnteredNames && Boolean(invitation?.is_sample_preview));

  const isGroomFatherDeceased = invitation?.groom_father_deceased ?? config.groom_father_deceased ?? false;
  const isGroomMotherDeceased = invitation?.groom_mother_deceased ?? config.groom_mother_deceased ?? false;
  const isBrideFatherDeceased = invitation?.bride_father_deceased ?? config.bride_father_deceased ?? false;
  const isBrideMotherDeceased = invitation?.bride_mother_deceased ?? config.bride_mother_deceased ?? false;
  const deceasedMarker = config.deceased_marker || invitation?.deceased_marker || 'hanja';

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

  // 신랑측 연락처
  const groomContacts = [
    {
      role: '신랑',
      side: 'groom',
      name: invitation?.groom_name || (allowSampleFallback ? '권기득' : ''),
      phone: invitation?.groom_phone || (allowSampleFallback ? '010-2345-6789' : ''),
    },
    {
      role: '신랑 아버지',
      side: 'groom',
      name: (invitation?.groom_father || allowSampleFallback) ? (
        <ParentDeceasedName
          name={invitation?.groom_father || (allowSampleFallback ? '권순민' : '')}
          isDeceased={isGroomFatherDeceased}
          markerType={deceasedMarker}
          iconClassName="w-[14px] h-[16px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0"
        />
      ) : '',
      phone: isGroomFatherDeceased ? '' : (invitation?.groom_father_phone || (allowSampleFallback ? '010-2345-6789' : '')),
    },
    {
      role: '신랑 어머니',
      side: 'groom',
      name: (invitation?.groom_mother || allowSampleFallback) ? (
        <ParentDeceasedName
          name={invitation?.groom_mother || (allowSampleFallback ? '이미자' : '')}
          isDeceased={isGroomMotherDeceased}
          markerType={deceasedMarker}
          iconClassName="w-[14px] h-[16px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0"
        />
      ) : '',
      phone: isGroomMotherDeceased ? '' : (invitation?.groom_mother_phone || (allowSampleFallback ? '010-3456-7890' : '')),
    },
  ].filter((p) => p.name || p.phone);

  // 신부측 연락처
  const brideContacts = [
    {
      role: '신부',
      side: 'bride',
      name: invitation?.bride_name || (allowSampleFallback ? '장민기' : ''),
      phone: invitation?.bride_phone || (allowSampleFallback ? '010-8765-4321' : ''),
    },
    {
      role: '신부 아버지',
      side: 'bride',
      name: (invitation?.bride_father || allowSampleFallback) ? (
        <ParentDeceasedName
          name={invitation?.bride_father || (allowSampleFallback ? '장철규' : '')}
          isDeceased={isBrideFatherDeceased}
          markerType={deceasedMarker}
          iconClassName="w-[14px] h-[16px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0"
        />
      ) : '',
      phone: isBrideFatherDeceased ? '' : (invitation?.bride_father_phone || (allowSampleFallback ? '010-8765-4321' : '')),
    },
    {
      role: '신부 어머니',
      side: 'bride',
      name: (invitation?.bride_mother || allowSampleFallback) ? (
        <ParentDeceasedName
          name={invitation?.bride_mother || (allowSampleFallback ? '이정자' : '')}
          isDeceased={isBrideMotherDeceased}
          markerType={deceasedMarker}
          iconClassName="w-[14px] h-[16px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0"
        />
      ) : '',
      phone: isBrideMotherDeceased ? '' : (invitation?.bride_mother_phone || (allowSampleFallback ? '010-7654-3210' : '')),
    },
  ].filter((p) => p.name || p.phone);

  const hasAnyContacts = groomContacts.length > 0 || brideContacts.length > 0;

  // 인물 항목 렌더러
  const renderContactRow = (person, idx) => {
    const isGroom = person.side === 'groom';
    const roleColor = isGroom
      ? (isNightMode ? 'text-[#8BA4C4]' : 'text-[#486581]')
      : (isNightMode ? 'text-[#D495A7]' : 'text-[#9B5C70]');

    const btnBg = isGroom
      ? (isNightMode
          ? 'bg-stone-800 hover:bg-stone-700 text-[#9FB7D4]'
          : 'bg-[#F0F4F8] hover:bg-[#E2EAF1] text-[#486581]')
      : (isNightMode
          ? 'bg-stone-800 hover:bg-stone-700 text-[#DBA2B4]'
          : 'bg-[#FAF2F4] hover:bg-[#F3E5E9] text-[#9B5C70]');

    return (
      <div key={idx} className="flex items-center justify-between min-h-[44px]">
        {/* 좌측: 역할 라벨 & 성함 */}
        <div className="flex flex-col text-left justify-center pr-3">
          <span className={`text-[12px] font-nanumsquare font-medium ${roleColor} tracking-tight leading-none mb-1 select-none`}>
            {person.role}
          </span>
          <span className={`font-nanumsquare text-[15.5px] font-normal tracking-tight leading-snug transition-colors duration-200 ${
            isNightMode ? 'text-stone-100' : 'text-[#292929]'
          }`}>
            {person.name}
          </span>
        </div>

        {/* 우측: 원형 버튼 2개 또는 미등록 뱃지 */}
        <div className="flex items-center shrink-0">
          {person.phone ? (
            <div className="flex items-center gap-2">
              {/* 전화 걸기 원형 버튼 */}
              <a
                href={`tel:${person.phone.replace(/[^0-9+]/g, '')}`}
                aria-label={`${typeof person.name === 'string' ? person.name : person.role} 전화걸기`}
                title="전화 걸기"
                className={`w-[40px] h-[40px] rounded-full ${btnBg} flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs active:scale-95`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.93c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.05z" />
                </svg>
              </a>

              {/* 문자 보내기 원형 버튼 */}
              <a
                href={`sms:${person.phone.replace(/[^0-9+]/g, '')}`}
                aria-label={`${typeof person.name === 'string' ? person.name : person.role} 문자보내기`}
                title="문자 보내기"
                className={`w-[40px] h-[40px] rounded-full ${btnBg} flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs active:scale-95`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 11H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </a>
            </div>
          ) : (
            <span className={`text-[11px] font-nanumsquare font-normal px-2.5 py-1 rounded-full select-none transition-colors duration-200 ${
              isNightMode ? 'bg-stone-800 text-stone-400 border border-white/5' : 'bg-stone-100/80 text-stone-400'
            }`}>
              미등록
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200 ${
        isNightMode ? 'dark bg-black/70' : 'bg-black/55'
      } backdrop-blur-xs`}
      onClick={onClose}
    >
      {/* 럭셔리 모달 박스: no-scrollbar 적용 및 다크/라이트 완벽 전환 */}
      <div
        className={`w-[330px] max-w-[92vw] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative select-none animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto no-scrollbar border transition-colors duration-200 ${
          isNightMode
            ? 'bg-[#1C1C1C] text-stone-100 border-white/10'
            : 'bg-white text-[#292929] border-stone-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 단정한 헤더 (타이틀 & 닫기 버튼 수평 대칭 정렬) */}
        <div className={`pt-5 pb-3.5 px-6 border-b flex items-center justify-between transition-colors duration-200 ${
          isNightMode ? 'border-white/10' : 'border-stone-100'
        }`}>
          <div className="w-6" /> {/* 좌측 대칭용 공간 */}
          <h3 className={`font-nanumsquare text-[16.5px] font-medium tracking-tight leading-none ${
            isNightMode ? 'text-stone-100' : 'text-[#292929]'
          }`}>
            연락처
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`w-6 h-6 flex items-center justify-center transition-colors cursor-pointer select-none -mr-1 ${
              isNightMode ? 'text-stone-400 hover:text-stone-100' : 'text-stone-400 hover:text-stone-700'
            }`}
            aria-label="닫기"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {/* 인물 리스트 영역 */}
        <div className="px-6 py-5">
          {!hasAnyContacts ? (
            <div className={`py-10 text-center font-nanumsquare text-[13px] ${
              isNightMode ? 'text-stone-500' : 'text-stone-400'
            }`}>
              등록된 연락처 정보가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. 신랑측 그룹 */}
              {groomContacts.length > 0 && (
                <div className="space-y-3.5">
                  {groomContacts.map((person, idx) => renderContactRow(person, `groom-${idx}`))}
                </div>
              )}

              {/* 신랑측과 신부측 사이 은은한 디바이더 */}
              {groomContacts.length > 0 && brideContacts.length > 0 && (
                <div className={`w-full border-t my-4 transition-colors duration-200 ${
                  isNightMode ? 'border-white/10' : 'border-stone-100'
                }`} />
              )}

              {/* 2. 신부측 그룹 */}
              {brideContacts.length > 0 && (
                <div className="space-y-3.5">
                  {brideContacts.map((person, idx) => renderContactRow(person, `bride-${idx}`))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
