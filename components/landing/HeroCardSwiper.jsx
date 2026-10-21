'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SamplePreviewModal from './SamplePreviewModal';
import ScrollReveal from '../ScrollReveal';

const HERO_TEMPLATES = [
  {
    id: 'basic',
    option: 'OPTION 01',
    title: '에어드랍 클래식',
    subTitle: 'AirDrop Edition',
    badge: '인스타 화제 1위',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    coverImage: '/airdrop-couple.png',
    groom: '김도현',
    bride: '이서연',
    weddingDateDetail: '2026. 12. 05 토요일 낮 12:30',
    hallInfo: '그랜드 힐튼 서울, 그랜드볼룸',
    concept: '아이폰 AirDrop 팝업 & 인스타 트렌드 오프닝',
  },
  {
    id: 'editorial',
    option: 'OPTION 02',
    title: '클래식 에디토리얼',
    subTitle: 'Editorial Lookbook',
    badge: '매거진 화보형',
    badgeColor: 'bg-stone-900 text-white border-stone-800',
    coverImage: '/samples/editorial-cover.jpg',
    groom: '강민준',
    bride: '박지민',
    weddingDateDetail: '2027. 05. 15 일요일 오후 2:00',
    hallInfo: '반얀트리 클럽 앤 스파, 크리스탈볼룸',
    concept: '패션 매거진 룩북 표지 & 시네마틱 페이드 오프닝',
  },
  {
    id: 'playlist',
    option: 'OPTION 03',
    title: '감성 플레이리스트',
    subTitle: 'Wedding Playlist',
    badge: '음악 & 플레이어',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    coverImage: '/playlist-couple.png',
    groom: '강민우',
    bride: '서유진',
    weddingDateDetail: '2026. 04. 26 일요일 오후 2:00',
    hallInfo: '빌라드지디 청담, 르씨엘홀',
    concept: '미니멀 뮤직 플레이어 카드 & 실시간 BGM 동기화',
  },
  {
    id: 'cinematic',
    option: 'OPTION 04',
    title: '시네마틱 모노리스',
    subTitle: 'Cinematic Monolith',
    badge: '영화 포스터 룩',
    badgeColor: 'bg-black text-amber-300 border-stone-800',
    coverImage: '/samples/cinematic-cover.jpg',
    groom: '이진호',
    bride: '김나은',
    weddingDateDetail: '2027. 11. 07 일요일 오후 1:00',
    hallInfo: '신라호텔 서울, 다이너스티홀',
    concept: 'Our First Page 감성 화보 & Day/Night 듀얼 테마',
  },
  {
    id: 'scene',
    option: 'OPTION 05',
    title: '모던 씬 (Scene 02)',
    subTitle: 'Modern Elegance & Scene',
    badge: 'NEW 시안',
    badgeColor: 'bg-stone-100 text-stone-900 border-stone-300',
    coverImage: '/samples/scene-cover.jpg',
    groom: '최현우',
    bride: '윤서아',
    weddingDateDetail: '2027. 04. 24 토요일 낮 12:30',
    hallInfo: '더채플앳논현, 라포레홀',
    concept: '블러 배경 & 3줄 감성 초대글 오프닝 시퀀스',
  },
];

