'use client';

import { useState, useEffect, useRef } from 'react';
import ScrollReveal from '../ScrollReveal';

// 실제 5대 시안의 시그니처 오프닝 데이터 (100% 실제 템플릿 코드 매핑)
const OPENING_PREVIEWS = [
  {
    id: 'basic',
    name: '에어드랍',
    fullName: '시안 01 · 에어드랍 클래식',
    badge: '인스타 화제 1위',
    tag: 'iOS AirDrop 수신 모달',
    desc: '웜 브라운 아치 배경 위로 iOS 정통 AirDrop 팝업이 뜨며 하객을 맞이하는 인스타 트렌드 오프닝입니다.',
  },
  {
    id: 'editorial',
    name: '에디토리얼',
    fullName: '시안 02 · 클래식 에디토리얼',
    badge: '매거진 룩북형',
    tag: '매거진 룩북 슬리브 카드',
    desc: '패션 화보집을 열어보듯 화이트 슬리브 카드에 영문 타이틀과 흑백 화보, OPEN THE LOOKBOOK 버튼이 어우러집니다.',
  },
  {
    id: 'playlist',
    name: '플레이리스트',
    fullName: '시안 03 · 감성 플레이리스트',
    badge: '뮤직 앨범 & BGM',
    tag: '미니멀 뮤직 플레이어 카드',
    desc: '은은한 크림톤 카드에 둥근 흑백 화보와 본명조 한글 성함, 감성 플레이어 컨트롤러가 결합된 시그니처 룩입니다.',
  },
  {
    id: 'cinematic',
    name: '시네마틱',
    fullName: '시안 04 · 시네마틱 모노리스',
    badge: '영화 포스터 룩',
    tag: 'Our First Page & 필름 룩',
    desc: '좌측 상단 Day/Night 테마 스위처와 신랑신부 상단에 얹힌 유려한 Our First Page 필기체 타이포가 돋보입니다.',
  },
  {
    id: 'scene',
    name: '모던 씬',
    fullName: '시안 05 · 모던 씬 (Scene 02)',
    badge: 'NEW 시안',
    tag: '몽환적 블러 & 3줄 감성 오프닝',
    desc: '사진 전체가 블러된 몽환적 배경에서 3줄의 초대글이 떠오른 뒤, 중앙의 사진이 쫘아악 선명하게 펼쳐집니다.',
  },
];

