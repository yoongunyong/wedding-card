'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
import TodayConciergeCard from '@/components/TodayConciergeCard';
import KakaoMap from '@/components/KakaoMap';
import EditorialRsvpModal from '../editorial/EditorialRsvpModal';
import EditorialGuestbookModal from '../editorial/EditorialGuestbookModal';
import EditorialGalleryModal from '../editorial/EditorialGalleryModal';
import { supabase } from '@/lib/supabase';

export default function CinematicTemplate({ invitation }) {
  // 1. ☀️ Brightly (Day) ↔ 🌙 Midnight (Night) 듀얼 테마 스위처
  const [isNightMode, setIsNightMode] = useState(false);

  // 2. 모달 제어 상태
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 3. 갤러리 탭 (Our Story vs Wedding Photo)
  const [galleryTab, setGalleryTab] = useState('story');

  // 4. 축의금 계좌 탭 (신랑측에게 vs 신부측에게)
  const [accountTab, setAccountTab] = useState('groom');

  // 5. 정보(Information) 캐러셀 인덱스
  const [activeInfoIdx, setActiveInfoIdx] = useState(0);
  const infoContainerRef = useRef(null);

  // 6. 데이터 언패킹 & 샘플 모드 판별
  // 공식 데모 청첩장(slug: 'cinematic') 또는 실시간 샘플 프리뷰일 때만 데모용 플레이스홀더를 제공하고,
  // 실제 고객 청첩장에서는 고객이 미입력한 항목에 대해 타인의 정보나 더미가 절대 노출되지 않도록 공백/미노출 처리합니다.
  const isSample = invitation?.slug === 'cinematic' || invitation?.is_sample_preview === true;

  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  const showCountdownSection = config.show_countdown !== false;
  const showGallerySection = config.show_gallery !== false;
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;

  // 갤러리 이미지 안전 파싱 & Our Story / Wedding Photo 컬렉션 분리
  const rawGallery = invitation?.gallery_images;
  const userGallery = useMemo(() => {
    if (Array.isArray(rawGallery) && rawGallery.length > 0) return rawGallery;
    if (typeof rawGallery === 'string') {
      try {
        const parsed = JSON.parse(rawGallery);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return null;
  }, [rawGallery]);

  const defaultOurStoryImages = useMemo(() => isSample ? [
    '/samples/cinematic-cover.jpg',
    '/samples/ending-02-stairs.jpg',
    '/samples/garden-couple.jpg',
    '/samples/photo-13-ring-laugh.jpg',
    '/samples/scene-cover.jpg',
  ] : [], [isSample]);

  const defaultWeddingPhotoImages = useMemo(() => isSample ? [
    '/samples/editorial-cover.jpg',
    '/samples/photo-01-walk.jpg',
    '/samples/photo-11-rose-hug.jpg',
    '/samples/cinematic-cover.jpg',
    '/samples/garden-couple.jpg',
  ] : [], [isSample]);

  const ourStoryImages = useMemo(() => {
    if (!userGallery) return defaultOurStoryImages;
    if (userGallery.length <= 2) return userGallery;
    const mid = Math.ceil(userGallery.length / 2);
    return userGallery.slice(0, mid);
  }, [userGallery, defaultOurStoryImages]);

  const weddingPhotoImages = useMemo(() => {
    if (!userGallery) return defaultWeddingPhotoImages;
    if (userGallery.length <= 2) return userGallery;
    const mid = Math.ceil(userGallery.length / 2);
    return userGallery.slice(mid);
  }, [userGallery, defaultWeddingPhotoImages]);

  const activeGalleryImages = galleryTab === 'wedding' ? weddingPhotoImages : ourStoryImages;
  const galleryImages = userGallery || (isSample ? [...defaultOurStoryImages, ...defaultWeddingPhotoImages] : []);

  // 대표 이미지 매핑 (고객 등록 사진 최우선 매핑, 미등록 시 타인의 사진이 노출되지 않도록 제어)
  const mainImage = images.main || images.cover || invitation?.main_image || (isSample ? '/samples/cinematic-cover.jpg' : '');
  const celebrationPhoto = images.couple_profile || images.couple || extra.couple_profile_image || (isSample ? '/samples/garden-couple.jpg' : images.main || '');
  const bridePhoto = images.bride_profile || extra.bride_profile_image || invitation?.bride_photo || (isSample ? '/samples/bride-solo.jpg' : '');
  const groomPhoto = images.groom_profile || extra.groom_profile_image || invitation?.groom_photo || (isSample ? '/samples/groom-solo.jpg' : '');
  const datePhoto = images.ending || (userGallery && userGallery.length > 1 ? userGallery[1] : null) || (isSample ? '/samples/ending-04-classic.jpg' : '');

  // 성함 데이터 (하드코딩 더미 성함 완전 제거)
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const groomFirstEn = invitation?.groom_first_name_en || (invitation?.groom_name_en || '').split(' ')[0] || '';
  const brideFirstEn = invitation?.bride_first_name_en || (invitation?.bride_name_en || '').split(' ')[0] || '';
  const displayNamesEn = invitation?.main_names_en || (groomFirstEn && brideFirstEn ? `${groomFirstEn} & ${brideFirstEn}` : '');

  // 부모님 성함 (하드코딩 더미 완전 제거)
  const groomParents = [
    invitation?.groom_father && `${invitation.groom_father}${config.groom_father_deceased ? ' (故)' : ''}`,
    invitation?.groom_mother && `${invitation.groom_mother}${config.groom_mother_deceased ? ' (故)' : ''}`,
  ].filter(Boolean).join(' · ');

  const brideParents = [
    invitation?.bride_father && `${invitation.bride_father}${config.bride_father_deceased ? ' (故)' : ''}`,
    invitation?.bride_mother && `${invitation.bride_mother}${config.bride_mother_deceased ? ' (故)' : ''}`,
  ].filter(Boolean).join(' · ');

  const groomRelation = config.groom_relation || invitation?.groom_relation || '';
  const brideRelation = config.bride_relation || invitation?.bride_relation || '';

  // 날짜 계산 (샘플 모드일 때만 기본 데모 일시 사용, 실제 고객은 미입력 시 공백 처리)
  const weddingDateStr = invitation?.wedding_date || (isSample ? '2026-12-24 15:00:00' : '');
  const targetDate = useMemo(() => {
    if (!weddingDateStr) return null;
    const normalized = typeof weddingDateStr === 'string' ? weddingDateStr.replace(' ', 'T') : weddingDateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }, [weddingDateStr]);

  // D-Day 계산
  const [timeLeft, setTimeLeft] = useState({ totalDays: 0, isPast: false });
  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const isPast = diffMs < 0;
      const totalDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      setTimeLeft({ totalDays, isPast });
    };
    calc();
    const timer = setInterval(calc, 60000);
    return () => clearInterval(timer);
  }, [targetDate]);

  // 캘린더 데이터 생성 (숫자만 7열)
  const calendarData = useMemo(() => {
    if (!targetDate) return null;
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-based
    const weddingDay = targetDate.getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { year, month: month + 1, weddingDay, firstDayIndex, totalDays };
  }, [targetDate]);

  // 포맷된 날짜 텍스트
  const formattedDates = useMemo(() => {
    if (!targetDate) return { fullDateDot: '', monthScript: '', timeStr: '', timeStrShort: '', dowEn: '', fullEn: '' };
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dowsEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const d = targetDate.getDate();
    const dow = dowsEn[targetDate.getDay()];
    const monthStr = months[m];

    const hours = targetDate.getHours();
    const minutes = targetDate.getMinutes();
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const timeFormatted = `${period} ${displayHour}:${String(minutes).padStart(2, '0')}`;
    const timeFormattedShort = `${period} ${displayHour}:${String(minutes).padStart(2, '0')}`;

    return {
      fullDateDot: `${y}.${String(m + 1).padStart(2, '0')}.${String(d).padStart(2, '0')}`,
      monthScript: `${monthStr}.`,
      timeStr: timeFormatted,
      timeStrShort: timeFormattedShort,
      dowEn: dow.slice(0, 3).toUpperCase(),
      fullEn: `${dow}, ${monthStr} ${d}, ${y}`,
    };
  }, [targetDate]);

  // 예식장 정보 (하드코딩 더미 완전 제거 -> 미입력 시 공백 처리)
  const venueFullName = [invitation?.venue_name, config?.venue_hall || invitation?.venue_hall].filter(Boolean).join(' ');
  const venueAddress = invitation?.venue_address || '';

  // 안내 카드 리스트 (미등록 시 실제 고객 청첩장에서는 미노출)
  const infoCards = useMemo(() => {
    if (Array.isArray(invitation?.info_notices) && invitation.info_notices.length > 0) {
      return invitation.info_notices;
    }
    if (isSample) {
      return [
        {
          title: 'Special Moment',
          subtitle: 'Special Moment',
          content: '평생 간직할 소중한 추억을 만들어가는 시간입니다.\n웨딩의 모든 순간이 특별한 기억으로 남을 것입니다.',
          image: '/samples/cinematic-cover.jpg',
        },
        {
          title: 'Celebration Time',
          subtitle: 'Celebration Time',
          content: '사랑하는 사람들과 함께 축하하며 즐거운 시간을 보내세요.\n여러분의 참석이 저희에게 큰 기쁨이 됩니다.',
          image: '/samples/garden-couple.jpg',
        },
        {
          title: 'Dining Experience',
          subtitle: 'Dining Experience',
          content: '정성껏 준비한 다양한 메뉴를 맛보시며 편안한 식사 시간을 가지세요.\n맛있는 음식과 함께 즐거운 대화를 나누실 수 있습니다.',
          image: '/samples/photo-10-orchid-night.jpg',
        },
        {
          title: 'Reception Party',
          subtitle: 'Wedding Ceremony',
          content: '아름다운 예식장에서 진행되는 특별한 순간을 함께해주세요.\n소중한 분들과 함께하는 행복한 시간이 될 것입니다.',
          image: '/samples/scene-cover.jpg',
        },
      ];
    }
    return [];
  }, [invitation?.info_notices, isSample]);

  // 계좌 분리 (미등록 시 실제 고객 청첩장에서는 계좌 섹션 미노출)
  const allAccounts = useMemo(() => {
    const raw = invitation?.accounts;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    if (isSample) {
      return [
        { group: '신랑측', name: '신랑 데이', holder: '데이', title: '신랑', bank: '카카오뱅크', number: '1002-753-478932' },
        { group: '신랑측', name: '아버지 루카스', holder: '루카스', title: '아버지', bank: '우리은행', number: '8223-7323-4123556' },
        { group: '신랑측', name: '어머니 소피아', holder: '소피아', title: '어머니', bank: 'IBK 기업은행', number: '76443-2231-22345' },
        { group: '신부측', name: '신부 이브', holder: '이브', title: '신부', bank: '카카오뱅크', number: '1002-753-478932' },
        { group: '신부측', name: '아버지 에이든', holder: '에이든', title: '아버지', bank: '우리은행', number: '8223-7323-4123556' },
      ];
    }
    return [];
  }, [invitation?.accounts, isSample]);

  const groomAccounts = allAccounts.filter((a) => a.group === '신랑측' || a.name?.includes('신랑') || a.holder?.includes('신랑'));
  const brideAccounts = allAccounts.filter((a) => a.group === '신부측' || a.name?.includes('신부') || a.holder?.includes('신부'));
  const currentAccounts = accountTab === 'groom' ? groomAccounts : brideAccounts;

  // 교통편 리스트 (미등록 시 실제 고객 청첩장에서는 미노출)
  const transportationList = useMemo(() => {
    if (Array.isArray(invitation?.transportation) && invitation.transportation.length > 0) {
      return invitation.transportation;
    }
    if (isSample) {
      return [
        { title: '셔틀버스', content: '행사 당일 30분 간격 운행\n청담역 9번 출구 인근 탑승' },
        { title: 'SRT/KTX', content: '수서역 하차 ➔ 택시 15분 내외' },
        { title: '버스', content: '간선 143, 240, 301 / 지선 2412, 4312\n청담동 주민센터 정류장 하차 후 도보 5분' },
        { title: '자차이용', content: '네비게이션: 더채플앳청담\n주차: 건물 내 지하주차장 이용' },
      ];
    }
    return [];
  }, [invitation?.transportation, isSample]);

  // 클립보드 복사
  const handleCopy = (text, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      alert(`${label} 복사되었습니다.`);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert(`${label} 복사되었습니다.`);
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `${displayNamesEn || `${groomName} ♥ ${brideName}`} 결혼식에 초대합니다`;
    const shareDesc = [formattedDates.fullDateDot, venueFullName].filter(Boolean).join(' | ');
    const shareImg = images.cover || mainImage || '';

    if (typeof window !== 'undefined' && window.Kakao && window.Kakao.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: shareTitle,
            description: shareDesc,
            imageUrl: shareImg,
            link: { mobileWebUrl: currentUrl, webUrl: currentUrl },
          },
          buttons: [
            { title: '청첩장 보기', link: { mobileWebUrl: currentUrl, webUrl: currentUrl } },
          ],
        });
        return;
      } catch (err) {
        console.warn('Kakao share error:', err);
      }
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareDesc, url: currentUrl });
        return;
      } catch {}
    }

    handleCopy(currentUrl, '청첩장 링크가');
  };

  // 폰트 스타일 헬퍼
  const scriptFont = { fontFamily: "'Pinyon Script', 'Alex Brush', cursive" };
  const serifItalic = { fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", fontStyle: 'italic' };

  return (
    <div className={`w-full max-w-[430px] min-h-screen flex flex-col font-sans relative mx-auto transition-colors duration-500 selection:bg-stone-500 selection:text-white ${
      isNightMode ? 'bg-[#000000] text-stone-100' : 'bg-white text-stone-900'
    }`}>
      
      {/* 카카오 SDK */}
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Kakao && !window.Kakao.isInitialized()) {
            const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
            if (kakaoKey) window.Kakao.init(kakaoKey);
          }
        }}
      />

      {/* 예식 당일 안내 데스크 (당일 자동 전환) */}
      <TodayConciergeCard invitation={invitation} />

      {/* ========================================================
      {/* ========================================================
          00. 좌측 상단 플로팅 테마 스위처 (☀️ Brightly ↔ 🌙 Midnight)
              (우측 상단 BGM 플레이어와 겹치지 않도록 좌측 상단에 정갈하게 배치)
          ======================================================== */}
      <div 
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
        className="fixed left-5 z-40"
      >
        <div className={`flex items-center p-0.5 rounded-full border shadow-sm backdrop-blur-md transition-all ${
          isNightMode ? 'bg-stone-900/90 border-stone-800' : 'bg-white/95 border-stone-200'
        }`}>
          <button
            type="button"
            onClick={() => setIsNightMode(false)}
            className={`px-3 py-1 rounded-full text-[10px] font-sans tracking-wide transition-all cursor-pointer ${
              !isNightMode
                ? 'bg-stone-900 text-white font-medium shadow-2xs'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Brightly
          </button>
          <button
            type="button"
            onClick={() => setIsNightMode(true)}
            className={`px-3 py-1 rounded-full text-[10px] font-sans tracking-wide transition-all cursor-pointer ${
              isNightMode
                ? 'bg-white text-stone-950 font-medium shadow-2xs'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Midnight
          </button>
        </div>
      </div>

      {/* ========================================================
          01. 커버 섹션 (Our First Page)
          ======================================================== */}
      <section className="relative w-full pt-[calc(env(safe-area-inset-top,0px)+3.8rem)] pb-12 px-5 text-center select-none">
        {/* 상단 서브 인디케이터 (신랑/신부 영문 퍼스트네임 소문자 동적 표시) */}
        {(groomFirstEn || brideFirstEn) && (
          <div 
            style={serifItalic}
            className="flex items-center justify-between text-xs text-stone-400 mb-5 px-1 tracking-wider lowercase"
          >
            <span>{groomFirstEn ? groomFirstEn.toLowerCase() : ''}</span>
            <span>{brideFirstEn ? brideFirstEn.toLowerCase() : ''}</span>
          </div>
        )}

        {/* 메인 흑백 시네마틱 화보 프레임 (하단 흰색 블렌딩 페이드) */}
        {mainImage && (
          <div className="relative w-full aspect-[4/5] rounded-none overflow-hidden mx-auto mb-6 bg-stone-100 dark:bg-stone-900 group">
            <img
              src={mainImage}
              alt="Our First Page"
              className="w-full h-full object-cover object-center grayscale contrast-105"
            />

            {/* 하단 화이트 블렌딩 그라데이션 페이드 오버레이 */}
            <div className={`absolute inset-0 pointer-events-none ${
              isNightMode 
                ? 'bg-gradient-to-t from-[#000000] via-transparent to-black/20' 
                : 'bg-gradient-to-t from-white via-white/40 to-transparent'
            }`} />

            {/* 메인 커버 타이틀 (영상: 신랑신부 상단에 검은색 필기체) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <h1 
                style={scriptFont}
                className={`text-[46px] sm:text-[54px] leading-tight font-normal mb-1.5 ${
                  isNightMode ? 'text-white drop-shadow-md' : 'text-stone-900'
                }`}
              >
                Our First Page
              </h1>
              <p 
                style={serifItalic}
                className={`text-[11px] sm:text-[12px] tracking-[0.25em] uppercase font-light ${
                  isNightMode ? 'text-stone-300' : 'text-stone-700'
                }`}
              >
                We&apos;re Getting Married
              </p>
            </div>
          </div>
        )}

        {/* 커버 하단 메타 (2026.12.24 / WITH LOVE / THU 3:00PM - 구분선 없음) */}
        <div className="flex items-center justify-between font-mono text-[10.5px] tracking-wider text-stone-400 pt-1 px-1">
          <span>{formattedDates.fullDateDot}</span>
          <span 
            style={serifItalic}
            className="text-stone-500 font-medium tracking-[0.2em]"
          >
            WITH LOVE
          </span>
          <span>{formattedDates.dowEn} {formattedDates.timeStrShort}</span>
        </div>
      </section>

      {/* ========================================================
          02. CELEBRATE! & OUR WEDDING PARTY
          ======================================================== */}
      <section className="py-16 px-5 text-center">
        <ScrollReveal>
          {/* 상단 별표 심볼 */}
          <div className="text-sm tracking-widest text-stone-400 mb-2">✶</div>
          <span 
            style={serifItalic}
            className="text-xs sm:text-[13px] tracking-[0.3em] uppercase text-stone-500 block mb-6 font-semibold"
          >
            CELEBRATE!
          </span>

          {/* 중간 시네마틱 가로 흑백 액자 */}
          {celebrationPhoto && (
            <div className="w-full max-w-[340px] aspect-[16/9] mx-auto rounded-none overflow-hidden shadow-xs mb-8 bg-stone-100 dark:bg-stone-900">
              <img
                src={celebrationPhoto}
                alt="Celebration moment"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          )}

          {/* 영상 1:1 3단 타이틀 (OUR, / WEDDING / Party) */}
          <div 
            style={serifItalic}
            className={`text-2xl sm:text-[28px] leading-snug mb-3 ${
              isNightMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            <div>OUR,</div>
            <div>WEDDING</div>
            <div 
              style={scriptFont}
              className="text-3xl sm:text-4xl not-italic mt-0.5"
            >
              Party
            </div>
          </div>

          {formattedDates.fullDateDot && (
            <p className="font-mono text-xs text-stone-400 tracking-wider">
              {formattedDates.fullDateDot} {formattedDates.timeStr}
            </p>
          )}
        </ScrollReveal>
      </section>

      {/* ========================================================
          03. 모시는 글 & 2분할 흑백 인물 스냅 (Bride / Groom)
          ======================================================== */}
      {/* ========================================================
          03. 모시는 글 & 2분할 흑백 인물 스냅 (Bride / Groom)
          ======================================================== */}
      <section className="py-16 px-5 text-center">
        <ScrollReveal>
          {/* 모시는 글 본문 (미입력 시 가짜 더미 텍스트 노출 차단) */}
          {(invitation?.message || isSample) && (
            <div className={`text-xs sm:text-[13px] leading-[2.6] font-light max-w-[320px] mx-auto whitespace-pre-line break-keep mb-12 ${
              isNightMode ? 'text-stone-300' : 'text-stone-700'
            }`}>
              {invitation?.message || `서로에게 행복을 주는 사람을 만났습니다.
웃는 모습이 너무나 예쁜 그 사람을 만났습니다.
운명처럼 만나게 된 우리의 인연
그 인연에 이끌려 이제 영원을 함께 약속하려 합니다.
저희의 하나 됨을 지켜보아 주시고 격려해 주시면
더 없는 기쁨으로 평생 간직하겠습니다.

둘이 함께 맞이하는 3번째 겨울,
저희 두 사람 여러분 앞에 결혼합니다.
앞으로 맞이할 저희의 봄날을 축복해 주세요.`}
            </div>
          )}

          {/* 2분할 신랑 & 신부 흑백 인물 스냅 사진 (사진이 등록된 경우에만 사진 프레임 노출) */}
          {(bridePhoto || groomPhoto) ? (
            <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto mb-10">
              {/* 신부 카드 */}
              <div className="flex flex-col items-center">
                {bridePhoto ? (
                  <div className="w-full aspect-[4/5] rounded-none overflow-hidden bg-stone-100 dark:bg-stone-900 mb-2.5">
                    <img
                      src={bridePhoto}
                      alt={brideName}
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                ) : null}
                {brideName && (
                  <span 
                    style={serifItalic}
                    className="text-xs text-stone-500"
                  >
                    Bride. <strong className={`font-sans font-medium not-italic ml-1 ${isNightMode ? 'text-white' : 'text-stone-900'}`}>{brideName}</strong>
                  </span>
                )}
              </div>

              {/* 신랑 카드 */}
              <div className="flex flex-col items-center">
                {groomPhoto ? (
                  <div className="w-full aspect-[4/5] rounded-none overflow-hidden bg-stone-100 dark:bg-stone-900 mb-2.5">
                    <img
                      src={groomPhoto}
                      alt={groomName}
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                ) : null}
                {groomName && (
                  <span 
                    style={serifItalic}
                    className="text-xs text-stone-500"
                  >
                    Groom. <strong className={`font-sans font-medium not-italic ml-1 ${isNightMode ? 'text-white' : 'text-stone-900'}`}>{groomName}</strong>
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* 인물 사진이 미등록된 경우 타인의 사진 대신 단정한 성함 라인으로 노출 */
            (groomName || brideName) && (
              <div className="flex items-center justify-center gap-6 mb-10 text-sm">
                {groomName && <span>Groom. <strong className={isNightMode ? 'text-white' : 'text-stone-900'}>{groomName}</strong></span>}
                {groomName && brideName && <span className="text-stone-300">·</span>}
                {brideName && <span>Bride. <strong className={isNightMode ? 'text-white' : 'text-stone-900'}>{brideName}</strong></span>}
              </div>
            )
          )}

          {/* 양가 부모님 정보 (부모님 정보가 입력된 경우에만 깔끔하게 노출) */}
          {(groomParents || brideParents) && (
            <div className={`space-y-2.5 text-xs sm:text-[13px] font-light max-w-[280px] mx-auto ${
              isNightMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              {groomParents && (
                <div className="flex items-center justify-between">
                  <span>{groomParents} {groomRelation && `의 ${groomRelation}`}</span>
                  <strong className={`font-medium ${isNightMode ? 'text-white' : 'text-stone-900'}`}>{groomName}</strong>
                </div>
              )}
              {brideParents && (
                <div className="flex items-center justify-between">
                  <span>{brideParents} {brideRelation && `의 ${brideRelation}`}</span>
                  <strong className={`font-medium ${isNightMode ? 'text-white' : 'text-stone-900'}`}>{brideName}</strong>
                </div>
              )}
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* ========================================================
          04. WEDDING GALLERY (시네마틱 룩북 갤러리 - 가로 스와이프 화보)
          ======================================================== */}
      {showGallerySection && activeGalleryImages.length > 0 && (
        <section className="py-20 text-center">
          <ScrollReveal>
            <h2 
              style={serifItalic}
              className={`text-xl tracking-[0.25em] uppercase mb-6 ${
                isNightMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              WEDDING GALLERY
            </h2>

            {/* 갤러리 탭 버튼 (Our Story / Wedding Photo) - 테두리 없는 미니멀 텍스트 탭 */}
            <div className="flex items-center justify-center gap-8 font-serif text-xs uppercase tracking-widest mb-8">
              <button
                type="button"
                onClick={() => setGalleryTab('story')}
                className={`transition-colors cursor-pointer ${
                  galleryTab === 'story'
                    ? (isNightMode ? 'text-white font-semibold' : 'text-stone-900 font-semibold')
                    : (isNightMode ? 'text-stone-500 hover:text-stone-300 font-light' : 'text-stone-400 hover:text-stone-600 font-light')
                }`}
              >
                Our Story
              </button>
              <button
                type="button"
                onClick={() => setGalleryTab('wedding')}
                className={`transition-colors cursor-pointer ${
                  galleryTab === 'wedding'
                    ? (isNightMode ? 'text-white font-semibold' : 'text-stone-900 font-semibold')
                    : (isNightMode ? 'text-stone-500 hover:text-stone-300 font-light' : 'text-stone-400 hover:text-stone-600 font-light')
                }`}
              >
                Wedding Photo
              </button>
            </div>

            {/* 영상 1:1 일치 가로 스와이프 화보 캐러셀 (Horizontal Peek-Preview Carousel) */}
            <div className="w-full overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory flex gap-3 px-6 py-2">
              {activeGalleryImages.map((src, idx) => (
                <div
                  key={`${galleryTab}-${idx}`}
                  onClick={() => {
                    setGalleryModalIndex(idx);
                    setGalleryModalOpen(true);
                  }}
                  className="shrink-0 w-[80vw] max-w-[320px] aspect-[3/4] snap-center rounded-none overflow-hidden bg-stone-100 dark:bg-stone-900 cursor-pointer select-none active:scale-[0.99] transition-transform"
                >
                  <img
                    src={src}
                    alt={`웨딩 갤러리 ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-102"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          05. DATE & CALENDAR (미니멀 캘린더 & D-Day)
          ======================================================== */}
      {showCountdownSection && (
        <section className="py-20 px-5 text-center">
          <ScrollReveal>
            <h2 
              style={serifItalic}
              className={`text-xl tracking-[0.25em] uppercase mb-8 ${
                isNightMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              DATE
            </h2>

            {/* 캘린더 상단 정사각형 감성 스냅 사진 (등록된 경우에만 노출) */}
            {datePhoto && (
              <div className="w-36 h-36 mx-auto rounded-none overflow-hidden mb-6 bg-stone-100 dark:bg-stone-900">
                <img
                  src={datePhoto}
                  alt="Wedding Moment"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
            )}

            {/* 필기체 영문 월명 (December.) */}
            <p 
              style={scriptFont}
              className={`text-4xl mb-6 ${
                isNightMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              {formattedDates.monthScript}
            </p>

            {/* 7열 숫자 캘린더 (영상: 요일 헤더 없이 숫자만 정렬, 당일은 얇은 원형 선 테두리) */}
            <div className="max-w-[260px] mx-auto mb-6 font-mono text-xs">
              <div className={`grid grid-cols-7 gap-y-2 text-center ${
                isNightMode ? 'text-stone-400' : 'text-stone-600'
              }`}>
                {/* 1일 전 빈칸 */}
                {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-8 h-8" />
                ))}

                {/* 날짜 */}
                {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                  const day = i + 1;
                  const isWedding = day === calendarData.weddingDay;
                  return (
                    <div key={day} className="flex items-center justify-center w-8 h-8 mx-auto">
                      <span
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs transition-colors ${
                          isWedding
                            ? (isNightMode ? 'border border-white text-white font-semibold' : 'border border-stone-800 text-stone-900 font-semibold')
                            : (isNightMode ? 'text-stone-300 hover:text-white' : 'text-stone-700 hover:text-stone-950')
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 풀 영문 날짜 */}
            <p 
              style={serifItalic}
              className="text-xs text-stone-500 tracking-wider mb-4"
            >
              {formattedDates.fullEn}
            </p>

            {/* D-Day 뱃지 */}
            <div className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full font-mono text-xs font-medium shadow-2xs ${
              isNightMode ? 'bg-stone-900 text-stone-200 border border-stone-800' : 'bg-stone-100 text-stone-800'
            }`}>
              <span>D-{timeLeft.isPast ? `+${timeLeft.totalDays}` : timeLeft.totalDays}일</span>
              <span className="text-rose-500">♡</span>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          06. INFORMATION (가로 스와이프 안내 카드 캐러셀)
          ======================================================== */}
      {infoCards.length > 0 && (
        <section className="py-20 px-5 text-center">
          <ScrollReveal>
            <h2 
              style={serifItalic}
              className={`text-xl tracking-[0.25em] uppercase mb-8 ${
                isNightMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              INFORMATION
            </h2>

            {/* 카드 캐러셀 */}
            <div
              ref={infoContainerRef}
              onScroll={(e) => {
                const scrollLeft = e.target.scrollLeft;
                const idx = Math.round(scrollLeft / 280);
                if (idx >= 0 && idx < infoCards.length && idx !== activeInfoIdx) {
                  setActiveInfoIdx(idx);
                }
              }}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-4 py-2"
            >
              {infoCards.map((card, idx) => (
                <div
                  key={idx}
                  className="snap-start shrink-0 w-[270px] sm:w-[290px] text-center flex flex-col justify-between"
                >
                  <div>
                    {/* 상단 가로 흑백 사진 */}
                    {card.image && (
                      <div className="w-full aspect-[16/9] rounded-none overflow-hidden mb-4 bg-stone-100 dark:bg-stone-900">
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                    )}

                    <h3 
                      style={serifItalic}
                      className={`text-sm mb-2 font-medium tracking-wide ${
                        isNightMode ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {card.subtitle || card.title}
                    </h3>
                    <p className={`text-xs leading-relaxed font-light whitespace-pre-line break-keep ${
                      isNightMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {card.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 인디케이터 도트 */}
            {infoCards.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-6">
                {infoCards.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeInfoIdx
                        ? (isNightMode ? 'w-4 bg-white' : 'w-4 bg-stone-800')
                        : (isNightMode ? 'w-1.5 bg-stone-700' : 'w-1.5 bg-stone-300')
                    }`}
                  />
                ))}
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          07. WEDDING LOCATION (식장 위치 & 3대 내비게이션 - 정보가 있을 때만 노출)
          ======================================================== */}
      {(venueFullName || venueAddress) && (
        <section className="py-20 px-5 text-center">
          <ScrollReveal>
            <h2 
              style={serifItalic}
              className={`text-xl tracking-[0.25em] uppercase mb-4 ${
                isNightMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              WEDDING LOCATION
            </h2>
            {venueFullName && (
              <p 
                style={serifItalic}
                className={`text-base font-medium mb-1 ${isNightMode ? 'text-white' : 'text-stone-900'}`}
              >
                {venueFullName}
              </p>
            )}

            {/* 주소 박스 & 복사 */}
            {venueAddress && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xs font-mono text-stone-400">{venueAddress}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(venueAddress, '주소가')}
                  className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                  aria-label="주소 복사"
                >
                  ⎘
                </button>
              </div>
            )}

            {/* 지도 컴포넌트 */}
            {venueAddress && (
              <div className="w-full max-w-[390px] mx-auto rounded-none overflow-hidden shadow-xs border border-stone-100 mb-6 bg-stone-100">
                <KakaoMap
                  address={venueAddress}
                  venueName={invitation?.venue_name || venueFullName}
                  className="w-full h-[280px]"
                />
              </div>
            )}

            {/* 내비게이션 버튼 (네이버 지도, 카카오내비) */}
            {venueAddress && (
              <div className="grid grid-cols-2 gap-2 max-w-[390px] mx-auto mb-10 text-xs font-medium font-sans">
                <button
                  type="button"
                  onClick={() => {
                    const q = invitation?.venue_name || venueAddress;
                    window.open(`https://map.naver.com/p/search/${encodeURIComponent(q)}`, '_blank');
                  }}
                  className={`py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    isNightMode ? 'bg-stone-900 hover:bg-stone-800 text-stone-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                  }`}
                >
                  <span className="font-bold text-emerald-600">N</span>
                  <span>네이버 지도</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const q = invitation?.venue_name || venueAddress;
                    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(q)}`, '_blank');
                  }}
                  className={`py-3 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    isNightMode ? 'bg-stone-900 hover:bg-stone-800 text-stone-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                  }`}
                >
                  <span className="font-bold text-amber-500">K</span>
                  <span>카카오내비</span>
                </button>
              </div>
            )}

            {/* 교통편 안내 리스트 (영상 스타일 회색 뱃지) */}
            {transportationList.length > 0 && (
              <div className="space-y-4 max-w-[390px] mx-auto text-left font-sans">
                {transportationList.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase mb-1.5 ${
                      isNightMode ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {item.title}
                    </span>
                    <p className={`leading-relaxed font-light whitespace-pre-line break-keep ${
                      isNightMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          08. WEDDING GIFT (등록된 계좌가 있을 때만 노출)
          ======================================================== */}
      {showAccountsSection && allAccounts.length > 0 && (
        <section className="py-20 px-5 text-center">
          <ScrollReveal>
            <h2 
              style={serifItalic}
              className={`text-xl tracking-[0.25em] uppercase mb-6 ${
                isNightMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              WEDDING GIFT
            </h2>

            {/* 신랑측에게 / 신부측에게 탭 버튼 */}
            <div className={`flex items-center justify-center gap-12 font-serif text-xs tracking-widest uppercase mb-8 border-b pb-3 max-w-[260px] mx-auto ${
              isNightMode ? 'border-stone-800' : 'border-stone-100'
            }`}>
              <button
                type="button"
                onClick={() => setAccountTab('groom')}
                className={`pb-1 cursor-pointer transition-colors ${
                  accountTab === 'groom'
                    ? (isNightMode ? 'text-white font-semibold border-b-2 border-white' : 'text-stone-900 font-semibold border-b-2 border-stone-900')
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                신랑측에게
              </button>
              <button
                type="button"
                onClick={() => setAccountTab('bride')}
                className={`pb-1 cursor-pointer transition-colors ${
                  accountTab === 'bride'
                    ? (isNightMode ? 'text-white font-semibold border-b-2 border-white' : 'text-stone-900 font-semibold border-b-2 border-stone-900')
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                신부측에게
              </button>
            </div>

            {/* 선택된 탭 계좌 리스트 (영상 1:1 슬림 행) */}
            <div className="space-y-3 max-w-[380px] mx-auto text-left font-sans">
              {currentAccounts.map((acc, idx) => {
                const copyNum = acc.number || acc.account_number || '';
                return (
                  <div
                    key={idx}
                    className={`py-2.5 px-3 border-b flex items-center justify-between ${
                      isNightMode ? 'border-stone-800/80' : 'border-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="min-w-[65px]">
                        <span className={`text-xs font-medium ${isNightMode ? 'text-white' : 'text-stone-900'}`}>
                          {acc.title || '신랑'}
                        </span>
                        <span className="text-[11px] text-stone-400 ml-1">
                          | {acc.holder || acc.name || ''}
                        </span>
                      </div>
                      <p className={`text-xs font-mono tracking-tight ${isNightMode ? 'text-stone-300' : 'text-stone-600'}`}>
                        {acc.bank} {copyNum}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(copyNum, `${acc.bank} 계좌번호가`)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                        isNightMode
                          ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                      }`}
                    >
                      <span>COPY</span>
                      <span className="text-[9px]">⎘</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          09. RSVP & 푸터
          ======================================================== */}
      {showRsvpSection && (
        <section className="py-20 px-5 text-center">
          <ScrollReveal>
            <h2 
              style={serifItalic}
              className={`text-xl tracking-[0.25em] uppercase mb-3 ${
                isNightMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              RSVP
            </h2>
            <p className="text-xs text-stone-500 font-light mb-8 max-w-xs mx-auto">
              기쁜 날, 함께해주시면 더없이 행복할 것 같아요
            </p>

            {/* 참석 여부 응답하기 버튼 (영상 1:1) */}
            <button
              type="button"
              onClick={() => setShowRsvpModal(true)}
              className={`w-full max-w-[280px] py-3.5 px-6 rounded-full text-xs font-serif tracking-widest uppercase transition-all cursor-pointer active:scale-95 mx-auto block mb-10 ${
                isNightMode
                  ? 'bg-white hover:bg-stone-100 text-black shadow-md'
                  : 'bg-stone-900 hover:bg-black text-white shadow-sm'
              }`}
            >
              ✉ 참석 여부 응답하기
            </button>

            {/* 공유 2종 링크 */}
            <div className="flex flex-col items-center gap-3 text-xs font-sans text-stone-500 mb-14">
              <button
                type="button"
                onClick={handleKakaoShare}
                className="hover:text-stone-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>💬</span>
                <span>Share KakaoTalk</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(window.location.href, '청첩장 주소가')}
                className="hover:text-stone-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔗</span>
                <span>Copy Link</span>
              </button>
            </div>

            {/* 푸터 (Ways to send your love / 브랜드) */}
            <div className="pt-8 text-center select-none">
              <p 
                style={serifItalic}
                className="text-xs text-stone-400 mb-1"
              >
                Ways to send your love
              </p>
              <p className="font-mono text-[10px] text-stone-400 tracking-widest uppercase mb-6">
                Designed by ATELIER DE MUKIRU
              </p>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 모달 연동 레이어 */}
      {showRsvpModal && (
        <EditorialRsvpModal invitationId={invitation?.id} onClose={() => setShowRsvpModal(false)} />
      )}
      {showGuestbookModal && (
        <EditorialGuestbookModal
          invitationId={invitation?.id}
          onClose={() => setShowGuestbookModal(false)}
          onSuccess={() => {}}
        />
      )}
      {galleryModalOpen && (
        <EditorialGalleryModal
          images={activeGalleryImages}
          initialIndex={galleryModalIndex}
          onClose={() => setGalleryModalOpen(false)}
        />
      )}
    </div>
  );
}
