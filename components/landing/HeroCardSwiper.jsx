'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SamplePreviewModal from './SamplePreviewModal';

// 아틀리에 드 무키루의 5대 공식 시안 (고객 제작 가능 공식 라인업 100% 일치)
const OFFICIAL_TEMPLATES = [
  {
    id: 'basic',
    templateId: 'basic',
    category: 'OPTION 01',
    title: '에어드랍 클래식',
    subTitle: 'AirDrop Edition',
    badge: '인스타 화제 1위',
    dateText: '2026. 12. 05 SAT',
    names: '김도현 · 이서연',
    venue: '그랜드 힐튼 서울',
    image: '/airdrop-couple.png',
    concept: '아이폰 AirDrop 팝업 & 인스타 오프닝',
    accentColor: 'from-slate-950/85 via-slate-900/40 to-transparent',
    type: 'basic',
  },
  {
    id: 'editorial',
    templateId: 'editorial',
    category: 'OPTION 02',
    title: '클래식 에디토리얼',
    subTitle: 'Editorial Lookbook',
    badge: '매거진 화보형',
    dateText: '2027. 05. 15 SUN',
    names: '강민준 · 박지민',
    venue: '반얀트리 클럽 앤 스파',
    image: '/samples/editorial-cover.jpg',
    concept: 'Vogue 스타일 매거진 표지 & 흑백 화보',
    accentColor: 'from-black/90 via-black/40 to-black/20',
    type: 'editorial',
  },
  {
    id: 'playlist',
    templateId: 'playlist',
    category: 'OPTION 03',
    title: '감성 플레이리스트',
    subTitle: 'Wedding Playlist',
    badge: '뮤직 앨범형',
    dateText: '2027. 05. 23 SUN',
    names: '강민우 · 서유진',
    venue: '빌라드지디 청담',
    image: '/samples/main-03-playlist.jpg',
    concept: '미니멀 뮤직 플레이어 카드 & 실시간 BGM',
    accentColor: 'from-stone-950/90 via-stone-900/40 to-transparent',
    type: 'playlist',
  },
  {
    id: 'cinematic',
    templateId: 'cinematic',
    category: 'OPTION 04',
    title: '시네마틱 모노리스',
    subTitle: 'Cinematic Monolith',
    badge: '영화 포스터 룩',
    dateText: '2027. 11. 07 SUN',
    names: '이진호 · 김나은',
    venue: '신라호텔 서울',
    image: '/samples/cinematic-cover.jpg',
    concept: '35mm 필름 영화 포스터 감성 화보 & Day/Night 모드',
    accentColor: 'from-neutral-950/90 via-neutral-900/40 to-black/30',
    type: 'cinematic',
  },
  {
    id: 'scene',
    templateId: 'scene',
    category: 'OPTION 05',
    title: '모던 씬 (Scene 02)',
    subTitle: 'Modern Elegance & Scene',
    badge: 'NEW 시안',
    dateText: '2027. 04. 24 SAT',
    names: '최현우 · 윤서아',
    venue: '더채플앳논현',
    image: '/samples/scene-cover.jpg',
    concept: '은은한 블러 배경 & 3줄 감성 초대글 오프닝',
    accentColor: 'from-warm-gray-950/85 via-stone-900/40 to-transparent',
    type: 'scene',
  },
];

const TEMPLATE_COUNT = OFFICIAL_TEMPLATES.length; // 5

// 무한 루프 파노라마를 위해 3세트 복제 (총 15개 카드 트랙)
const LOOP_CARDS = [
  ...OFFICIAL_TEMPLATES.map((tpl, i) => ({ ...tpl, uniqueKey: `set0-${i}` })),
  ...OFFICIAL_TEMPLATES.map((tpl, i) => ({ ...tpl, uniqueKey: `set1-${i}` })),
  ...OFFICIAL_TEMPLATES.map((tpl, i) => ({ ...tpl, uniqueKey: `set2-${i}` })),
];

