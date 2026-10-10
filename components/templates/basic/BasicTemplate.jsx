'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import KakaoMap from '@/components/KakaoMap';
import EnvelopeIntro from '@/components/EnvelopeIntro';
import ContactModal from '@/components/ContactModal';
import RsvpModal from '@/components/RsvpModal';
import GuestbookModal from '@/components/GuestbookModal';
import GuestbookDeleteModal from '@/components/GuestbookDeleteModal';
import ScrollReveal from '@/components/ScrollReveal';

export default function BasicTemplate({ invitation }) {
  const extra = { ...(invitation?.template_config || {}), ...(invitation?.extra_data || {}) };

  // 0. 인트로 편지 봉투 커버 상태
  const [showIntro, setShowIntro] = useState(true);

  // 모달 제어 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState(null);

  // 갤러리 선택 인덱스 및 터치 제어
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryTouchStartX = useRef(null);
  const thumbnailContainerRef = useRef(null);

  // 계좌 아코디언 상태
  const [openGroomAccount, setOpenGroomAccount] = useState(true);
  const [openBrideAccount, setOpenBrideAccount] = useState(true);

  const images = invitation?.images || {};
  const config = invitation?.template_config || {};

  // 고객 커스텀 타이틀 색상 (template_config.title_color 우선, 하위호환 extra.title_color)
  const titleColor = config.title_color || extra.title_color || '#E5A866';

  // 섹션별 ON/OFF 제어 (기본값 true, config에서 false 지정 시 해당 섹션 숨김)
  const showIntroSection = config.show_intro !== false;
  const showCountdownSection = config.show_countdown !== false;
  const showGallerySection = config.show_gallery !== false;
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;
  const showGuestbookSection = config.show_guestbook !== false;

  // 본문 메인 풀스크린 사진 (images.main 최우선)
  const mainImage = images.main || extra.main_image || invitation?.main_image || invitation?.cover_image || '/cover.jpg';
  const hasBakedInText = Boolean(extra.has_baked_in_text);

  // 신랑/신부 프로필 사진 (images.groom_profile / bride_profile 최우선)
  const groomPhoto = images.groom_profile || extra.groom_profile_image || invitation?.groom_photo || extra.groom_photo || '/groom.jpg';
  const bridePhoto = images.bride_profile || extra.bride_profile_image || invitation?.bride_photo || extra.bride_photo || '/bride.jpg';

  // 둘이 함께 찍은 커플 사진 (images.couple_profile 최우선)
  const couplePhoto = images.couple_profile || images.couple || extra.couple_profile_image || extra.couple_image || mainImage;

  // 영화 대사 및 출처 (invitation.quote_content / quote_source)
  const quoteContent = invitation?.quote_content || config.quote_content || extra.quote_content || '';
  const quoteSource = invitation?.quote_source || config.quote_source || extra.quote_source || '';
  const showQuoteSection = config.show_quote_section !== false;

  // 엔딩 사진 (images.ending 최우선)
  const endingImage = images.ending || extra.ending_image || invitation?.ending_image || '/ending.jpg';

  // 갤러리 이미지 안전 파싱 (배열 및 문자열 대응)
  const parseGalleryImages = (raw) => {
    if (!raw) return null;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        if (raw.startsWith('{') && raw.endsWith('}')) {
          const items = raw.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
          if (items.length > 0) return items;
        }
      }
    }
    return null;
  };

  const initialGalleryImages = parseGalleryImages(invitation?.gallery_images) || [];
  const galleryImages = initialGalleryImages;

  // 갤러리 썸네일 활성 항목 자동 스크롤
  useEffect(() => {
    if (!thumbnailContainerRef.current) return;
    const activeThumb = thumbnailContainerRef.current.children[activeGalleryIndex];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeGalleryIndex]);

  // 브라우저 새로고침 시 캐시된 스크롤 복원 방지 & 최상단 강제 리셋
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }
  }, []);

  // 1. 날짜 및 시간 계산
  const hasWeddingDate = Boolean(invitation?.wedding_date);
  const rawDate = invitation?.wedding_date || null;
  const targetDate = useMemo(() => {
    if (!rawDate) return null;
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  }, [rawDate]);

  // 실시간 카운트다운 타이머
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, totalDays: days });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // 달력 데이터 생성
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
  const formattedKoreanDate = useMemo(() => {
    if (!hasWeddingDate) return '';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth() + 1;
    const d = targetDate.getDate();
    const dayName = days[targetDate.getDay()];
    const hours = targetDate.getHours();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const minutes = targetDate.getMinutes();
    const minStr = minutes > 0 ? ` ${minutes}분` : '';
    return `${y}년 ${m}월 ${d}일 ${dayName}요일 | ${period} ${displayHour}시${minStr}`;
  }, [targetDate, hasWeddingDate]);

  const formattedEnglishDate = useMemo(() => {
    if (!hasWeddingDate) return '';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = targetDate.toLocaleDateString('en-US', options);
    const hours = targetDate.getHours();
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHour = String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
    return `${dateStr} | ${period} ${displayHour}:${minutes}`;
  }, [targetDate, hasWeddingDate]);

  // 메인 커버 상단 영문 날짜 (예: 2027.03.27 SAT)
  const mainDateEn = useMemo(() => {
    if (extra.main_date_en) return extra.main_date_en;
    if (hasWeddingDate && targetDate && calendarData) {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const y = calendarData.year;
      const m = String(calendarData.month).padStart(2, '0');
      const d = String(calendarData.weddingDay).padStart(2, '0');
      const dow = days[targetDate.getDay()];
      return `${y}.${m}.${d} ${dow}`;
    }
    return '';
  }, [extra.main_date_en, hasWeddingDate, calendarData, targetDate]);

  // 메인 커버 하단 영문 이름 (예: Jang Min-ki  &  Kwon Ki-deuk)
  const mainNamesEn = useMemo(() => {
    if (extra.main_names_en) return extra.main_names_en;
    const brideEn = invitation?.bride_name_en || extra.bride_name_en;
    const groomEn = invitation?.groom_name_en || extra.groom_name_en;
    if (brideEn && groomEn) {
      return `${brideEn}  &  ${groomEn}`;
    }
    if (brideEn || groomEn) {
      return brideEn || groomEn;
    }
    if (invitation?.bride_name && invitation?.groom_name) {
      return `${invitation.bride_name}  &  ${invitation.groom_name}`;
    }
    if (invitation?.bride_name || invitation?.groom_name) {
      return invitation?.bride_name || invitation?.groom_name;
    }
    return '';
  }, [extra.main_names_en, extra.bride_name_en, extra.groom_name_en, invitation]);

  // 2. 정보(식사/셔틀/피로연/답례품 등) 동적 안내 카드 리스트
  const infoNotices = invitation?.info_notices;
  const infoCards = useMemo(() => {
    if (Array.isArray(infoNotices) && infoNotices.length > 0) {
      return infoNotices;
    }
    // 하위 호환: extra_data에 직접 값이 들어있던 경우만 반영
    const legacy = [];
    if (extra.meal_info) {
      legacy.push({ title: '식사안내', subtitle: '', content: extra.meal_info });
    }
    if (extra.shuttle_info) {
      legacy.push({ title: '셔틀버스 안내', subtitle: '', content: extra.shuttle_info });
    }
    return legacy;
  }, [infoNotices, extra.meal_info, extra.shuttle_info]);

  const [activeInfoDot, setActiveInfoDot] = useState(0);
  const infoCarouselRef = useRef(null);

  const handleInfoScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const cardWidth = 250; // 카드 너비 + 간격 기준
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx >= 0 && newIdx < infoCards.length && newIdx !== activeInfoDot) {
      setActiveInfoDot(newIdx);
    }
  };

  const scrollToInfoCard = (idx) => {
    if (!infoCarouselRef.current) return;
    const targetCard = infoCarouselRef.current.children[idx];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setActiveInfoDot(idx);
    }
  };

  // 3. 오시는 길 (교통수단) 동적 리스트
  const transportationData = invitation?.transportation;
  const transportationList = useMemo(() => {
    if (Array.isArray(transportationData) && transportationData.length > 0) {
      return transportationData;
    }
    // 하위 호환: extra_data에 직접 값이 들어있던 경우만 반영
    const legacy = [];
    if (extra.transport_parking) {
      legacy.push({ type: 'parking', title: '주차안내', content: extra.transport_parking });
    }
    if (extra.transport_car) {
      legacy.push({ type: 'car', title: '자차', content: extra.transport_car });
    }
    if (extra.transport_bus) {
      legacy.push({ type: 'bus', title: '버스', content: extra.transport_bus });
    }
    if (extra.transport_subway) {
      legacy.push({ type: 'subway', title: '지하철', content: extra.transport_subway });
    }
    return legacy;
  }, [transportationData, extra.transport_parking, extra.transport_car, extra.transport_bus, extra.transport_subway]);

  const getTransportIcon = (type, title = '') => {
    const t = (type || '').toLowerCase();
    const tit = (title || '').toLowerCase();
    if (t === 'car' || tit.includes('자차') || tit.includes('차량') || tit.includes('자가용')) {
      return '/templates/basic/transportation-of-car.svg';
    }
    if (t === 'bus' || tit.includes('버스') || tit.includes('셔틀')) {
      return '/templates/basic/transportation-of-bus.svg';
    }
    if (t === 'subway' || t === 'metro' || tit.includes('지하철') || tit.includes('전철')) {
      return '/templates/basic/transportation-of-subway.svg';
    }
    return '/templates/basic/transportation-parking.svg';
  };

  // 4. 방명록 데이터 & 자동 롤링 슬라이더
  const defaultGuestbook = [
    { id: '1', author: '축하 메시지', content: '두 분의 새로운 시작을\n진심으로 축하드립니다.🤍', created_at: '' },
  ];
  const [guestbookList, setGuestbookList] = useState(defaultGuestbook);
  const [guestbookIndex, setGuestbookIndex] = useState(0);

  // 방명록 목록 DB 로드
  useEffect(() => {
    if (!invitation?.id) return;
    async function loadGuestbook() {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_id', invitation.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setGuestbookList(data);
      }
    }
    loadGuestbook();
  }, [invitation?.id]);

  useEffect(() => {
    if (guestbookList.length <= 1) return;
    const timer = setInterval(() => {
      setGuestbookIndex((prev) => (prev + 1) % guestbookList.length);
    }, 4500); // 4.5초마다 자동 롤링
    return () => clearInterval(timer);
  }, [guestbookList.length]);

  // 계좌 데이터
  const groomAccounts = (invitation?.accounts || []).filter((a) => a.group === '신랑측' || a.side === 'groom');
  const brideAccounts = (invitation?.accounts || []).filter((a) => a.group === '신부측' || a.side === 'bride');

  const getAccountHolderText = (acc, fallbackTitle = '예금주') => {
    if (acc.title && acc.holder) return `${acc.title} ${acc.holder}`;
    if (acc.title && acc.name) return `${acc.title} ${acc.name}`;
    if (acc.name) return acc.name;
    if (acc.holder) return acc.holder;
    if (acc.title) return `${acc.title} 예금주`;
    return fallbackTitle;
  };

  // 혼주 및 신랑신부 정보 (초대합니다 섹션)
  const groomParents = [invitation?.groom_father, invitation?.groom_mother].filter(Boolean).join(' · ');
  const groomRelation = invitation?.groom_relation || extra.groom_relation || (groomParents ? '아들' : '');
  const groomName = invitation?.groom_name || '';

  const brideParents = [invitation?.bride_father, invitation?.bride_mother].filter(Boolean).join(' · ');
  const brideRelation = invitation?.bride_relation || extra.bride_relation || (brideParents ? '딸' : '');
  const brideName = invitation?.bride_name || '';

  // D-Day 이름
  const groomShort = invitation?.groom_name && invitation.groom_name.length === 3 ? invitation.groom_name.slice(1) : (invitation?.groom_name || '');
  const brideShort = invitation?.bride_name && invitation.bride_name.length === 3 ? invitation.bride_name.slice(1) : (invitation?.bride_name || '');

  // 클립보드 복사 함수
  const handleCopy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} 복사되었습니다.`);
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const coupleText = [invitation?.groom_name, invitation?.bride_name].filter(Boolean).join(' ♥ ');
    const shareTitle = coupleText ? `${coupleText} 결혼식에 초대합니다` : '소중한 결혼식에 초대합니다';
    const shareDesc = [formattedKoreanDate, invitation?.venue_name].filter(Boolean).join(' | ');

    // 1. 카카오 SDK 로드 및 초기화 시도
    if (typeof window !== 'undefined' && window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
        if (kakaoKey) {
          try {
            window.Kakao.init(kakaoKey);
          } catch (e) {
            console.warn('Kakao init warning:', e);
          }
        }
      }

      if (window.Kakao.isInitialized()) {
        try {
          // 오시는 길 검색 링크 (기존의 정의되지 않았던 mapUrl 에러 완벽 해결)
          const venueQuery = encodeURIComponent(invitation?.venue_name || invitation?.venue_address || '결혼식장');
          const mapLink = `https://map.kakao.com/link/search/${venueQuery}`;

          // 절대 URL 이미지 경로 처리
          let shareImg = extra.share_image || images.cover || images.main || mainImage;
          if (shareImg && typeof shareImg === 'string' && !shareImg.startsWith('http')) {
            shareImg = `${window.location.origin}${shareImg.startsWith('/') ? '' : '/'}${shareImg}`;
          }
          // localhost 환경이거나 이미지가 없을 경우 카카오 스크랩 검증용 고화질 웨딩 이미지 대체
          if (!shareImg || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
            shareImg = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80';
          }

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
              { title: '오시는 길', link: { mobileWebUrl: mapLink, webUrl: mapLink } },
            ],
          });
          return;
        } catch (kakaoErr) {
          console.error('카카오 공유 호출 오류:', kakaoErr);
          // 실패 시 하단 fallback으로 자동 전환
        }
      }
    }

    // 2. 모바일 브라우저 네이티브 공유 API (Safari, Chrome 등)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle}\n${shareDesc}`,
          url: currentUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // 3. 최후의 Fallback: 링크 복사
    handleCopy(currentUrl, '청첩장 주소가');
  };

  return (
    <div className="w-full max-w-[430px] bg-[#FCFBF7] text-[#333333] min-h-screen flex flex-col font-sans shadow-2xl antialiased selection:bg-stone-200 relative mx-auto">
      
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

      {/* 영문 필기체 폰트 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .font-script {
          font-family: 'Pinyon Script', 'Alex Brush', cursive !important;
        }
        .font-cormorant {
          font-family: 'Cormorant Garamond', Georgia, serif !important;
        }
      `}</style>

      {/* 0. 인트로 편지 봉투 커버 화면 */}
      {showIntro && showIntroSection && (
        <EnvelopeIntro 
          invitation={invitation} 
          onOpen={() => {
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
            setShowIntro(false);
          }} 
        />
      )}

      {/* 1. 메인 풀스크린 커버 사진 (Image 1) */}
      <section 
        className="relative w-full h-[100lvh] min-h-[100vh] flex flex-col justify-between bg-cover bg-center select-none"
        style={{ backgroundImage: `url(${mainImage})` }}
      >
        {/* 상하단 가독성을 위한 은은한 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55 pointer-events-none" />

        {!hasBakedInText && (
          <>
            {/* 상단: We are getting married & 날짜 */}
            <div className="relative z-10 pt-[calc(env(safe-area-inset-top,0px)+3.8rem)] px-6 text-center">
              <h1 
                className="font-cormorant italic text-[32px] sm:text-[38px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] tracking-wide"
                style={{ color: titleColor }}
              >
                We are getting married
              </h1>
              {mainDateEn && (
                <p 
                  className="mt-2.5 sm:mt-3 text-[15px] sm:text-[17px] font-sans font-normal tracking-[0.18em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                  style={{ color: titleColor }}
                >
                  {mainDateEn}
                </p>
              )}
            </div>

            {/* 하단: Welcome to & 신랑 신부 영문 이름 */}
            <div className="relative z-10 pb-[calc(env(safe-area-inset-bottom,0px)+3.5rem)] px-6 text-center">
              <p 
                className="text-[17px] sm:text-[19px] font-sans font-light tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                style={{ color: titleColor }}
              >
                Welcome to
              </p>
              {mainNamesEn && (
                <p 
                  className="mt-1.5 sm:mt-2 text-[20px] sm:text-[23px] font-sans font-normal tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                  style={{ color: titleColor }}
                >
                  {mainNamesEn}
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* 2. 초대합니다 & 혼주 & 연락처 모달 버튼 (Image 2) */}
      <section className="pt-28 sm:pt-36 pb-28 sm:pb-36 px-6 bg-[#FCFBF7] text-center">
        <ScrollReveal>
          <h2 className="text-[21px] sm:text-[23px] font-sans font-normal text-stone-800 tracking-[0.04em] mb-10 sm:mb-12">
            초대합니다
          </h2>

          {/* 초대 문구 */}
          <div className="text-[14px] sm:text-[14.5px] font-sans text-stone-600 leading-[2.3] font-normal max-w-[320px] mx-auto mb-12 sm:mb-14 whitespace-pre-line">
            {invitation?.message || (
              `서로를 만나 평범했던 하루가\n조금 더 따뜻하고 특별해졌습니다.\n이제 두 사람이 한마음으로\n새로운 계절을 시작하려 합니다.\n\n소중한 분들과 함께\n그 순간을 나누고 싶습니다.\n저희의 첫걸음에 따뜻한 축복을 보내주세요.`
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          {/* 세로 구분선 */}
          <div className="w-px h-12 bg-stone-300 mx-auto mb-12 sm:mb-14" />

          {/* 부모님 & 신랑신부 성함 (3열 정렬 레이아웃) */}
          {(groomName || brideName || groomParents || brideParents) && (
            <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-5 gap-y-3.5 text-[14.5px] sm:text-[15px] font-sans mx-auto mb-12 sm:mb-14">
              <div className="text-right text-stone-700 font-normal">
                {groomParents}
              </div>
              <div className="text-center text-stone-400 font-normal text-[13px] px-1">
                {groomParents ? groomRelation : ''}
              </div>
              <div className="text-left text-stone-900 font-medium">
                {groomName}
              </div>

              <div className="text-right text-stone-700 font-normal">
                {brideParents}
              </div>
              <div className="text-center text-stone-400 font-normal text-[13px] px-1">
                {brideParents ? brideRelation : ''}
              </div>
              <div className="text-left text-stone-900 font-medium">
                {brideName}
              </div>
            </div>
          )}

          {/* 축하 연락하기 버튼 */}
          <div>
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#EEEEEE] hover:bg-[#E4E4E4] text-stone-700 text-[14px] font-medium rounded-2xl font-sans transition-colors shadow-2xs cursor-pointer"
            >
              <span>축하 연락하기</span>
              <svg className="w-3.5 h-3.5 fill-stone-600" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </button>
          </div>
        </ScrollReveal>

        {/* 선택적 원형 프로필 사진 (설정 시 활성화) */}
        {config.show_profile_photos && (
          <ScrollReveal delay={200}>
            <div className="mt-20">
              <p className="font-cormorant italic text-2xl text-stone-800 mb-8">
                We are getting married
              </p>

              <div className="flex justify-center items-center gap-10">
                {/* 신랑 */}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-2.5 shadow-sm border border-stone-200">
                    <img 
                      src={groomPhoto} 
                      alt="신랑 프로필" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-sans text-stone-500">신랑</p>
                  <p className="text-sm font-sans font-medium text-stone-800">{invitation?.groom_name || ''}</p>
                </div>

                {/* 신부 */}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-2.5 shadow-sm border border-stone-200">
                    <img 
                      src={bridePhoto} 
                      alt="신부 프로필" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-sans text-stone-500">신부</p>
                  <p className="text-sm font-sans font-medium text-stone-800">{invitation?.bride_name || ''}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </section>

      {/* 2-1. 커플 사진 및 영화 대사 (Couple Photo & Movie Quote) */}
      {showQuoteSection && (couplePhoto || quoteContent) && (
        <section className="bg-[#FCFBF7] text-center select-none overflow-hidden">
          <ScrollReveal>
            {/* 상단 풀위드 커플 사진 */}
            {couplePhoto && (
              <div className="w-full overflow-hidden bg-stone-100">
                <img 
                  src={couplePhoto} 
                  alt="신랑 신부 커플 사진" 
                  className="w-full h-auto object-cover object-center max-h-[620px]"
                  onError={(e) => {
                    if (e.currentTarget.src !== mainImage) {
                      e.currentTarget.src = mainImage;
                    }
                  }}
                />
              </div>
            )}

            {/* 신부 / 신랑 이름: 좌/우 50% 영역의 정중앙에 각각 정렬 */}
            {(brideName || groomName) && (
              <div className="pt-14 sm:pt-16 pb-3 grid grid-cols-2 text-[15px] font-sans">
                <div className="flex items-center justify-center gap-4 sm:gap-5">
                  <span className="text-stone-500 font-normal">신부</span>
                  <span className="text-stone-800 font-medium tracking-tight">{brideName}</span>
                </div>
                <div className="flex items-center justify-center gap-4 sm:gap-5">
                  <span className="text-stone-500 font-normal">신랑</span>
                  <span className="text-stone-800 font-medium tracking-tight">{groomName}</span>
                </div>
              </div>
            )}

            {/* 영화 대사 본문 & 출처 */}
            {quoteContent && (
              <div className="pt-20 sm:pt-24 pb-28 sm:pb-36 px-6 max-w-[340px] mx-auto">
                <p className="text-[14px] sm:text-[14.5px] font-sans text-stone-600 leading-[2.3] font-normal whitespace-pre-line">
                  {quoteContent}
                </p>
                {quoteSource && (
                  <p className="mt-12 sm:mt-14 text-[13.5px] font-sans text-stone-500 font-normal">
                    {quoteSource.startsWith('-') ? quoteSource : `- ${quoteSource} -`}
                  </p>
                )}
              </div>
            )}
          </ScrollReveal>
        </section>
      )}
      {/* 3. 웨딩 캘린더 & 카운트다운 타이머 (Image 3 - 다크 테마) */}
      {hasWeddingDate && calendarData && (
        <section className="py-28 sm:py-36 px-6 bg-gradient-to-b from-[#151515] to-[#1E1E1E] text-center border-t border-stone-800">
          <ScrollReveal>
            <h2 className="font-cormorant text-3xl sm:text-4xl text-white tracking-wide mb-5">
              Wedding Day
            </h2>
            {formattedKoreanDate && (
              <p className="text-[14.5px] sm:text-[15px] font-sans text-white/90 font-normal mb-2">
                {formattedKoreanDate}
              </p>
            )}
            {formattedEnglishDate && (
              <p className="text-[13px] sm:text-[13.5px] text-white/70 font-sans tracking-wide mb-10">
                {formattedEnglishDate}
              </p>
            )}

            {/* 달력 컨테이너 */}
            <div className="max-w-[340px] mx-auto mb-14 pt-8 border-t border-white/20">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center text-[13px] sm:text-[13.5px] font-sans mb-4">
                <span className="text-[#E84C4B] font-normal py-1">일</span>
                <span className="text-white/80 font-normal py-1">월</span>
                <span className="text-white/80 font-normal py-1">화</span>
                <span className="text-white/80 font-normal py-1">수</span>
                <span className="text-white/80 font-normal py-1">목</span>
                <span className="text-white/80 font-normal py-1">금</span>
                <span className="text-white/80 font-normal py-1">토</span>
              </div>

              {/* 일자 그리드 */}
              <div className="grid grid-cols-7 gap-y-3.5 text-center text-[14px] sm:text-[14.5px] font-sans tabular-nums">
                {/* 시작 요일 빈 칸 */}
                {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-full aspect-square" />
                ))}

                {/* 일자 */}
                {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                  const day = i + 1;
                  const isSunday = (calendarData.firstDayIndex + i) % 7 === 0;
                  const isWeddingDay = day === calendarData.weddingDay;

                  return (
                    <div key={day} className="flex items-center justify-center w-full aspect-square">
                      <span
                        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[14px] leading-none transition-colors ${
                          isWeddingDay
                            ? 'bg-[#913B3B] text-white font-medium shadow-sm'
                            : isSunday
                            ? 'text-[#E84C4B] font-normal'
                            : 'text-white font-normal'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {showCountdownSection && (
            <ScrollReveal delay={200}>
              {/* 카운트다운 4분할 카드 */}
              <div className="grid grid-cols-4 gap-2.5 max-w-[340px] mx-auto mb-12 font-sans">
                {[
                  { label: 'DAYS', val: timeLeft.days },
                  { label: 'HOURS', val: timeLeft.hours },
                  { label: 'MINUTES', val: timeLeft.minutes },
                  { label: 'SECONDS', val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#F8F8F6] rounded-2xl py-3.5 px-2 shadow-lg border border-white/5 flex flex-col items-center justify-center"
                  >
                    <span className="text-[10px] sm:text-[11px] text-[#999999] tracking-wider font-medium">
                      {item.label}
                    </span>
                    <span className="font-serif text-[23px] sm:text-[25px] font-normal text-stone-800 mt-1 tabular-nums leading-tight">
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* D-Day 남은 일수 강조 문구 */}
              <p className="text-[14px] sm:text-[14.5px] text-white/90 font-sans flex items-center justify-center">
                {groomShort && brideShort ? (
                  <>
                    <span>{groomShort}</span>
                    <span className="text-[#E84C4B] mx-1">♥</span>
                    <span>{brideShort}님의 결혼식이</span>
                  </>
                ) : (
                  <span>결혼식이</span>
                )}
                <strong className="text-[#E84C4B] font-semibold ml-1.5 mr-0.5">{timeLeft.totalDays}일</strong>
                <span>남았습니다.</span>
              </p>
            </ScrollReveal>
          )}
        </section>
      )}

      {/* 4. 웨딩 갤러리 (Image 4) */}
      {showGallerySection && galleryImages.length > 0 && (
        <section className="pt-28 sm:pt-36 pb-28 sm:pb-36 px-4 bg-[#FCFBF7] text-center">
          <ScrollReveal>
            <h2 className="font-cormorant font-normal text-[30px] sm:text-[34px] tracking-normal text-stone-900 leading-none">
              GALLERY
            </h2>
            <p className="font-serif text-[18px] sm:text-[19px] text-stone-800 font-normal tracking-normal mt-3.5 sm:mt-4 mb-10 sm:mb-12">
              갤러리
            </p>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            {/* 대표 메인 큰 사진 (고정 프레임 안에서 잘림 없이 원본 비율 온전히 유지) */}
            <div 
              className="w-full max-w-[390px] mx-auto aspect-[390/530] flex items-center justify-center overflow-hidden bg-black/5 shadow-2xs relative select-none"
              onTouchStart={(e) => {
                galleryTouchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (galleryTouchStartX.current === null) return;
                const endX = e.changedTouches[0].clientX;
                const diffX = galleryTouchStartX.current - endX;
                if (Math.abs(diffX) > 40) {
                  if (diffX > 0) {
                    // 왼쪽 스와이프 -> 다음 사진
                    setActiveGalleryIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                  } else {
                    // 오른쪽 스와이프 -> 이전 사진
                    setActiveGalleryIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                  }
                }
                galleryTouchStartX.current = null;
              }}
            >
              <img
                key={activeGalleryIndex}
                src={galleryImages[activeGalleryIndex] || galleryImages[0]}
                alt={`웨딩 갤러리 사진 ${activeGalleryIndex + 1}`}
                className="w-full h-full object-contain select-none transition-opacity duration-300"
              />
            </div>

            {/* 하단 가로 스크롤 썸네일 스트립 */}
            <div
              ref={thumbnailContainerRef}
              className="w-full max-w-[390px] mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth mt-5 sm:mt-6 pb-1"
            >
              {galleryImages.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`relative flex-shrink-0 w-[72px] h-[72px] sm:w-[76px] sm:h-[76px] aspect-square overflow-hidden cursor-pointer transition-all duration-200 ${
                    idx === activeGalleryIndex
                      ? 'ring-2 ring-stone-900 opacity-100'
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  aria-label={`갤러리 사진 ${idx + 1}번 선택`}
                >
                  <img
                    src={src}
                    alt={`썸네일 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 5. 식장 위치 & 지도 & 네비게이션 (Image 5) */}
      {(invitation?.venue_name || invitation?.venue_address) && (
        <section className="pt-28 sm:pt-36 pb-28 sm:pb-36 bg-[#FCFBF7] text-center">
          <ScrollReveal>
            <h2 className="font-cormorant font-normal text-[30px] sm:text-[34px] tracking-normal text-stone-900 leading-none">
              LOCATION
            </h2>
            <p className="font-serif text-[18px] sm:text-[19px] text-stone-800 font-normal tracking-normal mt-3.5 sm:mt-4 mb-10 sm:mb-12">
              식장 위치
            </p>

            {/* 예식장 명 */}
            {invitation?.venue_name && (
              <p className="text-[16px] sm:text-[17px] font-sans font-medium text-stone-800 mb-2">
                {invitation.venue_name}
              </p>
            )}

            {/* 식장 주소 & 깔끔한 복사 버튼 */}
            {invitation?.venue_address && (
              <div className="flex items-center justify-center mb-9 sm:mb-10 font-sans">
                <button 
                  onClick={() => handleCopy(invitation.venue_address, '식장 주소가')}
                  className="inline-flex items-center gap-1.5 text-[14px] text-stone-500 hover:text-stone-800 transition-colors cursor-pointer group"
                  title="주소 복사"
                >
                  <span>{invitation.venue_address}</span>
                  <svg 
                    className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="1.8"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}
          </ScrollReveal>

          {/* 카카오 지도 & 네비게이션 버튼 (주소 존재 시 렌더링) */}
          {invitation?.venue_address && (
            <ScrollReveal delay={200}>
              <div className="w-full max-w-[390px] mx-auto px-4 mb-5 sm:mb-6">
                <div className="overflow-hidden border border-stone-200/60 shadow-2xs">
                  <KakaoMap 
                    address={invitation.venue_address} 
                    venueName={invitation?.venue_name || ''} 
                    className="w-full h-[280px] sm:h-[320px] bg-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* 네이버 지도 / 카카오내비 버튼 2종 */}
              <div className="grid grid-cols-2 gap-3 max-w-[390px] mx-auto px-4 font-sans">
                <button
                  onClick={() => {
                    const query = invitation?.venue_name || invitation?.venue_address;
                    window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank');
                  }}
                  className="py-3 sm:py-3.5 px-4 bg-[#F5F5F5] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl shadow-2xs border border-stone-200/50 flex items-center justify-center gap-2 transition-colors font-medium cursor-pointer"
                >
                  <span>네이버 지도</span>
                  <img src="/templates/basic/naver-map.svg" alt="네이버 지도" className="w-[18px] h-[18px] object-contain" />
                </button>
                <button
                  onClick={() => {
                    const query = invitation?.venue_name || invitation?.venue_address;
                    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(query)}`, '_blank');
                  }}
                  className="py-3 sm:py-3.5 px-4 bg-[#F5F5F5] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl shadow-2xs border border-stone-200/50 flex items-center justify-center gap-2 transition-colors font-medium cursor-pointer"
                >
                  <span>카카오내비</span>
                  <img src="/templates/basic/kakao-navi.svg" alt="카카오내비" className="w-[18px] h-[18px] object-contain rounded-xs" />
                </button>
              </div>
            </ScrollReveal>
          )}
        </section>
      )}

      {/* 6. 교통편 상세 안내 (Image 6 - 동적 리스트 렌더링) */}
      {transportationList.length > 0 && (
        <section className="py-24 sm:py-32 px-4 bg-[#F5F5F3] font-sans">
          <div className="max-w-[390px] mx-auto space-y-5 sm:space-y-6">
            {transportationList.map((item, idx) => (
              <ScrollReveal key={idx} delay={idx * 80}>
                <div className="bg-white p-6 sm:p-7 shadow-2xs border border-stone-200/40 text-left">
                  {/* 상단: 타이틀 + 아이콘 */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[17px] sm:text-[18px] text-stone-900 tracking-tight">
                      {item.title}
                    </span>
                    <img
                      src={getTransportIcon(item.type, item.title)}
                      alt={item.title}
                      className="w-5 h-5 object-contain opacity-75"
                    />
                  </div>
                  
                  {/* 구분선 */}
                  <div className="w-full h-px bg-stone-200 mt-3.5 mb-4 sm:mb-5" />

                  {/* 상세 내용 본문 */}
                  <p className="text-[13px] sm:text-[14px] text-stone-600 leading-relaxed font-sans whitespace-pre-line text-left break-keep">
                    {item.content}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* 7. 마음 전하실 곳 (Image 7) */}
      {showAccountsSection && (groomAccounts.length > 0 || brideAccounts.length > 0) && (
        <section className="pt-28 sm:pt-36 pb-28 sm:pb-36 px-4 sm:px-6 bg-[#FCFBF7] text-center">
          <ScrollReveal>
            <h2 className="font-cormorant font-normal text-[30px] sm:text-[34px] tracking-normal text-stone-900 leading-none">
              ACCOUNT
            </h2>
            <p className="font-serif text-[18px] sm:text-[19px] text-stone-800 font-normal tracking-normal mt-3.5 sm:mt-4 mb-10 sm:mb-12">
              마음 전하실 곳
            </p>
          </ScrollReveal>

          {/* 신랑측 & 신부측 아코디언 */}
          <ScrollReveal delay={150}>
            {/* 신랑측 아코디언 */}
            {groomAccounts.length > 0 && (
              <div className="bg-white rounded-xl overflow-hidden shadow-xs border border-stone-200/60 max-w-[390px] mx-auto mb-6 sm:mb-7">
                <button
                  type="button"
                  onClick={() => setOpenGroomAccount(!openGroomAccount)}
                  className={`w-full py-3.5 sm:py-4 px-5 flex items-center justify-between bg-[#383838] hover:bg-[#2e2e2e] text-white transition-colors cursor-pointer ${
                    openGroomAccount ? 'rounded-t-xl' : 'rounded-xl'
                  }`}
                >
                  <div className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-[15px] sm:text-[16px] font-medium tracking-wide text-white">
                    신랑측 계좌번호
                  </span>
                  <svg
                    className={`w-4 h-4 text-stone-300 transition-transform duration-200 shrink-0 ${openGroomAccount ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openGroomAccount && (
                  <div className="p-5 sm:p-6 bg-white">
                    {groomAccounts.map((acc, idx) => {
                      const holderText = getAccountHolderText(acc, '신랑 예금주');
                      const bankAndNum = `${acc.bank || ''} ${acc.account_number || acc.number || ''}`.trim();
                      const copyValue = acc.account_number || acc.number || bankAndNum;

                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-stone-100 last:border-b-0"
                        >
                          <div className="text-left font-sans">
                            <p className="text-[14px] sm:text-[15px] font-medium text-stone-800">
                              {holderText}
                            </p>
                            <p className="text-[13px] sm:text-[14px] text-stone-500 font-sans mt-0.5">
                              {bankAndNum}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(copyValue, `${holderText} 계좌번호가`)}
                            className="px-3.5 py-1.5 bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[12px] sm:text-[13px] font-medium text-stone-600 rounded-full transition-colors font-sans cursor-pointer shrink-0"
                          >
                            복사하기
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 신부측 아코디언 */}
            {brideAccounts.length > 0 && (
              <div className="bg-white rounded-xl overflow-hidden shadow-xs border border-stone-200/60 max-w-[390px] mx-auto">
                <button
                  type="button"
                  onClick={() => setOpenBrideAccount(!openBrideAccount)}
                  className={`w-full py-3.5 sm:py-4 px-5 flex items-center justify-between bg-[#383838] hover:bg-[#2e2e2e] text-white transition-colors cursor-pointer ${
                    openBrideAccount ? 'rounded-t-xl' : 'rounded-xl'
                  }`}
                >
                  <div className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-[15px] sm:text-[16px] font-medium tracking-wide text-white">
                    신부측 계좌번호
                  </span>
                  <svg
                    className={`w-4 h-4 text-stone-300 transition-transform duration-200 shrink-0 ${openBrideAccount ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openBrideAccount && (
                  <div className="p-5 sm:p-6 bg-white">
                    {brideAccounts.map((acc, idx) => {
                      const holderText = getAccountHolderText(acc, '신부 예금주');
                      const bankAndNum = `${acc.bank || ''} ${acc.account_number || acc.number || ''}`.trim();
                      const copyValue = acc.account_number || acc.number || bankAndNum;

                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-stone-100 last:border-b-0"
                        >
                          <div className="text-left font-sans">
                            <p className="text-[14px] sm:text-[15px] font-medium text-stone-800">
                              {holderText}
                            </p>
                            <p className="text-[13px] sm:text-[14px] text-stone-500 font-sans mt-0.5">
                              {bankAndNum}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(copyValue, `${holderText} 계좌번호가`)}
                            className="px-3.5 py-1.5 bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[12px] sm:text-[13px] font-medium text-stone-600 rounded-full transition-colors font-sans cursor-pointer shrink-0"
                          >
                            복사하기
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* 8. 정보 (식사/화환/셔틀 등 동적 안내 카드) (Image 8) */}
      {infoCards.length > 0 && (
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FCFBF7] text-center">
          {/* 섹션 상단 구분선 */}
          <div className="w-full max-w-[390px] mx-auto h-px bg-stone-200 mb-20 sm:mb-24" />

          <ScrollReveal>
            <h2 className="font-cormorant font-normal text-[30px] sm:text-[34px] tracking-normal text-stone-900 leading-none">
              INFORMATION
            </h2>
            <p className="font-serif text-[18px] sm:text-[19px] text-stone-800 font-normal tracking-normal mt-3.5 sm:mt-4 mb-10 sm:mb-12">
              정보
            </p>
          </ScrollReveal>

          {/* 가로 스와이프 안내 카드 캐러셀 */}
          <ScrollReveal delay={150}>
            <div
              ref={infoCarouselRef}
              onScroll={handleInfoScroll}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-6 sm:px-8 py-2"
            >
              {infoCards.map((card, idx) => (
                <div
                  key={idx}
                  className="snap-start flex-shrink-0 w-[240px] sm:w-[255px] bg-[#F7F7F6] p-6 sm:p-7 text-left shadow-xs border border-stone-200/50 flex flex-col justify-start min-h-[250px]"
                >
                  {/* 상단 번호 (01, 02 ...) */}
                  <span className="text-[15px] sm:text-[16px] font-normal text-stone-400 font-sans mb-3">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* 카드 제목 */}
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-stone-900 tracking-tight font-sans mb-3.5">
                    {card.title}
                  </h3>

                  {/* 구분선 */}
                  <div className="w-full h-px bg-stone-200/80 mb-4" />

                  {/* 서브타이틀 (식사 시간 등) */}
                  {card.subtitle && (
                    <p className="text-[13px] sm:text-[14px] text-stone-600 leading-relaxed font-sans whitespace-pre-line mb-3">
                      {card.subtitle}
                    </p>
                  )}

                  {/* 상세 본문 */}
                  <p className="text-[12px] sm:text-[13px] text-stone-500 leading-relaxed font-sans whitespace-pre-line break-keep">
                    {card.content}
                  </p>
                </div>
              ))}
            </div>

            {/* 하단 인디케이터 도트 (2개 이상일 때만 노출) */}
            {infoCards.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                {infoCards.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToInfoCard(idx)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeInfoDot
                        ? 'w-1.5 h-1.5 bg-stone-700'
                        : 'w-1.5 h-1.5 bg-stone-300'
                    }`}
                    aria-label={`정보 ${idx + 1}번 카드로 이동`}
                  />
                ))}
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* 9. 참석 의사 (RSVP) (Image 9) */}
      {showRsvpSection && (
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-[#FCFBF7] text-center">
          {/* 섹션 상단 구분선 */}
          <div className="w-full max-w-[390px] mx-auto h-px bg-stone-200 mb-20 sm:mb-24" />

          <ScrollReveal>
            <h2 className="font-cormorant font-normal text-[30px] sm:text-[34px] tracking-normal text-stone-900 leading-none">
              RSVP
            </h2>
            <p className="font-serif text-[18px] sm:text-[19px] text-stone-800 font-normal tracking-normal mt-3.5 sm:mt-4 mb-3.5">
              참석 의사
            </p>
            <p className="text-[13px] sm:text-[14px] text-stone-500 font-sans mb-12 sm:mb-14">
              모든 분들을 소중하게 모실 수 있도록 전해주세요
            </p>
          </ScrollReveal>

          {/* 안내 정보 & 참석 정보 전달하기 버튼 */}
          <ScrollReveal delay={150}>
            <div className="font-sans mb-12 sm:mb-14 space-y-2">
              {(invitation?.groom_name || invitation?.bride_name) && (
                <p className="text-[15px] sm:text-[16px] font-medium text-stone-800 mb-6">
                  {[
                    invitation?.groom_name ? `신랑 ${invitation.groom_name}` : '',
                    invitation?.bride_name ? `신부 ${invitation.bride_name}` : ''
                  ].filter(Boolean).join(' ♥ ')}
                </p>
              )}
              {formattedKoreanDate && (
                <p className="text-[14px] sm:text-[15px] text-stone-600">
                  {formattedKoreanDate}
                </p>
              )}
              {invitation?.venue_name && (
                <p className="text-[14px] sm:text-[15px] text-stone-600">
                  {invitation.venue_name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowRsvpModal(true)}
              className="py-4 px-10 bg-[#333333] hover:bg-[#222222] text-white rounded-xl text-sm font-medium tracking-wide transition-colors shadow-xs inline-block cursor-pointer font-sans"
            >
              참석 정보 전달하기
            </button>
          </ScrollReveal>
        </section>
      )}

      {/* 10. 축하 메시지 (Image 10) */}
      {showGuestbookSection && (
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-[#FCFBF7] text-center">
          {/* 섹션 상단 구분선 */}
          <div className="w-full max-w-[390px] mx-auto h-px bg-stone-200 mb-20 sm:mb-24" />

          <ScrollReveal>
            <h2 className="font-cormorant font-normal text-[30px] sm:text-[34px] tracking-normal text-stone-900 leading-none">
              MESSAGE
            </h2>
            <p className="font-serif text-[18px] sm:text-[19px] text-stone-800 font-normal tracking-normal mt-3.5 sm:mt-4 mb-3.5">
              축하 메시지
            </p>
            <p className="text-[13px] sm:text-[14px] text-stone-500 font-sans mb-12 sm:mb-14">
              저희 둘에게 따뜻한 메시지를 남겨주세요.
            </p>
          </ScrollReveal>

          {/* 축하 메시지 슬라이더 & 작성하기 버튼 */}
          <ScrollReveal delay={150}>
            <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-[390px] mx-auto font-sans">
              {/* 이전 화살표 */}
              <button
                type="button"
                onClick={() => setGuestbookIndex((prev) => (prev > 0 ? prev - 1 : guestbookList.length - 1))}
                className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-stone-600 text-3xl font-light cursor-pointer select-none transition-colors shrink-0"
                aria-label="이전 메시지"
              >
                ‹
              </button>

              {/* 메시지 카드 */}
              <div className="w-[275px] sm:w-[290px] max-w-full bg-white rounded-3xl p-6 sm:p-7 text-center border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 min-h-[175px] flex flex-col justify-between">
                <div className="flex justify-center mb-3.5">
                  <span className="inline-flex items-center px-4 py-1 border border-stone-200 rounded-full text-xs text-stone-700">
                    <span className="font-script text-[15px] text-stone-400 not-italic mr-1.5 leading-none">From</span>
                    <span className="font-medium text-stone-800">{guestbookList[guestbookIndex]?.author}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed whitespace-pre-line my-auto break-keep">
                  {guestbookList[guestbookIndex]?.content}
                </p>

                <div className="flex items-center justify-center gap-3 mt-3.5 text-[11px] sm:text-xs text-stone-400 font-sans">
                  <span>
                    {guestbookList[guestbookIndex]?.created_at?.slice(0, 10).replace(/-/g, '.') || ''}
                  </span>
                  {guestbookList[guestbookIndex]?.id && guestbookList[guestbookIndex]?.id !== '1' && (
                    <button
                      type="button"
                      onClick={() => setDeleteTargetMsg(guestbookList[guestbookIndex])}
                      className="text-stone-400 hover:text-rose-500 underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>

              {/* 다음 화살표 */}
              <button
                type="button"
                onClick={() => setGuestbookIndex((prev) => (prev < guestbookList.length - 1 ? prev + 1 : 0))}
                className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-stone-600 text-3xl font-light cursor-pointer select-none transition-colors shrink-0"
                aria-label="다음 메시지"
              >
                ›
              </button>
            </div>

            {/* 인디케이터 도트 */}
            <div className="flex justify-center gap-1.5 mt-6 mb-10">
              {guestbookList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGuestbookIndex(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === guestbookIndex ? 'w-1.5 h-1.5 bg-stone-700' : 'w-1.5 h-1.5 bg-stone-300'
                  }`}
                  aria-label={`축하 메시지 ${idx + 1}번으로 이동`}
                />
              ))}
            </div>

            {/* 작성하기 버튼 */}
            <div className="text-center font-sans">
              <button
                type="button"
                onClick={() => setShowGuestbookModal(true)}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-[#333333] hover:bg-[#222222] text-white text-sm rounded-xl transition-colors shadow-xs font-medium cursor-pointer"
              >
                <span>작성하기</span>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 11. 엔딩 사진 & 감사 인사 (Image 11) */}
      <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FCFBF7] text-center">
        <ScrollReveal duration={1000}>
          {/* 엔딩 사진 프레임 */}
          <div className="w-full max-w-[390px] mx-auto px-6 mb-12 sm:mb-14">
            <div className="w-full aspect-[4/3] overflow-hidden shadow-2xs">
              <img
                src={endingImage}
                alt="Ending Cover"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Thank you & 감사 문구 */}
          <div className="px-6 mb-12 sm:mb-14">
            <h2 className="font-cormorant italic text-[38px] sm:text-[44px] text-stone-800 font-normal tracking-wide leading-tight mb-4">
              Thank you
            </h2>
            <p className="text-[14px] sm:text-[15px] text-stone-600 font-sans mb-2.5">
              함께해 주셔서 감사합니다.
            </p>
            {(() => {
              const endingNames = [invitation?.bride_name, invitation?.groom_name].filter(Boolean).join(' · ');
              return endingNames ? (
                <p className="text-[14px] sm:text-[15px] text-stone-700 font-medium font-sans">
                  {endingNames} 드림
                </p>
              ) : null;
            })()}
          </div>
        </ScrollReveal>

        {/* 12. 하단 공유 바 */}
        <ScrollReveal delay={150}>
          <div className="grid grid-cols-2 gap-3 max-w-[390px] mx-auto px-6 font-sans">
            <button
              type="button"
              onClick={handleKakaoShare}
              className="py-3.5 px-3 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-xs sm:text-[13px] font-medium rounded-full border border-stone-200/50 shadow-2xs transition-colors flex items-center justify-center cursor-pointer"
            >
              카카오톡으로 공유하기
            </button>
            <button
              type="button"
              onClick={() => handleCopy(window.location.href, '청첩장 주소가')}
              className="py-3.5 px-3 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-xs sm:text-[13px] font-medium rounded-full border border-stone-200/50 shadow-2xs transition-colors flex items-center justify-center cursor-pointer"
            >
              링크 복사하기
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* 모달 레이어들 */}
      {showContactModal && (
        <ContactModal 
          invitation={invitation} 
          onClose={() => setShowContactModal(false)} 
        />
      )}

      {showRsvpModal && (
        <RsvpModal
          invitationId={invitation?.id}
          onClose={() => setShowRsvpModal(false)}
        />
      )}

      {showGuestbookModal && (
        <GuestbookModal
          invitationId={invitation?.id}
          onClose={() => setShowGuestbookModal(false)}
          onSuccess={(newMsg) => {
            setGuestbookList((prev) => [newMsg, ...prev.filter((item) => item.id !== '1')]);
            setGuestbookIndex(0);
          }}
        />
      )}

      {deleteTargetMsg && (
        <GuestbookDeleteModal
          targetMsg={deleteTargetMsg}
          onClose={() => setDeleteTargetMsg(null)}
          onDeleteSuccess={(deletedId) => {
            setGuestbookList((prev) => {
              const updated = prev.filter((item) => item.id !== deletedId);
              return updated.length > 0 ? updated : defaultGuestbook;
            });
            setGuestbookIndex(0);
          }}
        />
      )}

    </div>
  );
}