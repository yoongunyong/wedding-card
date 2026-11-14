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
    names: '현빈 · 손예진',
    venue: '워커힐 애스톤하우스',
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
    badge: '매거진 룩북형',
    dateText: '2027. 05. 15 SUN',
    names: '원빈 · 이나영',
    venue: '반얀트리 클럽 앤 스파 서울',
    image: '/samples/main-02-editorial.jpg',
    concept: '우아한 캘리그래피 & 화이트 룩북 오프닝',
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
    names: '조정석 · 거미',
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
    names: '이병헌 · 이민정',
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
    title: '레트로 캠코더',
    subTitle: 'Retro Camcorder & Viewfinder',
    badge: 'NEW 90s 감성',
    dateText: '2027. 05. 15 SAT',
    names: '연정훈 · 한가인',
    venue: '서울 크리스탈 볼룸 1층',
    image: '/samples/photo-07-grass-run.jpg',
    concept: '90년대 레트로 캠코더 뷰파인더 & VCR OSD 비네팅 화보',
    accentColor: 'from-neutral-950/90 via-stone-900/40 to-transparent',
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
  const [isDragging, setIsDragging] = useState(false);

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
    const raf = requestAnimationFrame(() => {
      setIsMounted(true);
      updateWidth();
    });
    window.addEventListener('resize', updateWidth);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateWidth);
    };
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
    setIsDragging(true);
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
    setIsDragging(false);
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
              transition: isDragging || !isTransitioning
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
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${card.type === 'cinematic' ? 'grayscale contrast-105' : ''}`}
                    loading="lazy"
                  />

                  {/* 은은한 비네팅 그라데이션 오버레이 */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${card.accentColor} transition-opacity duration-300 ${
                      isActive ? 'opacity-85' : 'opacity-80 group-hover:opacity-70'
                    }`}
                  />

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
                        <p className="text-[9px] text-slate-500 mt-0.5">현빈 님이 청첩장을 공유합니다</p>
                      </div>
                    </div>
                  )}

                  {/* [시안 02: 클래식 에디토리얼 실제 오프닝 1:1 팩트 매칭] */}
                  {card.type === 'editorial' && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-center flex flex-col items-center">
                      <p
                        className="text-white text-2xl sm:text-[26px] font-normal italic drop-shadow-md select-none mb-2"
                        style={{
                          fontFamily: "'Bickham Script Pro', 'Bickham Script Pro 3', 'Great Vibes', 'Alex Brush', cursive",
                        }}
                      >
                        We are getting married
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDE8F4]/95 backdrop-blur-xs border border-[#BED4E8] text-stone-800 text-[8.5px] font-serif tracking-[0.16em] uppercase font-medium shadow-md">
                        <span>OPEN THE LOOKBOOK</span>
                        <span className="text-[9px]">→</span>
                      </div>
                    </div>
                  )}

                  {/* [시안 03: 감성 플레이리스트 - 실제 시안 3 뮤직 플레이어 UI 카드] */}
                  {card.type === 'playlist' && (
                    <div className="absolute inset-x-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none">
                      <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-[24px] shadow-2xl border border-white/60 text-[#292929] flex flex-col items-center">
                        {/* 상단 성함 & 구분선 (시안 3 정통 헤더) */}
                        <div className="w-full flex items-center justify-between px-1 mb-2">
                          <span 
                            className="text-[12px] text-[#292929] font-medium tracking-tight"
                            style={{ fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif" }}
                          >
                            조정석
                          </span>
                          <div className="flex-1 mx-2.5 border-t border-[#999999]/60" />
                          <span 
                            className="text-[12px] text-[#292929] font-medium tracking-tight"
                            style={{ fontFamily: "'NanumMyeongjo', 'Noto Serif KR', serif" }}
                          >
                            거미
                          </span>
                        </div>

                        {/* Getting married 감성 손글씨 */}
                        <p 
                          className="text-[18px] text-[#292929] leading-none mb-3 text-center"
                          style={{ fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive" }}
                        >
                          Getting married
                        </p>

                        {/* 프로그레스 바 & 재생 점 */}
                        <div className="w-full space-y-1 mb-2.5">
                          <div className="relative w-full h-[2px] bg-[#292929]/20 rounded-full">
                            <div className="absolute left-0 top-0 h-full bg-[#292929] rounded-full" style={{ width: '42%' }} />
                            <div className="absolute -top-[3px] left-[42%] w-[8px] h-[8px] rounded-full bg-[#292929] shadow-xs" />
                          </div>
                          <div className="flex justify-between text-[7.5px] text-[#292929] font-mono leading-none">
                            <span>0:16</span>
                            <span>3:37</span>
                          </div>
                        </div>

                        {/* 5대 컨트롤러 (하트, 이전곡, 재생원형, 다음곡, 더보기) */}
                        <div className="w-full flex items-center justify-between px-1 mb-2 text-[#292929]">
                          {/* 하트 */}
                          <svg width="13" height="12" viewBox="0 0 24 22" fill="none" stroke="#292929" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          {/* 이전곡 */}
                          <svg width="13" height="12" viewBox="0 0 24 24" fill="#292929">
                            <rect x="3" y="4" width="2.5" height="16" rx="0.5" />
                            <polygon points="21,4 8,12 21,20" />
                          </svg>
                          {/* 재생원형 (26px) */}
                          <div className="w-7 h-7 rounded-full bg-[#292929] flex items-center justify-center shadow-xs">
                            <div className="flex items-center gap-[2px]">
                              <div className="w-[1.6px] h-2.5 bg-[#FAFAFA] rounded-xs" />
                              <div className="w-[1.6px] h-2.5 bg-[#FAFAFA] rounded-xs" />
                            </div>
                          </div>
                          {/* 다음곡 */}
                          <svg width="13" height="12" viewBox="0 0 24 24" fill="#292929">
                            <polygon points="3,4 16,12 3,20" />
                            <rect x="18.5" y="4" width="2.5" height="16" rx="0.5" />
                          </svg>
                          {/* 더보기 */}
                          <svg width="13" height="4" viewBox="0 0 24 6" fill="#292929">
                            <circle cx="4" cy="3" r="2.2" />
                            <circle cx="12" cy="3" r="2.2" />
                            <circle cx="20" cy="3" r="2.2" />
                          </svg>
                        </div>

                        {/* 보조 컨트롤: 셔플 & 터치 안내 & 반복재생 */}
                        <div className="w-full flex items-center justify-between px-2 pt-1 border-t border-[#292929]/10 text-[#292929]/70">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
                          </svg>
                          <span 
                            className="text-[8px] text-[#666666] tracking-wider animate-pulse font-serif"
                            style={{ fontFamily: "'NanumMyeongjo', serif" }}
                          >
                            화면을 터치해주세요
                          </span>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* [시안 04: 시네마틱 모노리스 - 영화 포스터 룩] */}
                  {card.type === 'cinematic' && (
                    <div className="absolute inset-0 pointer-events-none p-5 select-none flex flex-col justify-between items-center text-center z-10">
                      {/* 상단: The marriage of & 영문 이름 */}
                      <div className="pt-3">
                        <p
                          className="text-[25px] sm:text-[27px] text-white leading-none font-normal drop-shadow-md"
                          style={{ fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive" }}
                        >
                          The marriage of
                        </p>
                        <h4
                          className="text-[12px] sm:text-[13px] text-white/95 font-medium tracking-[0.14em] uppercase mt-2 drop-shadow-sm"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          BYUNG HUN & MIN JUNG
                        </h4>
                      </div>

                      {/* 하단 메타: Welcome to our Wedding Day & 터치 안내 (하단 바닥 정보 바로 위 pb-20) */}
                      <div className="pb-20 space-y-1">
                        <p
                          className="text-[12px] text-stone-200 tracking-[0.08em] font-light drop-shadow-sm"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          Welcome to our Wedding Day
                        </p>
                        <p
                          className="text-[8.5px] text-stone-300 tracking-wider font-nanummyeongjo animate-pulse pt-0.5"
                          style={{ fontFamily: "'NanumMyeongjo', serif" }}
                        >
                          화면을 터치해주세요
                        </p>
                      </div>
                    </div>
                  )}

                  {/* [시안 05: 레트로 캠코더 - 4귀퉁이 음영 & VCR OSD 뷰파인더] */}
                  {card.type === 'scene' && (
                    <div className="absolute inset-0 pointer-events-none p-3 select-none flex flex-col justify-between z-10">
                      {/* 4귀퉁이 레트로 캠코더 딥 비네팅 음영 */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `
                            radial-gradient(circle 120px at 0% 0%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                            radial-gradient(circle 120px at 100% 0%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                            radial-gradient(circle 120px at 0% 100%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                            radial-gradient(circle 120px at 100% 100%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0%, transparent 18%, transparent 82%, rgba(0, 0, 0, 0.35) 100%)
                          `,
                        }}
                      />

                      {/* 4개 코너 브래킷 ┌ ┐ └ ┘ */}
                      <div className="absolute top-3 left-3 w-5 h-5 border-t-[1.5px] border-l-[1.5px] border-[#FEFEFE] pointer-events-none" />
                      <div className="absolute top-3 right-3 w-5 h-5 border-t-[1.5px] border-r-[1.5px] border-[#FEFEFE] pointer-events-none" />
                      <div className="absolute bottom-20 left-3 w-5 h-5 border-b-[1.5px] border-l-[1.5px] border-[#FEFEFE] pointer-events-none" />
                      <div className="absolute bottom-20 right-3 w-5 h-5 border-b-[1.5px] border-r-[1.5px] border-[#FEFEFE] pointer-events-none" />

                      {/* 상단: REC 녹화 인디케이터 & 신랑신부 (브래킷 아래 top-9에 정돈 배치하여 브래킷과 완전 분리) */}
                      <div className="absolute top-9 inset-x-6 z-10 flex items-center justify-between pointer-events-none">
                        <span
                          className="text-[10px] text-white/90 tracking-wide"
                          style={{ fontFamily: "'NanumSquare Neo', sans-serif" }}
                        >
                          한가인
                        </span>
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F80602] animate-pulse" />
                          <span
                            className="text-[10px] text-[#FEFEFE]"
                            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                          >
                            REC
                          </span>
                        </div>
                        <span
                          className="text-[10px] text-white/90 tracking-wide"
                          style={{ fontFamily: "'NanumSquare Neo', sans-serif" }}
                        >
                          연정훈
                        </span>
                      </div>

                      {/* 중앙: Our Wedding Day! + 타겟 오토포커스 브래킷 */}
                      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-center flex flex-col items-center">
                        <p
                          className="text-[18px] sm:text-[20px] text-[#FEFEFE] tracking-tight drop-shadow-md mb-2.5"
                          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        >
                          Our Wedding Day!
                        </p>
                        {/* 타겟 포커스 브래킷 */}
                        <div className="relative w-16 h-22 pointer-events-none flex items-center justify-center">
                          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-[1.5px] border-l-[1.5px] border-[#FEFEFE]" />
                          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-[1.5px] border-r-[1.5px] border-[#FEFEFE]" />
                          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-[1.5px] border-l-[1.5px] border-[#FEFEFE]" />
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-[#FEFEFE]" />
                        </div>
                      </div>

                      {/* 하단: 4K 60FPS / 화면을 터치해주세요 / HD (바닥 정보 바 위 bottom-20에 정렬) */}
                      <div className="absolute bottom-20 inset-x-5 z-10 flex items-center justify-between text-[#FEFEFE] pointer-events-none">
                        <span
                          className="text-[8.5px]"
                          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        >
                          4K 60FPS
                        </span>
                        <span
                          className="text-[9px] tracking-wider font-serif animate-pulse opacity-90"
                          style={{ fontFamily: "'NanumMyeongjo', serif" }}
                        >
                          화면을 터치해주세요
                        </span>
                        <span
                          className="text-[8.5px]"
                          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
                        >
                          HD
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 카드 하단 정보: 성함 & 웨딩홀 & 시안 타이틀 */}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6 text-white text-left">
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