export default function HeroCardSwiper() {
  // 시작은 중앙 세트(set1)의 2번째 카드(플레이리스트 or 에디토리얼)로 설정
  // set1의 범위는 5 ~ 9 (기본값 6 = 에디토리얼, 7 = 플레이리스트)
  const [virtualIndex, setVirtualIndex] = useState(7);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isMounted, setIsMounted] = useState(false);

  // 드래그 & 스와이프 제어
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentDragDeltaRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const hasDraggedFarRef = useRef(false);

  // 새로고침 시 무조건 화면 최상단(헤더 및 히어로 상단)으로 강제 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      // 브라우저의 늦은 복원 타이밍까지 확실하게 방지
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // 화면 너비 감지 및 반응형 카드 사이즈 산출
  const updateWidth = useCallback(() => {
    if (typeof window !== 'undefined') {
      setContainerWidth(window.innerWidth);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [updateWidth]);

  // 카드 치수 (모바일 / 데스크톱 분기)
  const isMobile = containerWidth < 640;
  const isTablet = containerWidth >= 640 && containerWidth < 1024;
  const cardWidth = isMobile ? 230 : isTablet ? 260 : 280;
  const cardGap = isMobile ? 14 : 20;
  const step = cardWidth + cardGap;

  // 정중앙 위치 계산
  const baseOffset = (containerWidth / 2) - (virtualIndex * step) - (cardWidth / 2);
  const totalOffset = baseOffset + dragOffset;

  // 실제 5종 기준 인덱스 (0, 1, 2, 3, 4)
  const realIndex = ((virtualIndex % TEMPLATE_COUNT) + TEMPLATE_COUNT) % TEMPLATE_COUNT;
  const currentTemplate = OFFICIAL_TEMPLATES[realIndex];

  // 무한 루프 텔레포트: 양 끝에 도달했을 때 중앙 세트로 조용히 점프
  useEffect(() => {
    if (virtualIndex < TEMPLATE_COUNT) {
      // 0세트로 진입했을 때 ➔ 1세트로 순간 이동
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setVirtualIndex((prev) => prev + TEMPLATE_COUNT);
      }, 480);
      return () => clearTimeout(timer);
    } else if (virtualIndex >= TEMPLATE_COUNT * 2) {
      // 2세트로 진입했을 때 ➔ 1세트로 순간 이동
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setVirtualIndex((prev) => prev - TEMPLATE_COUNT);
      }, 480);
      return () => clearTimeout(timer);
    }
  }, [virtualIndex]);

  // 트랜지션 복원
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setVirtualIndex((prev) => prev - 1);
  }, []);

  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setVirtualIndex((prev) => prev + 1);
  }, []);

  // 도트 클릭 시 중앙 세트(set1) 내의 해당 번호로 부드럽게 이동
  const handleDotClick = useCallback((targetRealIndex) => {
    setIsTransitioning(true);
    setVirtualIndex(TEMPLATE_COUNT + targetRealIndex);
  }, []);

  // 모달 열기 핸들러
  const openPreview = useCallback((templateId) => {
    const tplId = templateId || currentTemplate.templateId;
    const tplObj = OFFICIAL_TEMPLATES.find((t) => t.id === tplId) || currentTemplate;
    setSelectedTemplate({
      id: tplId,
      title: tplObj.title,
      subTitle: tplObj.subTitle,
    });
    setIsModalOpen(true);
  }, [currentTemplate]);

  // 터치 & 마우스 드래그 핸들러
  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    hasDraggedFarRef.current = false;
    startXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
    currentDragDeltaRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - startXRef.current;
    currentDragDeltaRef.current = delta;
    if (Math.abs(delta) > 8) {
      hasDraggedFarRef.current = true;
    }
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = currentDragDeltaRef.current;
    setDragOffset(0);

    // 40px 이상 스와이프 시 1칸 이동
    if (delta > 40) {
      handlePrev();
    } else if (delta < -40) {
      handleNext();
    }

    setTimeout(() => {
      hasDraggedFarRef.current = false;
    }, 150);
  };

  // 키보드 방향키 제어
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, isModalOpen]);

  return (
    <>
      <section
        id="hero-section"
        className="relative bg-white overflow-hidden select-none"
        style={{
          // 상하 여백 100px 이상 시원하게 확보 (고급 사이트 여백 미학)
          paddingTop: isMobile ? '60px' : '96px',
          paddingBottom: isMobile ? '76px' : '108px',
        }}
      >
        {/* ========================================================
            1. 상단 감성 카피라이팅 & 스태거(Stagger 0.15s) 애니메이션
            - 폰트 행간 1.6~1.75 및 단정한 자간(Letter-spacing -0.03em)
            - 단어 잘림 방지(break-keep) 및 여유 있는 타이포그래피 정돈
           ======================================================== */}
        <div className="max-w-3xl mx-auto text-center px-5 mb-10 sm:mb-14">
          {/* Step 1: 태그 뱃지 (0ms) - 자간 정돈 및 정갈한 패딩 */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100/90 border border-slate-200/70 rounded-full text-[11px] text-slate-600 mb-5 shadow-2xs transition-all duration-700 ${
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="font-mono text-[10px] tracking-wider text-slate-500 font-medium">ATELIER DE MUKIRU</span>
            <span className="text-slate-300">|</span>
            <span className="font-sans font-medium text-slate-800 tracking-tight">5가지 시그니처 컬렉션</span>
          </div>

          {/* Step 2: 메인 타이틀 (Stagger 150ms) - 모던 프리텐다드 & 쫀쫀한 자간(-0.03em) */}
          <h1
            className={`transition-all duration-700 delay-150 ${
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ lineHeight: 1.35 }}
          >
            <span className="block text-slate-400 font-normal text-lg sm:text-2xl lg:text-[26px] tracking-[-0.025em] mb-1.5 sm:mb-2">
              기억에 오래도록 머무는 초대
            </span>
            <span className="block text-[#0f172a] font-extrabold text-3xl sm:text-4xl lg:text-[44px] tracking-[-0.035em] font-sans">
              가장 우아한 모바일 아틀리에.
            </span>
          </h1>

          {/* Step 3: 서브 설명 문구 (Stagger 300ms) - break-keep 적용으로 단어 쪼개짐 원천 차단 */}
          <p
            className={`mt-4 sm:mt-5 text-xs sm:text-sm text-slate-500 font-normal max-w-lg mx-auto break-keep leading-[1.75] tracking-[-0.015em] transition-all duration-700 delay-300 ${
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            정형화된 형식을 넘어, 두 사람의 이야기를 가장 감각적인 시선으로 담아냅니다.<br className="hidden sm:inline" />
            {' '}카드를 터치하면 실제 모바일 청첩장을 전체화면으로 즉시 감상하실 수 있습니다.
          </p>
        </div>

        {/* ========================================================
            2. 와이드 파노라마 카드 플로우 (공식 5종 무한 루프)
            - 화면 전체 가로폭에 공식 5종 카드가 자연스럽게 이어지며 끊김 없이 회전
            - 중앙 활성 카드는 위로 솟아오르고(translate-y-[-16px]), 스케일업 & 깊은 그림자
            - 중앙 카드 우측 상단에 반투명한 눈(Eye) 아이콘 퀵뷰 버튼 탑재
           ======================================================== */}
        <div
          ref={containerRef}
          className={`relative w-full overflow-hidden py-6 sm:py-8 transition-all duration-700 delay-450 ${
            isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          {/* 좌우 끝 페이드아웃 그라데이션 (은은한 마스킹 효과) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-20" />

          {/* 데스크톱 좌우 네비게이션 플로팅 화살표 버튼 */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="이전 시안 보기"
            className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-slate-200/80 shadow-lg shadow-slate-900/10 items-center justify-center text-slate-700 hover:text-[#0f172a] hover:scale-105 active:scale-95 transition-all z-30 cursor-pointer backdrop-blur-xs"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="다음 시안 보기"
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-slate-200/80 shadow-lg shadow-slate-900/10 items-center justify-center text-slate-700 hover:text-[#0f172a] hover:scale-105 active:scale-95 transition-all z-30 cursor-pointer backdrop-blur-xs"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* 파노라마 카드 트랙 (무한 루프 & GPU 하드웨어 가속) */}
          <div
            className="flex items-center"
            style={{
              transform: `translateX(${totalOffset}px)`,
              transition: isDraggingRef.current || !isTransitioning
                ? 'none'
                : 'transform 0.48s cubic-bezier(0.25, 1, 0.5, 1)',
              gap: `${cardGap}px`,
              willChange: 'transform',
            }}
          >
            {LOOP_CARDS.map((card, idx) => {
              const isActive = idx === virtualIndex;
              return (
                <div
                  key={card.uniqueKey}
                  onClick={() => {
                    if (hasDraggedFarRef.current) return;
                    if (isActive) {
                      openPreview(card.templateId);
                    } else {
                      setIsTransitioning(true);
                      setVirtualIndex(idx);
                    }
                  }}
                  style={{
                    width: `${cardWidth}px`,
                    height: isMobile ? '430px' : '510px',
                    transform: isActive ? 'translateY(-16px) scale(1.03)' : 'translateY(0) scale(0.96)',
                    transition: isTransitioning
                      ? 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)'
                      : 'none',
                  }}
                  className={`group relative shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer ${
                    isActive
                      ? 'shadow-[0_24px_50px_-10px_rgba(15,23,42,0.25)] ring-1 ring-black/5 z-10'
                      : 'opacity-85 hover:opacity-100 shadow-md hover:shadow-lg border border-slate-200/70 z-0'
                  }`}
                >
                  {/* 카드 배경 이미지 (공식 시안 고화질 표지) */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${card.type === 'playlist' ? 'grayscale contrast-105' : ''}`}
                    loading="lazy"
                  />

                  {/* 은은한 비네팅 그라데이션 오버레이 */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${card.accentColor} transition-opacity duration-300 ${
                      isActive ? 'opacity-85' : 'opacity-80 group-hover:opacity-70'
                    }`}
                  />

                  {/* 카드 상단 헤더: 옵션 넘버 & 날짜 & 우측 '눈(Eye)' 퀵뷰 버튼 */}
                  <div className="relative z-10 p-4 sm:p-5 flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-mono tracking-widest text-white uppercase shadow-xs whitespace-nowrap">
                        {card.category} · {card.badge}
                      </span>
                      <p className="font-mono text-[10px] text-white/80 tracking-wider mt-1.5">
                        {card.dateText}
                      </p>
                    </div>

                    {/* 중앙 활성 카드에 뜨는 눈(Eye) 아이콘 퀵뷰 */}
                    {isActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(card.templateId);
                        }}
                        aria-label="청첩장 전체화면 미리보기"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all shadow-md hover:scale-105 active:scale-95"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* =====================================================
                      카드 중앙 맞춤형 시그니처 비주얼 요소 (5대 시안 100% 특화)
                     ===================================================== */}
                  {card.type === 'basic' && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-white/50 text-center">
                        <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs">
                          📡
                        </div>
                        <p className="text-[11px] font-bold text-slate-800">AirDrop 공유 요청</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">김도현 님이 청첩장을 공유합니다</p>
                      </div>
                    </div>
                  )}

                  {card.type === 'editorial' && (
                    <div className="absolute inset-x-4 top-20 z-10 pointer-events-none text-center">
                      <p className="font-editorial-serif text-2xl sm:text-3xl tracking-[0.25em] text-white/90 font-light drop-shadow-sm uppercase">
                        VOGUE
                      </p>
                      <p className="text-[8px] font-mono tracking-widest text-white/70 uppercase -mt-1">
                        WEDDING SPECIAL ISSUE
                      </p>
                    </div>
                  )}

                  {card.type === 'playlist' && (
                    <div className="absolute inset-x-3.5 sm:inset-x-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <div className="bg-[#FAF8F5]/95 backdrop-blur-md p-4 sm:p-4.5 rounded-[26px] shadow-xl border border-stone-200/80 text-left select-none">
                        {/* 1. 영문 날짜 */}
                        <span className="text-[10px] font-sans tracking-[0.24em] text-[#8E8E93] font-normal uppercase block mb-1">
                          MAY 23, 2027
                        </span>

                        {/* 2. 신랑 💗 신부 (정통 본명조 Noto Serif KR) & 우측 라인 하트 (시안 3 원본 100% 일치) */}
                        <div className="flex items-center justify-between">
                          <h4 
                            style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
                            className="text-[17px] sm:text-[18px] font-normal text-[#1C1C1E] tracking-tight flex items-center gap-1"
                          >
                            <span>강민우</span>
                            <span className="text-[13px] mx-0.5">💗</span>
                            <span>서유진</span>
                          </h4>

                          {/* 시안 3 원본 얇은 미니멀 라인 하트 SVG */}
                          <svg
                            className="w-4 h-4 text-[#1C1C1E]"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            fill="none"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                        </div>

                        {/* 3. 실제 시안 3 원본 1줄 서브카피: '저희  결혼합니다.' (자간 0.18em Noto Serif KR) */}
                        <p 
                          style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
                          className="text-[11.5px] text-[#8E8E93] tracking-[0.18em] font-normal mt-1"
                        >
                          저희  결혼합니다.
                        </p>

                        {/* 4. 프로그레스 바 (트랙 높이 3px, 정밀 핸들 점, 시간 3:19 / - 4:26) */}
                        <div className="mt-3.5">
                          <div className="relative w-full h-[3px] bg-[#E5E5EA] rounded-full flex items-center">
                            <div 
                              className="h-full bg-[#1C1C1E] rounded-full relative flex items-center justify-end"
                              style={{ width: '38%' }}
                            >
                              <div className="w-2 h-2 rounded-full bg-[#1C1C1E] shadow-xs shrink-0 -mr-1" />
                            </div>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-[#8E8E93]">
                            <span>3:19</span>
                            <span>- 4:26</span>
                          </div>
                        </div>

                        {/* 5. 실제 시안 3 원본 미디어 컨트롤러 (셔플, 이전곡, 재생 원형 버튼, 다음곡, 반복) 1:1 일치 */}
                        <div className="mt-3 flex items-center justify-between px-1 text-[#1C1C1E]">
                          {/* 셔플 */}
                          <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
                          </svg>
                          {/* 이전곡 */}
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <rect x="4" y="4" width="3" height="16" rx="1.2" />
                            <path d="M20 5.2v13.6a1 1 0 0 1-1.6.8L9.2 12.8a1 1 0 0 1 0-1.6L18.4 4.4a1 1 0 0 1 1.6.8z" />
                          </svg>
                          {/* 중앙 재생 원형 버튼 */}
                          <div className="w-7 h-7 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shadow-xs">
                            <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          {/* 다음곡 */}
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <rect x="17" y="4" width="3" height="16" rx="1.2" />
                            <path d="M4 5.2v13.6a1 1 0 0 0 1.6.8L14.8 12.8a1 1 0 0 0 0-1.6L5.6 4.4A1 1 0 0 0 4 5.2z" />
                          </svg>
                          {/* 반복 */}
                          <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {card.type === 'cinematic' && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-center">
                      <p className="font-mono text-[9px] tracking-[0.3em] text-amber-200/90 uppercase mb-1">
                        A FILM BY ATELIER MUKIRU
                      </p>
                      <p className="font-editorial-serif text-lg tracking-widest text-white font-bold drop-shadow-md">
                        OUR FIRST PAGE
                      </p>
                    </div>
                  )}

                  {card.type === 'scene' && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-center">
                      <div className="bg-black/30 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                        <p className="text-[11px] text-white/90 font-serif leading-relaxed">
                          가장 눈부신 날,<br />
                          두 사람이 하나 되어<br />
                          소중한 분들을 모십니다.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 카드 하단 정보: 성함 & 웨딩홀 & 시안 타이틀 */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 text-white text-left">
                    <span className="text-[10px] font-mono text-amber-300 tracking-wider uppercase block mb-1">
                      {card.category} · {card.subTitle}
                    </span>
                    <h3 className="font-sans text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-xs">
                      {card.title}
                    </h3>

                    {/* 신랑신부 성함 & 웨딩홀 */}
                    <div className="mt-2.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-white/90">
                      <span className="text-xs font-medium font-sans">
                        {card.names}
                      </span>
                      <span className="text-[11px] font-light text-white/70">
                        {card.venue}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            3. 인디케이터 Dots (정확히 공식 5종 기준 5개만 표시)
           ======================================================== */}
        <div className="flex items-center justify-center gap-2 mt-2 mb-8 sm:mb-10">
          {OFFICIAL_TEMPLATES.map((tpl, idx) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleDotClick(idx)}
              aria-label={`${tpl.title} 시안으로 이동`}
              className={`rounded-full transition-all duration-300 ${
                idx === realIndex
                  ? 'w-7 h-2 bg-[#1e293b]'
                  : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* ========================================================
            4. 하단 2단 액션 CTA 버튼 (Stagger 600ms)
            - 1순위: [청첩장 제작하기 ↗] (다크 차콜 #1e293b, 볼드, 모던 라운드)
            - 2순위: [디자인 샘플 보기] (클린 화이트, 보더, 차콜 텍스트)
           ======================================================== */}
        <div
          className={`max-w-xs sm:max-w-md mx-auto px-4 flex flex-col gap-2.5 transition-all duration-700 delay-600 ${
            isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Primary CTA Button: 청첩장 제작하기 */}
          <Link
            href={`/create?template=${currentTemplate.templateId}`}
            className="w-full py-3.5 sm:py-4 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 group cursor-pointer"
          >
            <span>{currentTemplate.title} 시안으로 시작하기</span>
            <svg
              className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </Link>

          {/* Secondary CTA Button: 디자인 샘플 보기 */}
          <button
            type="button"
            onClick={() => openPreview(currentTemplate.templateId)}
            className="w-full py-3 sm:py-3.5 bg-white hover:bg-slate-50 text-[#1e293b] text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>전체화면 실시간 샘플 체험하기</span>
          </button>
        </div>
      </section>

      {/* 실시간 전체화면 모바일 청첩장 미리보기 모달 */}
      <SamplePreviewModal
        isOpen={isModalOpen}
        template={selectedTemplate}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