export default function SignatureShowcase() {
  // 피처 1: 5대 시안 실제 오프닝 선택 (기본: 플레이리스트)
  const [activeOpeningId, setActiveOpeningId] = useState('playlist');
  const [openingKey, setOpeningKey] = useState(0);

  // 시안 4: 시네마틱 낮/밤 테마 상태
  const [cinematicNight, setCinematicNight] = useState(false);

  // 시안 5: 모던 씬 언블러 단계 제어
  const [sceneStep, setSceneStep] = useState(0);

  // 피처 4: BGM 플레이어 상태 (실제 음원 및 재생/정지 토글)
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const bgmAudioRef = useRef(null);

  const toggleBgm = () => {
    if (!bgmAudioRef.current) return;
    if (isPlayingBgm) {
      bgmAudioRef.current.pause();
      setIsPlayingBgm(false);
    } else {
      bgmAudioRef.current
        .play()
        .then(() => setIsPlayingBgm(true))
        .catch((e) => console.log('BGM Play prevented:', e));
    }
  };

  // 주소 복사 토스트 상태
  const [copied, setCopied] = useState(false);

  const activeOpening = OPENING_PREVIEWS.find((p) => p.id === activeOpeningId) || OPENING_PREVIEWS[2];

  // 시안 5 전환 시 실제 템플릿의 단계별 타이머 재현
  useEffect(() => {
    if (activeOpeningId === 'scene') {
      setSceneStep(0);
      const t1 = setTimeout(() => setSceneStep(1), 300);
      const t2 = setTimeout(() => setSceneStep(2), 1100);
      const t3 = setTimeout(() => setSceneStep(3), 1900);
      const t4 = setTimeout(() => setSceneStep(4), 2800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [activeOpeningId, openingKey]);

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText('서울 강남구 압구정로 123 더채플앳청담');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplayOpening = () => {
    setOpeningKey((prev) => prev + 1);
  };

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 bg-[#FAF9F6] border-t border-slate-200/60 overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
        {/* ========================================================
            0. 섹션 헤더
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block px-3.5 py-1 bg-white border border-slate-200/80 rounded-full text-[10.5px] font-mono tracking-wider text-slate-600 uppercase mb-3 shadow-2xs font-medium">
              ATELIER SIGNATURE · EXCLUSIVE DETAILS
            </span>
            <h2
              className="text-2xl sm:text-4xl text-[#0f172a] font-extrabold tracking-[-0.03em] font-sans"
              style={{ lineHeight: 1.35 }}
            >
              청첩장 하나로 완성되는,<br />
              <span className="text-slate-400 font-normal">두 사람만을 위한 시그니처 경험.</span>
            </h2>
            <p
              className="mt-3 text-xs sm:text-sm text-slate-500 font-normal max-w-lg mx-auto break-keep leading-[1.65]"
            >
              링크를 여는 첫 3초의 오프닝부터 예식 당일 하객 안내까지,<br className="hidden sm:inline" />
              아틀리에 드 무키루만의 섬세한 디테일을 직접 체험해보세요.
            </p>
          </div>
        </ScrollReveal>

        {/* ========================================================
            FEATURE 01. 5대 시안 실제 고유 오프닝 쇼케이스 (100% 실물 픽셀 매칭)
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/80 shadow-xs">
            {/* 좌측: 설명 & 5단 시안 선택 버튼 */}
            <div className="lg:col-span-6 text-left space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold">
                  5대 시그니처 오프닝
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  {activeOpening.badge}
                </span>
              </div>

              <h3
                className="text-2xl sm:text-3xl text-[#0f172a] font-bold tracking-tight font-sans"
                style={{ lineHeight: 1.35 }}
              >
                열리는 첫 3초의 설렘,<br />
                시안마다 완전히 다른 첫인상
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-[1.7] break-keep">
                천편일률적인 똑같은 화면이 아닙니다. 두 사람의 사진 분위기와 테마에 맞추어 <b>실제 청첩장과 100% 동일한 고유의 오프닝 연출</b>이 하객의 시선을 가장 먼저 사로잡습니다.
              </p>

              {/* 5개 시안 탭 바 (글자 잘림 없는 단정한 5분할 그리드) */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-400 block mb-2 tracking-wider">
                  시안별 실제 오프닝 미리보기
                </span>
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
                  {OPENING_PREVIEWS.map((p) => {
                    const isSelected = activeOpeningId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActiveOpeningId(p.id);
                          handleReplayOpening();
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                          isSelected
                            ? 'bg-[#1e293b] text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 현재 선택된 오프닝 설명 박스 */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-amber-700 font-bold uppercase">{activeOpening.tag}</span>
                  <span className="text-slate-300">·</span>
                  <strong className="text-[#0f172a] font-bold text-xs">{activeOpening.fullName}</strong>
                </div>
                <span>{activeOpening.desc}</span>
              </div>
            </div>

            {/* 우측: 실제 스마트폰 목업 & 5대 시안 실제 디자인 1:1 렌더링 */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-[285px] sm:w-[315px] h-[500px] sm:h-[540px] bg-slate-950 rounded-[42px] p-3 shadow-2xl border-[6px] border-slate-800 flex flex-col overflow-hidden">
                {/* 상단 다이내믹 아일랜드 */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 shrink-0 z-30" />

                {/* 스마트폰 스크린 내부 */}
                <div key={`${activeOpeningId}-${openingKey}`} className="relative flex-1 rounded-[28px] bg-white overflow-hidden flex items-center justify-center select-none text-left">
                  
                  {/* =====================================================
                      [시안 01: 에어드랍 클래식 실제 실물 1:1 일치]
                      (EnvelopeIntro.jsx 실제 화면: 웜브라운 배경 + 정통 AirDrop 모달)
                     ===================================================== */}
                  {activeOpeningId === 'basic' && (
                    <div className="relative w-full h-full flex flex-col justify-between p-4 bg-[#2D2018] overflow-hidden text-center">
                      {/* 배경 웜 브라운 아치 햇살 이미지 */}
                      <img
                        src="/airdrop-bg.jpg"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

                      {/* 중앙 iOS 정통 AirDrop 모달 카드 (실제 EnvelopeIntro 1:1) */}
                      <div
                        className="relative z-10 my-auto w-full max-w-[245px] mx-auto bg-[#EFEFF4]/95 backdrop-blur-2xl rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/40 flex flex-col"
                        style={{ animation: 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                      >
                        {/* 상단 텍스트 헤더 */}
                        <div className="pt-4 pb-2 px-3 text-center shrink-0">
                          <h4 className="text-[15px] font-bold text-[#111111] tracking-tight font-sans">
                            AirDrop
                          </h4>
                          <p className="text-[11px] text-[#333333] mt-0.5 font-normal leading-tight font-sans">
                            우리의 결혼식을 공유하려고 합니다.
                          </p>
                          <div className="mt-0.5 text-xs text-[#666666] font-light">
                            ♡
                          </div>
                        </div>

                        {/* 중앙 사진: 꽉 찬 직사각형 */}
                        <div className="relative w-full aspect-[419/390] bg-[#E5E5EA] overflow-hidden shrink-0">
                          <img
                            src="/airdrop-couple.png"
                            alt="AirDrop Couple"
                            className="w-full h-full object-cover object-center"
                          />
                        </div>

                        {/* 하단 버튼 2분할 (거절 / 수락) */}
                        <div className="grid grid-cols-2 border-t border-[#3C3C43]/20 divide-x divide-[#3C3C43]/20 bg-[#EFEFF4]/60 text-[12px] font-semibold">
                          <span className="py-2.5 text-[#007AFF] text-center font-normal">거절</span>
                          <span className="py-2.5 text-[#007AFF] text-center font-bold">수락</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =====================================================
                      [시안 02: 클래식 에디토리얼 실제 실물 1:1 일치]
                      (EditorialIntro.jsx 실제 화면: 룩북 슬리브 카드 + 마스트헤드 + OPEN 버튼)
                     ===================================================== */}
                  {activeOpeningId === 'editorial' && (
                    <div className="relative w-full h-full p-3 bg-stone-900/80 backdrop-blur-md flex flex-col justify-center">
                      <div
                        className="relative w-full bg-white border border-stone-200/90 shadow-2xl p-4 flex flex-col justify-between text-left"
                        style={{ animation: 'fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                      >
                        {/* 상단 마스트헤드 */}
                        <div className="flex items-center justify-between text-[7.5px] tracking-[0.2em] text-stone-400 font-serif uppercase pb-1.5 border-b border-stone-200">
                          <span>VOL. 01 · SPECIAL ISSUE</span>
                          <span>WEDDING LOOKBOOK</span>
                        </div>

                        {/* 중앙 영문 이름 & 날짜 */}
                        <div className="text-center py-1.5">
                          <h4 className="font-serif text-base text-stone-900 tracking-normal leading-tight font-normal">
                            Minjun & Jimin
                          </h4>
                          <p className="font-serif text-[8px] tracking-[0.2em] text-stone-500 uppercase mt-0.5">
                            MAY 15, 2027
                          </p>
                        </div>

                        {/* 중앙 4:5 흑백 화보 (Cover Spread) */}
                        <div className="relative w-full aspect-[4/4.2] bg-stone-100 overflow-hidden border border-stone-200/80 my-1">
                          <img
                            src="/samples/editorial-cover.jpg"
                            alt="Editorial"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[7px] font-serif tracking-widest uppercase px-1.5 py-0.5">
                            COVER SPREAD
                          </div>
                        </div>

                        {/* 하단 한글 성함 & 웨딩홀 */}
                        <div className="text-center my-1">
                          <p className="font-serif text-[10px] text-stone-700 tracking-wider">
                            강민준 · 박지민
                          </p>
                          <p className="font-serif text-[8px] text-stone-400 tracking-wide">
                            반얀트리 클럽 앤 스파
                          </p>
                        </div>

                        {/* 하단 OPEN THE LOOKBOOK 버튼 */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-stone-200 text-[9px] font-serif uppercase tracking-widest text-center">
                          <span className="py-1.5 border border-stone-300 text-stone-400">DECLINE</span>
                          <span className="py-1.5 bg-stone-900 text-white font-medium shadow-xs">OPEN</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =====================================================
                      [시안 03: 감성 플레이리스트 실제 실물 1:1 일치]
                      (PlaylistTemplate.jsx 실제 화면: 크림톤 카드 + 둥근 흑백사진 + 강민우💗서유진)
                     ===================================================== */}
                  {activeOpeningId === 'playlist' && (
                    <div 
                      className="w-full h-full p-3 bg-[#FAF8F5] flex flex-col justify-between"
                      style={{ animation: 'fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                    >
                      <div className="w-full bg-[#FAF8F5] rounded-[26px] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-stone-200/80 flex flex-col justify-between h-full">
                        {/* 1. 상단 둥근 웨딩 흑백 화보 (aspect-[537/525]) */}
                        <div className="relative w-full aspect-[537/460] rounded-[20px] overflow-hidden bg-stone-200 shadow-xs shrink-0">
                          <img
                            src="/playlist-couple.png"
                            alt="강민우 & 서유진"
                            className="w-full h-full object-cover grayscale contrast-105"
                          />
                        </div>

                        {/* 2. 트랙 정보: 날짜, 이름(본명조), 1줄 감성 카피, 라인 하트 */}
                        <div className="px-1 pt-2.5 pb-0.5">
                          <span className="text-[8.5px] font-sans tracking-[0.2em] text-[#8E8E93] font-normal uppercase block mb-0.5">
                            APRIL 26, 2026
                          </span>
                          <div className="flex items-center justify-between">
                            <h4 
                              style={{ fontFamily: "'Noto Serif KR', serif" }}
                              className="text-[17px] font-normal text-[#1C1C1E] tracking-tight flex items-center gap-1"
                            >
                              <span>강민우</span>
                              <span className="text-[13px] mx-0.5">💗</span>
                              <span>서유진</span>
                            </h4>
                            <span className="text-rose-500 text-sm">♥</span>
                          </div>
                          <p className="font-serif text-[9.5px] text-stone-500 mt-0.5">
                            우리가 함께 걷는 계절의 멜로디
                          </p>
                        </div>

                        {/* 3. 프로그레스 바 & 컨트롤러 */}
                        <div className="px-1 pt-0.5 space-y-1.5">
                          <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                            <div className="w-2/5 h-full bg-[#1C1C1E] rounded-full" />
                          </div>
                          <div className="flex justify-between text-[7.5px] font-mono text-stone-400">
                            <span>01:18</span>
                            <span>03:19</span>
                          </div>
                          <div className="flex items-center justify-center gap-4 text-[#1C1C1E]">
                            <span className="text-[10px] text-stone-400">⏮</span>
                            <span className="w-7 h-7 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center text-[10px] shadow-xs">
                              ▶
                            </span>
                            <span className="text-[10px] text-stone-400">⏭</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =====================================================
                      [시안 04: 시네마틱 모노리스 실제 실물 1:1 일치]
                      (CinematicTemplate.jsx 실제 화면: Brightly/Midnight 토글 + Our First Page 필기체)
                     ===================================================== */}
                  {activeOpeningId === 'cinematic' && (
                    <div 
                      className={`relative w-full h-full p-4 flex flex-col justify-between transition-colors duration-500 select-none ${
                        cinematicNight ? 'bg-black text-white' : 'bg-white text-stone-900'
                      }`}
                      style={{ animation: 'fadeInScale 0.6s ease-out forwards' }}
                    >
                      {/* 좌측 상단 Brightly ↔ Midnight 실제 스위처 */}
                      <div className="flex items-center justify-between z-10 pt-1">
                        <div className={`inline-flex items-center p-0.5 rounded-full border shadow-2xs backdrop-blur-md text-[8px] ${
                          cinematicNight ? 'bg-stone-900 border-stone-700' : 'bg-stone-100 border-stone-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => setCinematicNight(false)}
                            className={`px-2 py-0.5 rounded-full font-medium ${!cinematicNight ? 'bg-stone-900 text-white' : 'text-stone-400'}`}
                          >
                            Brightly
                          </button>
                          <button
                            type="button"
                            onClick={() => setCinematicNight(true)}
                            className={`px-2 py-0.5 rounded-full font-medium ${cinematicNight ? 'bg-white text-stone-950 font-bold' : 'text-stone-400'}`}
                          >
                            Midnight
                          </button>
                        </div>
                        <span className="text-[8px] font-serif italic text-stone-400 lowercase">jinho · naeun</span>
                      </div>

                      {/* 중앙 4:5 흑백 화보 + Our First Page 필기체 오버레이 */}
                      <div className="relative w-full aspect-[4/4.8] overflow-hidden my-auto border border-stone-200/50">
                        <img
                          src="/samples/cinematic-cover.jpg"
                          alt="Cinematic"
                          className="w-full h-full object-cover grayscale contrast-105"
                        />
                        <div className={`absolute inset-0 pointer-events-none ${
                          cinematicNight 
                            ? 'bg-gradient-to-t from-black via-transparent to-black/30' 
                            : 'bg-gradient-to-t from-white via-white/30 to-transparent'
                        }`} />

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                          <h4 
                            style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
                            className={`text-2xl sm:text-3xl leading-tight font-normal mb-1 ${
                              cinematicNight ? 'text-white drop-shadow-md' : 'text-stone-900'
                            }`}
                          >
                            Our First Page
                          </h4>
                          <p className={`text-[8px] tracking-[0.25em] uppercase font-light ${
                            cinematicNight ? 'text-stone-300' : 'text-stone-700'
                          }`}>
                            We&apos;re Getting Married
                          </p>
                        </div>
                      </div>

                      {/* 하단 성함 & 날짜 */}
                      <div className="text-center pb-1 text-[9px] font-mono tracking-wider text-stone-400">
                        <span>2027. 11. 07 · THE SHILLA</span>
                      </div>
                    </div>
                  )}

                  {/* =====================================================
                      [시안 05: 모던 씬 실제 실물 1:1 일치]
                      (SceneTemplate.jsx 실제 화면: 몽환적 블러 배경 + 3줄 소개글 + 사진 언블러 펼침)
                     ===================================================== */}
                  {activeOpeningId === 'scene' && (
                    <div className="relative w-full h-full flex flex-col justify-between items-center p-4 bg-stone-100 overflow-hidden text-center">
                      {/* 배경 블러 사진 (몽환적 실루엣) */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center filter blur-[14px] scale-105 opacity-85 pointer-events-none"
                        style={{ backgroundImage: 'url(/samples/scene-cover.jpg)' }}
                      />
                      <div className="absolute inset-0 bg-white/20 pointer-events-none" />

                      {/* 1. 상단 3줄 감성 초대글 (단계별 페이드인) */}
                      <div className={`relative z-10 text-[11px] leading-relaxed text-stone-800 font-light transition-all duration-700 pt-3 ${
                        sceneStep >= 4 ? 'mb-1 translate-y-0' : 'mb-3 translate-y-6'
                      }`}>
                        <p className={`transition-opacity duration-500 ${sceneStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                          함께하는 오늘이
                        </p>
                        <p className={`transition-opacity duration-500 ${sceneStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                          오래도록 기억될 순간이 되기를 바라며
                        </p>
                        <p className={`transition-opacity duration-500 ${sceneStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                          저희의 결혼식에 초대합니다
                        </p>
                      </div>

                      {/* 2. 중앙 언블러 사진 펼침 애니메이션 */}
                      <div className={`relative z-10 w-full max-w-[210px] aspect-[4/4.6] overflow-hidden shadow-lg transition-all duration-1000 ${
                        sceneStep >= 4 
                          ? 'opacity-100 scale-100 filter-none' 
                          : 'opacity-40 scale-95 filter blur-md'
                      }`}>
                        <img
                          src="/samples/scene-cover.jpg"
                          alt="Scene"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 3. 하단 신랑 💍 신부 */}
                      <div className="relative z-10 pb-2 text-stone-900 font-serif text-[11px] flex items-center justify-center gap-1.5">
                        <span>최현우</span>
                        <span className="text-[9px] text-amber-700">💍</span>
                        <span>윤서아</span>
                      </div>
                    </div>
                  )}

                  {/* 다시 보기 버튼 */}
                  <button
                    type="button"
                    onClick={handleReplayOpening}
                    aria-label="오프닝 다시 보기"
                    className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[9.5px] font-medium rounded-full backdrop-blur-md flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer z-30"
                  >
                    <span>↺</span>
                    <span>다시 보기</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ========================================================
            FEATURE 02. 스마트 RSVP & 실시간 자동 집계 (Smart RSVP)
            - 신랑/신부측 참석 여부 및 식사 보증인원 실시간 집계
            - 웨딩홀 제출용 엑셀(CSV) 원클릭 다운로드
            - 모바일 전용 관리 링크 (로그인 없이 실시간 확인)
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/80 shadow-xs">
            {/* 좌측: 설명 */}
            <div className="lg:col-span-6 text-left space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold">
                  스마트 RSVP
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  보증인원 자동 집계
                </span>
              </div>

              <h3
                className="text-2xl sm:text-3xl text-[#0f172a] font-bold tracking-tight font-sans"
                style={{ lineHeight: 1.35 }}
              >
                수작업 정리는 그만,<br />
                참석 인원과 식사 여부를 한 번에
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-[1.7] break-keep">
                신랑·신부측 참석 여부, 동행 인원, 식사 여부, 전세버스 탑승까지 하객들이 응답하면 관리자 페이지에서 실시간으로 자동 분류 집계됩니다. 웨딩홀에 제출할 최종 보증인원을 엑셀 파일로 원클릭 다운로드하세요.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>신랑·신부측 구분 및 총 참석·식사 <b>실시간 통계 차트</b></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>웨딩홀 제출용 <b>엑셀(CSV) 원클릭 즉시 다운로드</b></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>양가 부모님도 편하게 확인 가능한 <b>모바일 전용 관리 링크 제공</b></span>
                </li>
              </ul>
            </div>

            {/* 우측: 실제 관리자 RSVP 대시보드 목업 */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-[340px] bg-slate-50 rounded-3xl p-5 border border-slate-200 shadow-md space-y-3.5 select-none text-left">
                {/* 상단 통계 헤더 카드 */}
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">전체 참석 응답 현황</span>
                    <span className="text-xs font-mono font-bold text-emerald-600">총 128건</span>
                  </div>
                  {/* 통계 프로그레스 바 */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="w-[75%] h-full bg-emerald-500 rounded-l-full" title="참석 96명" />
                    <div className="w-[25%] h-full bg-slate-300 rounded-r-full" title="불참 32명" />
                  </div>
                  {/* 4단 집계 그리드 */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">참석</span>
                      <strong className="text-xs font-bold text-slate-800">96명</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">식사</span>
                      <strong className="text-xs font-bold text-slate-800">88명</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">대절버스</span>
                      <strong className="text-xs font-bold text-slate-800">24명</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">불참</span>
                      <strong className="text-xs font-bold text-slate-400">32명</strong>
                    </div>
                  </div>
                </div>

                {/* 응답자 명단 테이블 목업 */}
                <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 space-y-2">
                  <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1.5 px-1">
                    <span>작성자</span>
                    <span className="text-center">참석</span>
                    <span className="text-center">인원</span>
                    <span className="text-center">식사</span>
                  </div>
                  <div className="grid grid-cols-4 text-xs items-center px-1 py-1 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-800 text-[11px] flex items-center gap-1">
                      <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-700">신랑</span>
                      김도현
                    </span>
                    <span className="text-center text-emerald-600 font-bold text-xs">○</span>
                    <span className="text-center text-[11px] text-slate-600">2명</span>
                    <span className="text-center text-emerald-600 font-bold text-xs">○</span>
                  </div>
                  <div className="grid grid-cols-4 text-xs items-center px-1 py-1">
                    <span className="font-medium text-slate-800 text-[11px] flex items-center gap-1">
                      <span className="text-[9px] px-1 py-0.5 rounded bg-rose-100 text-rose-700">신부</span>
                      이서연
                    </span>
                    <span className="text-center text-emerald-600 font-bold text-xs">○</span>
                    <span className="text-center text-[11px] text-slate-600">1명</span>
                    <span className="text-center text-emerald-600 font-bold text-xs">○</span>
                  </div>
                  {/* 실제 엑셀 다운로드 바 */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">웨딩홀 제출용</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span>📊</span>
                      <span>엑셀(CSV) 원클릭 다운로드</span>
                    </span>
                  </div>
                </div>

                {/* 실제 제공되는 신랑신부 전용 관리 링크 카드 */}
                <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔐</span>
                    <div>
                      <p className="font-bold text-[11px]">신랑·신부 전용 관리 링크</p>
                      <p className="text-[9px] text-slate-400">로그인 없이 실시간 참석자 열람 & 엑셀 다운</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ========================================================
            FEATURE 03. 예식 당일 안내 컨시어지 (Day Concierge)
            - 예식 당일 자동 활성화 (D-Day Live)
            - 네이버 지도 & 카카오내비 2대 길안내 원터치 연결 (티맵 제외)
            - 주소 복사 & 신랑신부가 등록한 주차/지하철/셔틀버스 교통편 안내 (가상 ATM 제거)
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/80 shadow-xs">
            {/* 좌측: 설명 */}
            <div className="lg:col-span-6 text-left space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-semibold">
                  당일 안내데스크
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  D-Day 자동 전환
                </span>
              </div>

              <h3
                className="text-2xl sm:text-3xl text-[#0f172a] font-bold tracking-tight font-sans"
                style={{ lineHeight: 1.35 }}
              >
                예식 당일, 청첩장이<br />
                하객을 위한 스마트 안내데스크가 됩니다
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-[1.7] break-keep">
                결혼식 당일이 되면 청첩장을 연 하객에게 길안내 특화 화면이 자동으로 펼쳐집니다. 처음 오는 식장도 길을 헤매지 않도록 식장 길찾기부터 남은 시간 카운트다운, 두 분이 직접 입력하신 주차와 대중교통 정보까지 꼭 필요한 정보만 첫 화면에 모아 안내합니다.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold">✓</span>
                  <span>예식 시작까지 남은 시간 <b>실시간 카운트다운</b></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold">✓</span>
                  <span><b>네이버 지도 · 카카오내비</b> 길안내 원터치 즉시 연결</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-700 font-bold">✓</span>
                  <span><b>주소 원클릭 복사</b> 및 두 분이 등록한 <b>주차·지하철·셔틀버스 상세 안내</b></span>
                </li>
              </ul>
            </div>

            {/* 우측: 당일 안내데스크 스마트폰 목업 (사이트 톤앤매너와 어울리는 세련된 라이트/크림 디자인) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-[285px] sm:w-[315px] bg-[#FAF8F5] rounded-[42px] p-4 shadow-2xl border-[6px] border-stone-800/90 select-none text-left space-y-3.5 overflow-hidden">
                {/* 상단 다이내믹 아일랜드 */}
                <div className="w-20 h-3.5 bg-black rounded-full mx-auto mb-1 shrink-0" />

                {/* 안내데스크 메인 카드 (실제 TodayConciergeCard 기반 감성 룩앤필) */}
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200/90 space-y-3">
                  {/* 상단 헤더: LIVE 펄스 + 성함 + 당일 자동 모드 뱃지 */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9.5px] font-mono text-stone-500 font-bold tracking-widest uppercase">
                          TODAY WEDDING
                        </span>
                      </div>
                      <h4 className="text-xs font-serif font-bold text-stone-900">
                        민준 ♥ 지민
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-[9px] font-semibold">
                      당일 자동 모드
                    </span>
                  </div>

                  {/* 예식 시작까지 카운트다운 박스 */}
                  <div className="p-3 bg-stone-900 text-white rounded-2xl text-center shadow-xs">
                    <span className="text-[9.5px] text-stone-400 block mb-0.5 font-light">
                      예식 시작까지
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono tracking-wider text-amber-300">
                      1시간 24분 전
                    </span>
                  </div>

                  {/* 식장 정보 & 주소 복사 */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-900 text-[11px] truncate">
                        📍 더채플앳청담 3층 커스티홀
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-200/60">
                      <span className="truncate pr-1">서울 강남구 압구정로 123</span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="shrink-0 px-2 py-0.5 bg-white border border-stone-300 hover:border-stone-400 rounded text-[9.5px] font-bold text-stone-700 transition-all cursor-pointer"
                      >
                        {copied ? '복사됨 ✓' : '주소복사'}
                      </button>
                    </div>
                  </div>

                  {/* 2대 내비게이션 원클릭 연결 (네이버 지도 & 카카오내비 - 티맵 제외) */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {/* 네이버 지도 */}
                    <div className="py-2.5 px-3 bg-[#03C75A] text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 bg-white text-[#03C75A] rounded-xs font-black text-[9px] flex items-center justify-center shrink-0">
                          N
                        </span>
                        <span className="text-[11px]">네이버지도</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-80">➔</span>
                    </div>

                    {/* 카카오내비 */}
                    <div className="py-2.5 px-3 bg-[#FEE500] text-stone-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 bg-stone-900 text-[#FEE500] rounded-xs font-black text-[9px] flex items-center justify-center shrink-0">
                          K
                        </span>
                        <span className="text-[11px]">카카오내비</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-70">➔</span>
                    </div>
                  </div>

                  {/* 신랑신부가 직접 등록한 실제 교통편·주차 정보 칩 */}
                  <div className="pt-2 border-t border-stone-100 space-y-1">
                    <span className="text-[9px] font-semibold text-stone-400 block tracking-wider uppercase">
                      교통 & 편의 안내
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[9.5px] text-stone-700 font-medium">
                        🅿️ 본관 2시간 무료 주차
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[9.5px] text-stone-700 font-medium">
                        🚇 7호선 강남구청역 도보 5분
                      </span>
                      <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[9.5px] text-stone-700 font-medium">
                        🚌 셔틀버스 10분 간격 운행
                      </span>
                    </div>
                  </div>
                </div>

                {/* 하단 청첩장 본문 바로보기 안내 */}
                <div className="text-center pt-0.5">
                  <span className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
                    <span>청첩장 전체 내용 보기</span>
                    <span>↓</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ========================================================
            FEATURE 04. 아틀리에 BGM & 감성 사운드웨이브 (Emotional BGM)
            - 실제 청첩장 우측 상단 BgmPlayer와 100% 픽셀 일치 (4-Bar 사운드웨이브 파동 버튼)
            - 실제 오디오 재생/일시정지 연동
            - 무키루 피아노 프리셋 & 커스텀 MP3 업로드 지원
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/80 shadow-xs">
            {/* 좌측: 설명 */}
            <div className="lg:col-span-6 text-left space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-rose-50 text-rose-800 rounded-full text-xs font-semibold">
                  감성 배경음악
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  실시간 BGM
                </span>
              </div>

              <h3
                className="text-2xl sm:text-3xl text-[#0f172a] font-bold tracking-tight font-sans"
                style={{ lineHeight: 1.35 }}
              >
                두 사람의 분위기를 담은 선율,<br />
                화면을 넘길 때마다 흐르는 감동
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-[1.7] break-keep">
                엄선된 잔잔한 피아노 멜로디 프리셋을 기본 제공하며, 두 분만의 특별한 소장용 MP3 음원도 자유롭게 등록할 수 있습니다. 청첩장 우측 상단의 미니멀 사운드웨이브 버튼으로 하객이 언제든 편안하게 음악을 켜고 끌 수 있습니다.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span>무키루 엄선 <b>감성 피아노 BGM 프리셋</b> 기본 내장</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span>두 사람만의 <b>소장용 MP3 음원 직접 등록 지원</b></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span>화면 우측 상단 <b>미니멀 사운드웨이브 원터치 컨트롤</b></span>
                </li>
              </ul>

              {/* BGM 재생 컨트롤 버튼 (실제 오디오 토글 연동) */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleBgm}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                      isPlayingBgm
                        ? 'bg-[#1e293b] text-white hover:bg-[#0f172a]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isPlayingBgm ? '⏸ 선율 일시정지' : '▶ 선율 미리듣기'}</span>
                    <div className="flex items-center justify-center gap-[2.5px] h-3.5 w-3.5 ml-1">
                      <span
                        className={`w-[2px] rounded-full transition-all duration-300 ${
                          isPlayingBgm ? 'bg-amber-400 wave-bar-1' : 'bg-slate-400 h-[3px]'
                        }`}
                      />
                      <span
                        className={`w-[2px] rounded-full transition-all duration-300 ${
                          isPlayingBgm ? 'bg-amber-400 wave-bar-2' : 'bg-slate-400 h-[7px]'
                        }`}
                      />
                      <span
                        className={`w-[2px] rounded-full transition-all duration-300 ${
                          isPlayingBgm ? 'bg-amber-400 wave-bar-3' : 'bg-slate-400 h-[10px]'
                        }`}
                      />
                      <span
                        className={`w-[2px] rounded-full transition-all duration-300 ${
                          isPlayingBgm ? 'bg-amber-400 wave-bar-4' : 'bg-slate-400 h-[5px]'
                        }`}
                      />
                    </div>
                  </button>
                  {isPlayingBgm && (
                    <span className="text-[11px] text-amber-700 font-mono animate-pulse">
                      Playing ♫
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-normal">
                  현재 재생 트랙: <span className="text-slate-600 font-medium">Two of Us (Piano Ver.) · 아틀리에 드 무키루 프리셋</span>
                </p>
              </div>
            </div>

            {/* 우측: 실제 청첩장 화면 & 우측 상단 실제 BgmPlayer 아이콘 1:1 매칭 목업 (하단 가상 플레이어 카드 전면 제거) */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-[285px] sm:w-[315px] h-[500px] sm:h-[540px] bg-slate-950 rounded-[42px] p-3 shadow-2xl border-[6px] border-slate-800 flex flex-col overflow-hidden select-none">
                {/* 상단 다이내믹 아일랜드 */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 shrink-0 z-30" />

                {/* 실제 청첩장 내부 화면 목업 (실제 시안과 100% 동일한 미니멀 커버 화면) */}
                <div className="relative flex-1 rounded-[28px] bg-stone-900 overflow-hidden flex flex-col justify-between p-4 text-left">
                  {/* 배경 웨딩 화보 */}
                  <img
                    src="/samples/editorial-cover.jpg"
                    alt="Wedding"
                    className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />

                  {/* 1. 우측 상단 실제 청첩장의 시그니처 BgmPlayer 아이콘 (100% 픽셀 일치) */}
                  <div className="relative z-30 flex items-center justify-between pt-1">
                    <span className="text-[8.5px] font-mono tracking-widest text-white/80 uppercase px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md">
                      VOL.01 · LOOKBOOK
                    </span>

                    {/* 실제 BgmPlayer 플로팅 버튼 & BGM ON/OFF 뱃지 */}
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full backdrop-blur-md transition-all ${
                        isPlayingBgm ? 'bg-amber-400/90 text-stone-950' : 'bg-black/50 text-white/70'
                      }`}>
                        {isPlayingBgm ? 'BGM ON' : 'BGM OFF'}
                      </span>

                      <button
                        type="button"
                        onClick={toggleBgm}
                        aria-label={isPlayingBgm ? '음악 정지' : '음악 재생'}
                        className="w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white shadow-lg backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-[2px] h-4 w-4">
                          <span
                            className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                              isPlayingBgm ? 'wave-bar-1' : 'h-[3px]'
                            }`}
                          />
                          <span
                            className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                              isPlayingBgm ? 'wave-bar-2' : 'h-[7px]'
                            }`}
                          />
                          <span
                            className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                              isPlayingBgm ? 'wave-bar-3' : 'h-[11px]'
                            }`}
                          />
                          <span
                            className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                              isPlayingBgm ? 'wave-bar-4' : 'h-[5px]'
                            }`}
                          />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. 중앙 은은한 화보 타이포그래피 */}
                  <div className="relative z-20 text-center my-auto text-white">
                    <p className="font-serif italic text-xs tracking-[0.2em] text-white/80 uppercase">
                      Two of Us
                    </p>
                    <h4 className="font-serif text-2xl font-normal tracking-wide mt-1.5 drop-shadow-md">
                      Minjun & Jimin
                    </h4>
                    <p className="font-serif text-[10px] text-white/70 tracking-widest uppercase mt-1">
                      May 15, 2027
                    </p>
                  </div>

                  {/* 3. 하단 실제 청첩장 커버 푸터 안내 (가상 플레이어 카드 없이 시야를 가리지 않는 단정한 화면) */}
                  <div className="relative z-20 text-center pb-2 text-white/80 space-y-1">
                    <p className="text-[11px] font-serif tracking-wider">
                      강민준 · 박지민의 결혼식에 초대합니다
                    </p>
                    <p className="text-[9px] font-mono tracking-widest text-white/50 uppercase">
                      Scroll down to view invitation ↓
                    </p>
                  </div>
                </div>
              </div>

              {/* 스마트폰 목업 하단 안내 캡션 */}
              <p className="mt-3 text-[11px] text-slate-500 text-center break-keep">
                💡 청첩장 화면을 가리지 않도록, <b>우측 상단 미니멀 아이콘</b>으로 음악을 자유롭게 켜고 끌 수 있습니다.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* 실제 배경음악 재생용 오디오 태그 */}
        <audio
          ref={bgmAudioRef}
          src="https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3"
          loop
          preload="none"
          onPlay={() => setIsPlayingBgm(true)}
          onPause={() => setIsPlayingBgm(false)}
        />
      </div>

      {/* 커스텀 키프레임 애니메이션 */}
      <style jsx>{`
        @keyframes popIn {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes soundWave1 {
          0%, 100% { height: 3px; }
          50% { height: 13px; }
        }
        @keyframes soundWave2 {
          0%, 100% { height: 13px; }
          50% { height: 4px; }
        }
        @keyframes soundWave3 {
          0%, 100% { height: 5px; }
          50% { height: 15px; }
        }
        @keyframes soundWave4 {
          0%, 100% { height: 11px; }
          50% { height: 4px; }
        }
        .wave-bar-1 { animation: soundWave1 1s ease-in-out infinite; }
        .wave-bar-2 { animation: soundWave2 0.8s ease-in-out infinite 0.15s; }
        .wave-bar-3 { animation: soundWave3 1.1s ease-in-out infinite 0.3s; }
        .wave-bar-4 { animation: soundWave4 0.9s ease-in-out infinite 0.1s; }
      `}</style>
    </section>
  );
}
