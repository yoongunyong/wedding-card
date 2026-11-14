'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * PlaylistIntro (시안 3 플레이리스트 시그니처 커버 화면)
 * 
 * [피그마 CSS 실측 1:1 정밀 구현 (2x 780x1386 -> 1x 390x693)]:
 * - 캔버스: width 780px, height 1386px (2x 기준) -> 1x 390px * 693px
 * - 카드 배경: #FEFEFE (플레이리스트 본문과 100% 심리스 연결)
 * - 상단: 신랑이름('장민기') --- 구분선(border #999999) --- 신부이름('권기득') ('NanumMyeongjo' 34px -> 17px, #292929)
 * - 커버 화보: 618px * 863px -> 309px * 431.5px (화면 높이에 맞춰 비율 유지하며 반응형 스케일)
 *   - 이미지 내부 하단: 'Getting married' ('Ownglyph corncorn' 70px -> 35px, #FEFEFE)
 *   - 이미지 좌측 바깥(왼쪽 하단 맞춤): '서울 크리스탈 볼룸 1층' (사진 왼쪽 밖 mr-[8px], bottom-0, rotate -90deg, 'NanumMyeongjo' 24px -> 11.5px, #333333)
 *   - 이미지 우측 바깥(오른쪽 상단 맞춤): '2027.May 15. 14:00 pm' (사진 오른쪽 밖 ml-[8px], top-0, rotate 90deg, 'NanumMyeongjo' 24px -> 11.5px, #666666, letter-spacing 0.04em)
 * - 뮤직 플레이어 UI (width 309px, 사진 너비와 1:1 일치):
 *   - 로딩 바: height 2px, #292929 + 재생 점(8px 원형)
 *   - 시간 표시: 0:16 / 3:37 ('Pretendard' 10px, #292929)
 *   - 메인 컨트롤(5분할): 하트 라인, 이전곡(|◀), 재생 원형버튼(56px, #292929, 일시정지 바 2개 ||), 다음곡(▶|), 더보기(⋯)
 *   - 보조 컨트롤: 셔플(🔀), 반복재생(🔁)
 * - 하단 문구: '화면을 터치해주세요' ('NanumMyeongjo' 10px, #666666, letter-spacing 0.09em)
 * - 인터랙션: 화면 터치 시 부드러운 페이드아웃 + BGM 자동 재생 트리거('play-wedding-bgm') 후 본문 진입
 */
export default function PlaylistIntro({
  invitation,
  onOpen,
  isInModal: propIsInModal,
}) {
  const [transitionStep, setTransitionStep] = useState('idle'); // 'idle' | 'darkening' | 'revealing'
  const isInModal = Boolean(propIsInModal ?? invitation?.is_modal_preview);
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'playlist');

  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  // 1. 신랑 & 신부 성함 (피그마 예: 장민기, 권기득)
  const groomName = invitation?.groom_name || (isSample ? '장민기' : '');
  const brideName = invitation?.bride_name || (isSample ? '권기득' : '');

  // 2. 커버 이미지 (고객 등록 사진 최우선, 미등록 시 main 또는 샘플)
  const coverImage =
    images.cover ||
    invitation?.cover_image ||
    extra.cover_image ||
    images.main ||
    invitation?.main_image ||
    images.couple_profile ||
    (isSample ? '/samples/main-03-playlist.jpg' : '');

  // 3. 배경 이미지 (커버 사진 10% 줌인 매핑)
  const coverBgImage = coverImage || (isSample ? '/samples/main-03-playlist.jpg' : '');

  // 4. 예식장 장소 (피그마 예: 서울 크리스탈 볼룸 1층)
  const venueText = useMemo(() => {
    const hall = config.venue_hall || invitation?.venue_hall;
    const parts = [invitation?.venue_name, hall].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return isSample ? '서울 크리스탈 볼룸 1층' : '';
  }, [invitation?.venue_name, config.venue_hall, invitation?.venue_hall, isSample]);

  // 5. 날짜 포맷 (피그마 예: 2027.May 15. 14:00 pm)
  const weddingDateStr = invitation?.wedding_date || (isSample ? '2027-05-15 14:00:00' : '');
  const formattedDate = useMemo(() => {
    if (!weddingDateStr) return isSample ? '2027.May 15. 14:00 pm' : '';
    const normalized = typeof weddingDateStr === 'string'
      ? weddingDateStr.replace(' ', 'T')
      : weddingDateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return isSample ? '2027.May 15. 14:00 pm' : '';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const y = d.getFullYear();
    const m = months[d.getMonth()];
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period = hours < 12 ? 'am' : 'pm';
    const hourStr = String(hours).padStart(2, '0');

    return `${y}.${m} ${day}. ${hourStr}:${minutes} ${period}`;
  }, [weddingDateStr, isSample]);

  // 6. 스크롤 락 및 최상단 고정
  useEffect(() => {
    const isInsideModal = isInModal || (typeof document !== 'undefined' && Boolean(document.getElementById('preview-scroll-container')));
    if (isInsideModal) return;

    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      if (typeof window !== 'undefined' && !isInsideModal) {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      }
    };
  }, [isInModal]);

  // 7. 반응형 자동 스케일 (390px * 693px 피그마 1:1 규격을 모든 화면 및 모달에서 왜곡 없이 정확히 유지)
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (typeof window === 'undefined') return;
      const targetW = 390;
      const targetH = 693;
      const container = isInModal ? document.getElementById('preview-scroll-container') : null;
      const availableW = container ? container.clientWidth : window.innerWidth;
      const availableH = container ? container.clientHeight : window.innerHeight;

      // 뷰포트 너비나 높이가 390x693보다 작을 경우 완벽하게 비율 축소
      const scaleX = availableW / targetW;
      const scaleY = availableH / targetH;
      const calculated = Math.min(1, scaleX, scaleY);
      setScale(calculated < 1 ? calculated : 1);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isInModal]);

  // 8. 화면 터치 시 시네마틱 암전(Blink) 본문 진입 & BGM 자동 재생 시작 (시안 1, 2와 100% 동일한 3단계 트랜지션)
  const handleOpen = () => {
    if (transitionStep !== 'idle') return;

    if (typeof document !== 'undefined' && document.activeElement) {
      document.activeElement.blur();
    }

    // BGM 재생 이벤트 발생 (하객의 첫 인터랙션 시 자동 재생 정책 충족)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('play-wedding-bgm'));
    }

    // 1단계: 화면이 서서히 어두워짐 (800ms)
    setTransitionStep('darkening');

    // 2단계: 화면이 완전히 어두워진 시점(850ms) 후 본문 드러내기 시작
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.focus();
      }
      setTransitionStep('revealing');

      // 3단계: 어둠이 안개처럼 걷힌 후 인트로 언마운트
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
          window.scrollTo(0, 0);
        }
        if (typeof document !== 'undefined') {
          const previewContainer = document.getElementById('preview-scroll-container');
          if (previewContainer) {
            previewContainer.scrollTop = 0;
          }
        }
        if (onOpen) onOpen();
      }, 1250);
    }, 850);
  };

  return (
    <>
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleOpen();
          }
        }}
        className={`${
          isInModal
            ? 'absolute inset-0 z-20'
            : 'fixed inset-0 z-50'
        } w-full h-full overflow-hidden flex items-center justify-center cursor-pointer select-none bg-[#1C1C1C] ${
          transitionStep === 'revealing'
            ? 'hidden pointer-events-none'
            : transitionStep === 'darkening'
            ? 'opacity-100 pointer-events-none'
            : 'opacity-100'
        }`}
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      >
      {/* 1. 데스크톱/와이드 화면 배경 (커버 화보 10% 줌인 + #1C1C1C 어두운 틴트) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-40">
        {coverBgImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverBgImage}
            alt="Background"
            className="w-full h-full object-cover scale-[1.10] blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-[#1C1C1C]/75" />
      </div>

      {/* 2. 중앙 화이트 플레이리스트 카드 (피그마 1:1 실측 절대좌표: 780x1386 -> 1x 390x693) */}
      <div 
        className="relative z-10 w-[390px] h-[693px] shrink-0 overflow-hidden bg-[#FEFEFE] text-stone-900 shadow-2xl sm:rounded-[24px]"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {/* 상단: 신랑 성함 --- 구분선 --- 신부 성함 (Figma: top 93px -> 46.5px, width 568px -> 284px) */}
        <div 
          className="absolute flex items-center justify-between"
          style={{
            top: '46.5px',
            left: 'calc(50% - 142px)',
            width: '284px',
            height: '19.5px',
          }}
        >
          <span
            className="font-nanummyeongjo text-[17px] leading-[19.5px] text-[#292929] text-center w-[58px] truncate"
            style={{ fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif" }}
          >
            {groomName}
          </span>
          <div className="flex-1 mx-3 border-t border-[#999999]" />
          <span
            className="font-nanummyeongjo text-[17px] leading-[19.5px] text-[#292929] text-center w-[58px] truncate"
            style={{ fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif" }}
          >
            {brideName}
          </span>
        </div>

        {/* 중앙: 커버 화보 (image 770: Figma 618x863 -> 1x 309x431.5, top 171px -> 85.5px) */}
        <div 
          className="absolute"
          style={{
            top: '85.5px',
            left: 'calc(50% - 154.5px)',
            width: '309px',
            height: '431.5px',
          }}
        >
          {/* 사진 래퍼 (overflow-hidden) */}
          <div className="relative w-full h-full bg-stone-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Playlist Wedding Cover"
              className="w-full h-full object-cover object-center select-none"
            />

            {/* 이미지 내부 하단: 'Getting married' (Figma: top 941px -> 470.5px, Ownglyph corncorn 70px -> 35px, #FEFEFE) */}
            <div className="absolute inset-x-0 bottom-[22px] flex items-center justify-center pointer-events-none select-none z-10 px-4">
              <span
                className="font-ownglyph text-[35px] text-[#FEFEFE] leading-none text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] tracking-normal"
                style={{
                  fontFamily: "'Ownglyph corncorn', 'OngleipKonkon', 'Caveat', cursive",
                }}
              >
                Getting married
              </span>
            </div>
          </div>

          {/* 좌측 세로 텍스트: 예식장 (사진 왼쪽 바깥 여백에 위치, 사진 하단 라인과 일치, 회전 -90deg) */}
          {venueText && (
            <div 
              className="absolute pointer-events-none select-none z-20 whitespace-nowrap"
              style={{
                left: '-6px',
                bottom: '0px',
                transformOrigin: '0 100%',
                transform: 'rotate(-90deg)',
              }}
            >
              <span
                className="font-nanummyeongjo text-[11px] leading-none text-[#333333] tracking-normal"
                style={{ fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif" }}
              >
                {venueText}
              </span>
            </div>
          )}

          {/* 우측 세로 텍스트: 예식 일시 (사진 오른쪽 바깥 여백에 위치, 사진 상단 라인과 일치, 회전 90deg) */}
          {formattedDate && (
            <div 
              className="absolute pointer-events-none select-none z-20 whitespace-nowrap"
              style={{
                left: 'calc(100% + 6px)',
                top: '0px',
                transformOrigin: '0 0',
                transform: 'rotate(90deg) translateY(-100%)',
              }}
            >
              <span
                className="font-nanummyeongjo text-[11px] leading-none text-[#666666] tracking-[0.04em]"
                style={{ fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif" }}
              >
                {formattedDate}
              </span>
            </div>
          )}
        </div>

        {/* 하단: 로딩 바 (Figma: top 1087px -> 543.5px, width 619px -> 309.5px, border 2.5px solid #292929) */}
        <div 
          className="absolute bg-[#292929] rounded-full"
          style={{
            top: '543.5px',
            left: 'calc(50% - 154.5px)',
            width: '309px',
            height: '2px',
          }}
        >
          {/* 재생 점 (Figma: top 1078px -> 539px, size 18px -> 9px) */}
          <div
            className="absolute rounded-full bg-[#292929] shadow-xs"
            style={{
              top: '-3.5px',
              left: '7%',
              width: '9px',
              height: '9px',
            }}
          />
        </div>

        {/* 시간 표시 (0:16 / 3:37 - Figma: top 1101px -> 550.5px, width 309px) */}
        <div 
          className="absolute flex items-center justify-between text-[10px] text-[#292929] font-sans tracking-[0.04em]"
          style={{
            top: '550.5px',
            left: 'calc(50% - 154.5px)',
            width: '309px',
          }}
        >
          <span>0:16</span>
          <span>3:37</span>
        </div>

        {/* 5대 플레이어 컨트롤러 (Figma: top 1122px -> 561px, width 309px) */}
        <div 
          className="absolute flex items-center justify-between"
          style={{
            top: '561px',
            left: 'calc(50% - 154.5px)',
            width: '309px',
          }}
        >
          {/* 하트 아이콘 (Figma bi:suit-heart 1:1) */}
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[#292929]">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
              <path d="m8 6.236-.894-1.789c-.222-.443-.607-1.08-1.152-1.595C5.418 2.345 4.776 2 4 2 2.324 2 1 3.326 1 4.92c0 1.211.554 2.066 1.868 3.37.337.334.721.695 1.146 1.093C5.122 10.423 6.5 11.717 8 13.447c1.5-1.73 2.878-3.024 3.986-4.064.425-.398.81-.76 1.146-1.093C14.446 6.986 15 6.131 15 4.92 15 3.326 13.676 2 12 2c-.777 0-1.418.345-1.954.852-.545.515-.93 1.152-1.152 1.595zm.392 8.292a.513.513 0 0 1-.784 0c-1.601-1.902-3.05-3.262-4.243-4.381C1.3 8.208 0 6.989 0 4.92 0 2.755 1.79 1 4 1c1.6 0 2.719 1.05 3.404 2.008.26.365.458.716.596.992a7.6 7.6 0 0 1 .596-.992C9.281 2.049 10.4 1 12 1c2.21 0 4 1.755 4 3.92 0 2.069-1.3 3.288-3.365 5.227-1.193 1.12-2.642 2.48-4.243 4.38z"/>
            </svg>
          </div>

          {/* 이전 곡 아이콘 (Figma bi:skip-start-fill 1:1) */}
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[#292929]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.5 3.5A.5.5 0 0 0 4 4v8a.5.5 0 0 0 1 0V4a.5.5 0 0 0-.5-.5z"/>
              <path d="M4.903 8.697l6.364 3.692c.54.313 1.232-.066 1.232-.697V4.308c0-.63-.692-1.01-1.232-.696L4.903 7.304a.802.802 0 0 0 0 1.393z"/>
            </svg>
          </div>

          {/* 재생 버튼 큰 동그라미 (Figma: 112px x 112px -> 1x 56px x 56px, bg #292929, 일시정지 바 2개 #FAFAFA) */}
          <div className="w-[56px] h-[56px] rounded-full bg-[#292929] shadow-md flex items-center justify-center transition-transform active:scale-95 shrink-0">
            <div className="flex items-center gap-[5.5px]">
              <div className="w-[3.4px] h-[18.5px] bg-[#FAFAFA] rounded-xs" />
              <div className="w-[3.4px] h-[18.5px] bg-[#FAFAFA] rounded-xs" />
            </div>
          </div>

          {/* 다음 곡 아이콘 (Figma bi:skip-end-fill 1:1) */}
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[#292929]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.693 3.3 4 3.678 4 4.308v7.384c0 .63.692 1.01 1.233.697L11.5 8.753V12a.5.5 0 0 0 1 0z"/>
            </svg>
          </div>

          {/* 더보기 버튼 (...) (Figma bi:three-dots 1:1) */}
          <div className="w-[32px] h-[32px] flex items-center justify-center text-[#292929]">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
          </div>
        </div>

        {/* 셔플 & 반복재생 (Figma: top 1249px -> 624.5px, width 309px) */}
        <div 
          className="absolute flex items-center justify-between text-[#292929]"
          style={{
            top: '624.5px',
            left: 'calc(50% - 154.5px)',
            width: '309px',
          }}
        >
          {/* 셔플 (하트 바로 밑에 정렬 - Figma bi:shuffle 1:1) */}
          <div className="w-[32px] h-[28px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z"/>
              <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192zm0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192z"/>
            </svg>
          </div>

          {/* 반복재생 (더보기 바로 밑에 정렬 - Figma bi:repeat 1:1) */}
          <div className="w-[32px] h-[28px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41-.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z"/>
            </svg>
          </div>
        </div>

        {/* 바닥 안내 문구: '화면을 터치해주세요' (Figma: top 1339px -> 669.5px) */}
        <div 
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{
            top: '662px',
          }}
        >
          <p
            className="font-nanummyeongjo text-[11px] leading-none text-[#292929] tracking-[0.09em] text-center animate-pulse"
            style={{ fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif" }}
          >
            화면을 터치해주세요
          </p>
        </div>
      </div>
    </div>

    {/* 2. 시네마틱 껌뻑(Blink / Fade to black) 암전 오버레이 */}
    <div
      className={`${isInModal ? 'absolute inset-0 z-30' : 'fixed inset-0 z-[60]'} bg-black pointer-events-none transition-opacity ${
        transitionStep === 'darkening'
          ? 'opacity-100 duration-[800ms] ease-in-out'
          : transitionStep === 'revealing'
          ? 'opacity-0 duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
          : 'opacity-0 duration-0'
      }`}
    />
  </>
  );
}