export default function HeroCardSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const isSwipedRef = useRef(false);

  // 상단 템플릿 뱃지 가로 스크롤 컨테이너 & 활성 탭 참조
  const tabsContainerRef = useRef(null);
  const activeTabRef = useRef(null);

  // 새로고침 시 스크롤 최상단 이동 처리
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }
  }, []);

  // 카드 변경 시 상단 뱃지도 해당 탭으로 부드럽게 가로 스크롤 동기화
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex]);

  const currentTpl = HERO_TEMPLATES[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? HERO_TEMPLATES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === HERO_TEMPLATES.length - 1 ? 0 : prev + 1));
  };

  const openPreview = (tpl) => {
    // 스와이프 제스처 직후 발생한 합성 클릭 이벤트는 무시 (원치 않는 시안 열림 방지)
    if (isSwipedRef.current) {
      isSwipedRef.current = false;
      return;
    }
    setSelectedTemplate(tpl || currentTpl);
    setIsModalOpen(true);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchEndX.current = touch.clientX; // 잔여 좌표 방지를 위해 동일 좌표로 리셋
    touchStartY.current = touch.clientY;
    touchEndY.current = touch.clientY;
    isSwipedRef.current = false;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // 세로 스크롤보다 가로 스와이프 의도가 뚜렷하고 50px 이상 이동한 경우에만 카드 전환
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      isSwipedRef.current = true;
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      // 합성 클릭 방지 타이머
      setTimeout(() => {
        isSwipedRef.current = false;
      }, 350);
    } else {
      isSwipedRef.current = false;
    }
  };

  return (
    <>
      <section id="hero-section" className="relative pt-12 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 px-4 bg-white overflow-hidden">
        {/* 상단 감성 카피라이팅 (간격 여유화 및 부드러운 스크롤 리빌) */}
        <ScrollReveal duration={800}>
          <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-stone-100 rounded-full text-[11px] font-mono tracking-widest text-stone-600 uppercase mb-4 sm:mb-5 shadow-2xs">
              <span>5 STYLES OF ATELIER</span>
              <span className="text-stone-300">|</span>
              <span className="font-sans font-medium text-stone-900">시안 5종 컬렉션</span>
            </div>
            <h1 className="font-editorial-title text-3xl sm:text-5xl text-gray-900 font-bold tracking-tight leading-[1.25] sm:leading-[1.2] mb-3 sm:mb-4">
              신랑·신부가 선택한 이유,<br />
              <span className="font-normal text-stone-700">완성도가 다르니까.</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-light max-w-md mx-auto leading-relaxed">
              카드를 터치하면 실제 모바일 청첩장이 전체화면으로 즉시 열립니다.
            </p>
          </div>
        </ScrollReveal>

        {/* 템플릿 퀵 셀렉터 탭 (넉넉한 간격 & 정돈된 버튼 디자인) */}
        <ScrollReveal delay={100} duration={800}>
          <div
            ref={tabsContainerRef}
            className="flex items-center justify-start sm:justify-center gap-2 max-w-xl mx-auto mb-8 sm:mb-10 px-4 overflow-x-auto no-scrollbar scroll-smooth"
          >
            {HERO_TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.id}
                ref={currentIndex === idx ? activeTabRef : null}
                onClick={() => {
                  isSwipedRef.current = false;
                  setCurrentIndex(idx);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap font-medium cursor-pointer ${
                  currentIndex === idx
                    ? 'bg-gray-900 text-white font-semibold shadow-sm scale-102'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200/80'
                }`}
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* 인터랙티브 카드 스와이퍼 영역 */}
        <ScrollReveal delay={200} duration={800}>
          <div
            className="relative max-w-sm mx-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
          {/* 이전/다음 데스크톱 버튼 */}
          <button
            onClick={handlePrev}
            aria-label="이전 시안"
            className="hidden sm:flex absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:text-black hover:scale-105 transition-all z-20"
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            aria-label="다음 시안"
            className="hidden sm:flex absolute -right-14 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-700 hover:text-black hover:scale-105 transition-all z-20"
          >
            ›
          </button>

          {/* 중앙 청첩장 목업 카드 (시안별 100% 차별화된 실물 디자인) */}
          <div
            onClick={() => openPreview(currentTpl)}
            className="group cursor-pointer relative bg-white rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-200 transition-all duration-300 hover:shadow-[0_25px_70px_rgba(0,0,0,0.13)] hover:-translate-y-1 select-none overflow-hidden"
          >
            {/* 카드 상단: 템플릿 메타 바 */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-gray-400 uppercase">
                  {currentTpl.option}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentTpl.badgeColor}`}>
                  {currentTpl.badge}
                </span>
              </div>

              {/* 눈 모양 미리보기 버튼 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPreview(currentTpl);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-900 group-hover:text-white transition-all flex items-center justify-center text-gray-700 shadow-xs border border-gray-200"
                title="실제 청첩장 전체화면 미리보기"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </button>
            </div>

            {/* ======================================================== */}
            {/* 🎯 시안별 완전히 다른 5종 비주얼 커버 렌더링 시작 */}
            {/* ======================================================== */}

            {/* [시안 01: 에어드랍 클래식] - 아이폰 AirDrop 팝업 알림 룩 (스크린샷 100% 비율 매칭) */}
            {currentTpl.id === 'basic' && (
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#3B2C24] p-3 flex items-center justify-center border border-gray-200 shadow-inner">
                {/* 원본 기반 웜 브라운 시그니처 블러 배경 (옵션 B) */}
                <div className="absolute inset-0 -z-10 bg-[#2D2018]">
                  <img
                    src="/airdrop-bg.jpg"
                    alt="에어드랍 시그니처 배경"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/5" />
                </div>

                {/* 중앙 에어드랍 카드 목업 (비율 419x658 정확 반영) */}
                <div className="w-[85%] bg-[#EFEFF4]/95 backdrop-blur-xl rounded-[22px] overflow-hidden shadow-2xl border border-white/50 text-center animate-in fade-in zoom-in-95 duration-300 flex flex-col">
                  {/* 상단 텍스트 */}
                  <div className="pt-3.5 pb-2 px-3 shrink-0">
                    <span className="text-[13px] font-bold text-[#111111] font-sans block leading-tight">
                      AirDrop
                    </span>
                    <p className="text-[10px] text-[#333333] mt-0.5 font-normal leading-tight font-sans">
                      우리의 결혼식을 공유하려고 합니다.
                    </p>
                    <span className="text-[10px] text-[#666666] block mt-0.5 leading-none">♡</span>
                  </div>

                  {/* 중앙 사진 (aspect-[419/440]) */}
                  <div className="relative aspect-[419/440] w-full bg-[#E5E5EA] overflow-hidden shrink-0">
                    <img
                      src={currentTpl.coverImage}
                      alt="Our Wedding Day"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* 하단 2분할 버튼 */}
                  <div className="grid grid-cols-2 divide-x divide-[#D1D1D6] border-t border-[#D1D1D6] bg-[#EFEFF4] text-[12px] font-sans shrink-0">
                    <div className="py-2 text-[#007AFF] font-normal">
                      거절
                    </div>
                    <div className="py-2 text-[#007AFF] font-bold">
                      수락
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* [시안 02: 클래식 에디토리얼] - 실제 EditorialIntro 화이트 룩북 슬리브 카드 1:1 완벽 매칭 */}
            {currentTpl.id === 'editorial' && (
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-stone-900/60 backdrop-blur-xs p-3 flex items-center justify-center border border-stone-200 shadow-inner">
                {/* 안쪽 화이트 매거진 룩북 슬리브 카드 */}
                <div className="w-[88%] bg-white rounded-none border border-stone-200/90 shadow-2xl p-3 flex flex-col justify-between text-stone-900 select-none animate-in fade-in zoom-in-95 duration-300">
                  {/* 상단 헤더: Volume & Issue */}
                  <div className="flex items-center justify-between text-[8px] tracking-[0.2em] text-stone-400 font-serif uppercase pb-1.5 border-b border-stone-200">
                    <span>VOL. 01 · SPECIAL ISSUE</span>
                    <span>WEDDING LOOKBOOK</span>
                  </div>

                  {/* 영문 타이틀 */}
                  <div className="text-center py-1">
                    <h4 className="font-serif text-[15px] tracking-normal leading-tight text-stone-900 font-medium">
                      Minjun &amp; Jimin
                    </h4>
                    <p className="font-serif text-[8.5px] tracking-[0.2em] text-stone-500 uppercase mt-0.5">
                      MAY 15, 2027
                    </p>
                  </div>

                  {/* 중앙 화보 사진 (aspect-[4/5]) */}
                  <div className="relative w-full aspect-[4/5] bg-stone-100 overflow-hidden border border-stone-200/80 my-1 group">
                    <img
                      src={currentTpl.coverImage}
                      alt="Editorial Lookbook Cover"
                      className="w-full h-full object-cover grayscale contrast-110"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[7px] font-serif tracking-widest uppercase px-1.5 py-0.5">
                      COVER SPREAD
                    </div>
                  </div>

                  {/* 신랑 신부 성함 및 홀 */}
                  <div className="text-center my-0.5">
                    <p className="font-serif text-[10px] text-stone-800 tracking-wider">
                      {currentTpl.groom} · {currentTpl.bride}
                    </p>
                    <p className="font-serif text-[8.5px] text-stone-400">
                      반얀트리 클럽 앤 스파 서울
                    </p>
                  </div>

                  {/* 하단 메인 액션 버튼 */}
                  <div className="w-full py-1.5 bg-stone-900 text-white text-[9px] font-serif tracking-[0.2em] uppercase text-center flex items-center justify-center gap-1 mt-1">
                    <span>Open The Lookbook</span>
                    <span>→</span>
                  </div>

                  {/* 서브 Decline 링크 & 바코드 */}
                  <div className="text-center pt-1 flex items-center justify-between text-[7px] font-mono text-stone-400 border-t border-stone-100 mt-1">
                    <span>EDITION NO. ISSUE</span>
                    <span className="underline uppercase cursor-pointer">Regretfully Decline</span>
                  </div>
                </div>
              </div>
            )}

            {/* [시안 03: 감성 플레이리스트] - 기준 이미지 1:1 완벽 일치 목업 카드 */}
            {currentTpl.id === 'playlist' && (
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#FAF8F5] p-3 flex flex-col justify-between border border-stone-200/80 shadow-inner">
                {/* 1. 상단 둥근 사진 (기준 이미지 aspect-[537/525]) */}
                <div className="relative w-full aspect-[537/525] rounded-[22px] overflow-hidden bg-stone-200 shadow-xs shrink-0">
                  <img
                    src={currentTpl.coverImage}
                    alt="플레이리스트 화보"
                    className="w-full h-full object-cover grayscale contrast-105"
                  />
                </div>

                {/* 2. 트랙 정보: 날짜, 이름(명조체), 1줄 고정 카피, 라인 하트 */}
                <div className="pt-2 px-1 text-left">
                  <span className="text-[9px] font-mono tracking-widest text-[#8E8E93] font-medium uppercase block">
                    APRIL 26, 2026
                  </span>
                  <div className="flex items-center justify-between">
                    <span 
                      style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
                      className="text-sm font-normal text-[#1C1C1E] flex items-center gap-1"
                    >
                      <span>{currentTpl.groom}</span>
                      <span className="text-xs">💗</span>
                      <span>{currentTpl.bride}</span>
                    </span>
                    <svg className="w-3.5 h-3.5 text-[#1C1C1E] fill-none stroke-current" strokeWidth="1.3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </div>
                  <p 
                    style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
                    className="text-[10px] text-[#8E8E93] tracking-[0.18em] mt-0.5"
                  >
                    저희  결혼합니다.
                  </p>
                </div>

                {/* 3. 재생 바 (기준 이미지 38% 위치 + 동그란 핸들) */}
                <div className="px-1 pt-1.5">
                  <div className="w-full h-[2.5px] bg-[#E5E5EA] rounded-full flex items-center">
                    <div className="w-[38%] h-full bg-[#1C1C1E] rounded-full relative flex items-center justify-end">
                      <div className="w-2 h-2 rounded-full bg-[#1C1C1E] shadow-xs -mr-1" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-[#8E8E93]">
                    <span>3:19</span>
                    <span>- 4:26</span>
                  </div>
                </div>

                {/* 4. 컨트롤러 5버튼 (기준 이미지와 동일하게 시원하게 펼쳐진 1:1 배치) */}
                <div className="flex items-center justify-between px-1.5 w-full pt-1.5 pb-0.5 text-[#1C1C1E]">
                  {/* 셔플 */}
                  <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M16 3h5v5" />
                    <path d="M4 20L21 3" />
                    <path d="M21 16v5h-5" />
                    <path d="M15 15l6 6" />
                    <path d="M4 4l5 5" />
                  </svg>

                  {/* 이전 곡 */}
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="3" height="16" rx="1.2" />
                    <path d="M20 5.2v13.6a1 1 0 0 1-1.6.8L9.2 12.8a1 1 0 0 1 0-1.6L18.4 4.4a1 1 0 0 1 1.6.8z" />
                  </svg>

                  {/* 중앙 재생 버튼 (기준 이미지 1:1 비례) */}
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shadow-xs shrink-0">
                    <svg className="w-3 h-3.5 fill-white" viewBox="0 0 20 24">
                      <rect x="2.5" y="3" width="5" height="18" rx="1.5" />
                      <rect x="12.5" y="3" width="5" height="18" rx="1.5" />
                    </svg>
                  </div>

                  {/* 다음 곡 */}
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M4 5.2v13.6a1 1 0 0 0 1.6.8L14.8 12.8a1 1 0 0 0 0-1.6L5.6 4.4a1 1 0 0 0-1.6.8z" />
                    <rect x="17" y="4" width="3" height="16" rx="1.2" />
                  </svg>

                  {/* 반복 (기준 이미지 원작 루프) */}
                  <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M17 2l4 4-4 4" />
                    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                    <path d="M7 22l-4-4 4-4" />
                    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                  </svg>
                </div>
              </div>
            )}

            {/* [시안 04: 시네마틱 모노리스] - 실제 CinematicTemplate 커버 Our First Page 1:1 완벽 매칭 */}
            {currentTpl.id === 'cinematic' && (
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-white p-3 flex flex-col justify-between border border-stone-200 shadow-inner">
                {/* 상단 테마 스위처 & 영문 소문자 성함 */}
                <div className="flex items-center justify-between text-[9px] font-mono tracking-wider text-stone-400 px-1 pt-0.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 rounded-full border border-stone-200 text-[8px]">
                    <span className="font-bold text-stone-900">Brightly</span>
                    <span className="text-stone-300">|</span>
                    <span className="text-stone-400">Midnight</span>
                  </div>
                  <div className="font-serif italic text-[11px] text-stone-500 tracking-wider lowercase">
                    {currentTpl.groom === '이진호' ? 'jinho & naeun' : `${currentTpl.groom} & ${currentTpl.bride}`}
                  </div>
                </div>

                {/* 중앙 흑백 시네마틱 화보 (aspect-[4/5] + Pinyon Script 필기체 타이틀 + 하단 화이트 페이드) */}
                <div className="relative w-full aspect-[4/5] overflow-hidden my-auto bg-stone-100 group border border-stone-200/60 shadow-xs">
                  <img
                    src={currentTpl.coverImage}
                    alt="Our First Page"
                    className="w-full h-full object-cover grayscale contrast-105"
                  />
                  {/* 하단 화이트 블렌딩 그라데이션 페이드 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent pointer-events-none" />

                  {/* 중앙 필기체 타이틀 (실제 청첩장과 100% 동일한 Pinyon Script 스타일) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                    <span 
                      style={{ fontFamily: "'Pinyon Script', 'Alex Brush', cursive" }}
                      className="text-[34px] sm:text-[38px] text-stone-900 leading-none drop-shadow-xs"
                    >
                      Our First Page
                    </span>
                    <p className="font-serif italic text-[8.5px] tracking-[0.25em] text-stone-700 uppercase mt-1">
                      We&apos;re Getting Married
                    </p>
                  </div>
                </div>

                {/* 하단 메타 바 (실제 청첩장 1:1 일치: 2027.11.07 / WITH LOVE / SUN 1:00PM) */}
                <div className="flex items-center justify-between font-mono text-[9px] tracking-wider text-stone-400 pb-0.5 px-1">
                  <span>2027.11.07</span>
                  <span className="font-serif italic text-stone-600 font-medium tracking-[0.18em]">
                    WITH LOVE
                  </span>
                  <span>SUN 1:00 PM</span>
                </div>
              </div>
            )}

            {/* [시안 05: 모던 씬] - 실제 SceneTemplate 인트로 블러 & 3줄 감성 문구 1:1 완벽 매칭 */}
            {currentTpl.id === 'scene' && (
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden p-3.5 flex flex-col justify-between border border-stone-200 shadow-inner">
                {/* 몽환적인 원본 사진 블러 배경 */}
                <div 
                  className="absolute inset-0 bg-cover bg-center filter blur-[14px] scale-110 opacity-75 pointer-events-none"
                  style={{ backgroundImage: `url(${currentTpl.coverImage})` }}
                />
                <div className="absolute inset-0 bg-white/45 pointer-events-none" />

                {/* 상단 3줄 정갈한 초대 문구 (실제 SceneTemplate 오프닝 문구) */}
                <div className="relative z-10 text-center text-[9.5px] leading-[1.8] text-stone-800 font-light pt-1">
                  <p>함께하는 오늘이</p>
                  <p>오래도록 기억될 아름다운 순간이 되기를 바라며</p>
                  <p className="font-normal text-stone-900">저희의 결혼식에 초대합니다</p>
                </div>

                {/* 중앙 메인 사진 액자 프레임 */}
                <div className="relative z-10 w-[74%] aspect-[4/5] mx-auto overflow-hidden bg-white shadow-xl border-2 border-white my-auto">
                  <img
                    src={currentTpl.coverImage}
                    alt="Main Wedding Couple"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 하단 신랑신부 한글 성함 & 링 & 예식 정보 (실제 SceneTemplate 하단 1:1 일치) */}
                <div className="relative z-10 text-center pb-1">
                  <div 
                    style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
                    className="text-[12.5px] font-normal text-stone-900 flex items-center justify-center gap-1.5"
                  >
                    <span>{currentTpl.groom}</span>
                    <span className="text-[10px] text-amber-700/80">💍</span>
                    <span>{currentTpl.bride}</span>
                  </div>
                  <p className="font-mono text-[8px] text-stone-600 tracking-wider mt-0.5">
                    2027.04.24 · 더채플앳논현
                  </p>
                </div>
              </div>
            )}

            {/* 카드 최하단 컨셉 요약 */}
            <div className="pt-3 text-center">
              <h3 className="text-sm font-bold text-gray-900">
                {currentTpl.title}
              </h3>
              <p className="text-[11px] text-gray-500 font-light mt-0.5">
                {currentTpl.concept}
              </p>
            </div>
          </div>

          {/* 인디케이터 Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {HERO_TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.id}
                onClick={() => {
                  isSwipedRef.current = false;
                  setCurrentIndex(idx);
                }}
                aria-label={`${tpl.title} 시안 선택`}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-gray-900'
                    : 'w-2 h-2 bg-gray-200 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* 카드 하단 CTA 버튼 2종 */}
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={`/create?template=${currentTpl.id}`}
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <span>이 시안으로 청첩장 제작하기</span>
              <span className="text-xs">📝</span>
            </Link>

            <button
              type="button"
              onClick={() => openPreview(currentTpl)}
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-all shadow-2xs"
            >
              전체화면 실시간 샘플 체험하기 (BGM 지원)
            </button>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* 실시간 모달 뷰어 */}
      <SamplePreviewModal
        isOpen={isModalOpen}
        template={selectedTemplate}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
