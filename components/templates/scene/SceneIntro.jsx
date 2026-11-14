'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * SceneIntro (시안 5 모던 씬 캠코더/뷰파인더 커버 화면)
 * 
 * [피그마 CSS 스펙 1:1 정밀 구현]:
 * - 전체 캔버스: width 780px, height 1386px (2x) -> 1x 390px * 693px (background: #1C1C1C)
 * - 뷰파인더 내부 영역: width 695px, height 1302px (top: 42px, left: 42.5px) -> 1x 347.5px * 651px (top: 21px, left: 21.25px)
 * - 4개 코너 브래킷 (Line 159 등): width 153px (1x 76.5px), border 4px solid #FEFEFE (1x 2px)
 * - 녹화 인디케이터:
 *   - 빨간 점: 24px * 24px (1x 12px), left 590px, top 84px (#F80602, animate-pulse)
 *   - REC: 'VCR OSD Mono' 32px (1x 16px), left 636px, top 84px (#FEFEFE)
 * - 신랑 & 신부 성함:
 *   - 권기득 (신부): 'NanumSquare Neo' 34px (1x 17px), top 142px (1x 71px), left: calc(50% - 97px/2 - 235.5px)
 *   - 장민기 (신랑): 'NanumSquare Neo' 34px (1x 17px), top 142px (1x 71px), left: calc(50% - 97px/2 + 235.5px)
 * - Our Wedding Day!: 'VCR OSD Mono' 60px (1x 30px), top 319px (1x 159.5px), #FEFEFE
 * - 중앙 포커싱 타겟 브래킷: width 38.25px (1x 19.1px), top 468px (1x 234px), border 2px solid #FEFEFE (1x 1.5px)
 * - 하단 메타 정보:
 *   - 일시: 'VCR OSD Mono' 34px (1x 17px), top 1084px (1x 542px), letter-spacing 0.04em, #FEFEFE
 *   - 장소: 'NanumSquare Neo' 30px (1x 15px), top 1141px (1x 570.5px), #FEFEFE
 *   - 캠코더 스펙: 4K 60FPS (left 81px, top 1285px -> 1x 40.5px, 642.5px), HD (left 660px, top 1285px -> 1x 330px, 642.5px)
 *   - 터치 안내: '화면을 터치해주세요' ('NanumMyeongjo' 20px -> 1x 10px, top 1335px -> 667.5px, letter-spacing 0.09em)
 * - 인터랙션: 화면 터치 시 시네마틱 암전(Blink) 트랜지션 + BGM 자동 재생 트리거('play-wedding-bgm') 후 본문 진입
 */
export default function SceneIntro({
  invitation,
  onOpen,
  isInModal: propIsInModal,
}) {
  const [transitionStep, setTransitionStep] = useState('idle'); // 'idle' | 'darkening' | 'revealing'
  const isInModal = Boolean(propIsInModal ?? invitation?.is_modal_preview);
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'scene');

  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  // 1. 신랑 & 신부 성함 (피그마 예: 권기득, 장민기)
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
    (isSample ? '/samples/photo-07-grass-run.jpg' : '');

  // 3. 예식장 장소 (피그마 예: 서울 크리스탈 볼룸 1층)
  const venueText = useMemo(() => {
    const hall = config.venue_hall || invitation?.venue_hall;
    const parts = [invitation?.venue_name, hall].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return isSample ? '서울 크리스탈 볼룸 1층' : '';
  }, [invitation?.venue_name, config.venue_hall, invitation?.venue_hall, isSample]);

  // 4. 날짜 포맷 (피그마 예: 2027.May 15. 14:00 pm)
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

  // 5. 스크롤 락 및 최상단 고정
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

  // 6. 반응형 자동 스케일 (390px * 693px 피그마 1:1 규격을 모든 화면 및 모달에서 왜곡 없이 정확히 유지)
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

  // 7. 화면 터치 시 시네마틱 암전(Blink) 본문 진입 & BGM 자동 재생 시작 (시안 1, 2, 3, 4와 100% 동일)
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
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt="Background"
              className="w-full h-full object-cover scale-[1.10] blur-sm"
            />
          )}
          <div className="absolute inset-0 bg-[#1C1C1C]/75" />
        </div>

        {/* 2. 중앙 뷰파인더 캠코더 카드 (피그마 1:1 실측 절대좌표: 780x1386 -> 1x 390x693) */}
        <div
          className="relative z-10 w-[390px] h-[693px] shrink-0 overflow-hidden bg-[#1C1C1C] text-white shadow-2xl sm:rounded-[24px]"
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'center center',
          }}
        >
          {/* 전체 배경 사진 (Image 770 풀스크린 화보) */}
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          )}

          {/* 레트로 캠코더 뷰파인더 4귀퉁이(모서리) 음영 & 시네마틱 오버레이 */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle 220px at 0% 0%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                radial-gradient(circle 220px at 100% 0%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                radial-gradient(circle 220px at 0% 100%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                radial-gradient(circle 220px at 100% 100%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 18%, transparent 82%, rgba(0, 0, 0, 0.4) 100%)
              `,
            }}
          />

          {/* =========================================================
              3. 뷰파인더 4개 코너 브래킷 (Line 159 등)
              피그마: width 153px (1x 76.5px), border 4px (1x 2px solid #FEFEFE)
              내부 영역: width 695px, height 1302px (여백: 좌우 21.25px, 상하 21px)
              ========================================================= */}
          {/* Top-Left ┌ */}
          <div
            className="absolute border-t-[2px] border-l-[2px] border-[#FEFEFE] pointer-events-none"
            style={{
              left: '21.25px',
              top: '21px',
              width: '76.5px',
              height: '76.5px',
            }}
          />
          {/* Top-Right ┐ */}
          <div
            className="absolute border-t-[2px] border-r-[2px] border-[#FEFEFE] pointer-events-none"
            style={{
              right: '21.25px',
              top: '21px',
              width: '76.5px',
              height: '76.5px',
            }}
          />
          {/* Bottom-Left └ */}
          <div
            className="absolute border-b-[2px] border-l-[2px] border-[#FEFEFE] pointer-events-none"
            style={{
              left: '21.25px',
              bottom: '21px',
              width: '76.5px',
              height: '76.5px',
            }}
          />
          {/* Bottom-Right ┘ */}
          <div
            className="absolute border-b-[2px] border-r-[2px] border-[#FEFEFE] pointer-events-none"
            style={{
              right: '21.25px',
              bottom: '21px',
              width: '76.5px',
              height: '76.5px',
            }}
          />

          {/* =========================================================
              4. 녹화 인디케이터 (빨간 점 + REC)
              - 빨간 점: left 590px, top 84px, width 24px, height 24px -> 1x 295px, 42px, 12px
              - REC: left 636px, top 84px, 'VCR OSD Mono' 32px -> 1x 318px, 42px, 16px
              ========================================================= */}
          <div
            className="absolute w-[12px] h-[12px] rounded-full bg-[#F80602] animate-pulse"
            style={{
              left: '295px',
              top: '42px',
            }}
          />
          <span
            className="absolute font-vcr text-[16px] leading-[12px] text-[#FEFEFE] tracking-normal"
            style={{
              left: '318px',
              top: '42px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            REC
          </span>

          {/* =========================================================
              5. 신랑신부 성함 (Figma: top 142px -> 1x 71px, NanumSquare Neo 34px -> 1x 17px)
              - 피그마 2x: width: 97px, height: 39px, top: 142px
                - 권기득 (신부): left: calc(50% - 97px/2 - 235.5px) -> 1x: calc(50% - 48.5px/2 - 117.75px) = 53px
                - 장민기 (신랑): left: calc(50% - 97px/2 + 235.5px) -> 1x: calc(50% - 48.5px/2 + 117.75px) = 288.5px
              ========================================================= */}
          <span
            className="absolute flex items-center justify-center font-nanumsquare text-[17px] leading-[19.5px] text-[#FAFAFA] text-center whitespace-nowrap"
            style={{
              top: '71px',
              left: 'calc(50% - 48.5px / 2 - 117.75px)',
              width: '48.5px',
              height: '19.5px',
              fontFamily: "'NanumSquare Neo', 'NanumSquare Neo OTF', sans-serif",
            }}
          >
            {brideName}
          </span>
          <span
            className="absolute flex items-center justify-center font-nanumsquare text-[17px] leading-[19.5px] text-[#FAFAFA] text-center whitespace-nowrap"
            style={{
              top: '71px',
              left: 'calc(50% - 48.5px / 2 + 117.75px)',
              width: '48.5px',
              height: '19.5px',
              fontFamily: "'NanumSquare Neo', 'NanumSquare Neo OTF', sans-serif",
            }}
          >
            {groomName}
          </span>

          {/* =========================================================
              6. Our Wedding Day! (Figma: top 319px -> 1x 159.5px, 'VCR OSD Mono' 60px -> 1x 30px)
              ========================================================= */}
          <p
            className="absolute w-full text-center font-vcr text-[30px] leading-[19px] text-[#FEFEFE] tracking-tight"
            style={{
              top: '159.5px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            Our Wedding Day!
          </p>

          {/* =========================================================
              7. 중앙 오토포커스 타겟 브래킷 (피그마 Group 1275 1:1 실측)
              - 2x: width 298.5px, height 450.5px, left 241px, top: calc(50% - 450.5px/2 + 0.25px) = 468px
              - 1x: width 149.25px, height 225.25px, left 120.5px, top: calc(50% - 225.25px/2 + 0.125px) = 234px
              - 각 코너 L자 선: width 38.25px -> 1x 19.125px, border 2px -> 1x 1.5px solid #FEFEFE
              ========================================================= */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '149.25px',
              height: '225.25px',
              left: '120.5px',
              top: 'calc(50% - 225.25px / 2 + 0.125px)',
            }}
          >
            {/* Top-Left ┌ */}
            <div
              className="absolute top-0 left-0 border-t-[1.5px] border-l-[1.5px] border-[#FEFEFE]"
              style={{ width: '19.125px', height: '19.125px' }}
            />
            {/* Top-Right ┐ */}
            <div
              className="absolute top-0 right-0 border-t-[1.5px] border-r-[1.5px] border-[#FEFEFE]"
              style={{ width: '19.125px', height: '19.125px' }}
            />
            {/* Bottom-Left └ */}
            <div
              className="absolute bottom-0 left-0 border-b-[1.5px] border-l-[1.5px] border-[#FEFEFE]"
              style={{ width: '19.125px', height: '19.125px' }}
            />
            {/* Bottom-Right ┘ */}
            <div
              className="absolute bottom-0 right-0 border-b-[1.5px] border-r-[1.5px] border-[#FEFEFE]"
              style={{ width: '19.125px', height: '19.125px' }}
            />
          </div>

          {/* =========================================================
              8. 일시 (Figma: top 1084px -> 1x 542px, 'VCR OSD Mono' 34px -> 1x 17px)
              ========================================================= */}
          <p
            className="absolute w-full text-center font-vcr text-[17px] leading-[12px] tracking-[0.04em] text-[#FEFEFE]"
            style={{
              top: '542px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            {formattedDate}
          </p>

          {/* =========================================================
              9. 장소 (Figma: top 1141px -> 1x 570.5px, 'NanumSquare Neo' 30px -> 1x 15px)
              ========================================================= */}
          <p
            className="absolute w-full text-center font-nanumsquare text-[15px] leading-[11px] text-[#FEFEFE]"
            style={{
              top: '570.5px',
              fontFamily: "'NanumSquare Neo', 'NanumSquare Neo OTF', sans-serif",
            }}
          >
            {venueText}
          </p>

          {/* =========================================================
              10. 하단 캠코더 스펙 (4K 60FPS & HD)
              - 4K 60FPS: left 81px, top 1285px -> 1x 40.5px, 642.5px
              - HD: left 660px, top 1285px -> 1x 330px, 642.5px
              ========================================================= */}
          <span
            className="absolute font-vcr text-[15px] leading-[11px] text-[#FEFEFE]"
            style={{
              left: '40.5px',
              top: '642.5px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            4K 60FPS
          </span>
          <span
            className="absolute font-vcr text-[15px] leading-[11px] text-[#FEFEFE]"
            style={{
              left: '330px',
              top: '642.5px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            HD
          </span>

          {/* =========================================================
              11. 화면을 터치해주세요 (Figma: top 1335px -> 1x 667.5px, NanumMyeongjo 20px -> 1x 10px)
              ========================================================= */}
          <p
            className="absolute w-full text-center font-nanummyeongjo text-[11px] leading-none tracking-[0.09em] text-[#FEFEFE] animate-pulse"
            style={{
              top: '667.5px',
              fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif",
            }}
          >
            화면을 터치해주세요
          </p>
        </div>
      </div>

      {/* 12. 시네마틱 껌뻑(Blink / Fade to black) 암전 오버레이 */}
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
