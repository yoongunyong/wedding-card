'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import KakaoMap from '@/components/KakaoMap';
import EnvelopeIntro from '@/components/EnvelopeIntro';
import ContactModal from '@/components/ContactModal';
import GalleryModal from '@/components/GalleryModal';
import RsvpModal from '@/components/RsvpModal';
import GuestbookModal from '@/components/GuestbookModal';
import GuestbookDeleteModal from '@/components/GuestbookDeleteModal';
import ScrollReveal from '@/components/ScrollReveal';

export default function BasicTemplate({ invitation }) {
  const extra = invitation?.extra_data || {};

  // 0. 인트로 편지 봉투 커버 상태
  const [showIntro, setShowIntro] = useState(true);

  // 모달 제어 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState(null);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);

  // 갤러리 더보기 상태
  const [showMorePhotos, setShowMorePhotos] = useState(false);

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
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;
  const showGuestbookSection = config.show_guestbook !== false;

  // 본문 메인 풀스크린 사진 (images.main 최우선)
  const mainImage = images.main || extra.main_image || invitation?.main_image || invitation?.cover_image || '/cover.jpg';
  const hasBakedInText = typeof mainImage === 'string' && mainImage.includes('cover.jpg');

  // 신랑/신부 프로필 사진 (images.groom_profile / bride_profile 최우선)
  const groomPhoto = images.groom_profile || extra.groom_profile_image || invitation?.groom_photo || extra.groom_photo || '/groom.jpg';
  const bridePhoto = images.bride_profile || extra.bride_profile_image || invitation?.bride_photo || extra.bride_photo || '/bride.jpg';

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

  // 최소 8장 기본 노출, 더보기 클릭 시 전체 노출
  const displayedGalleryImages = showMorePhotos ? initialGalleryImages : initialGalleryImages.slice(0, 8);

  // 갤러리 2열 분할
  // 8개 단위로 묶어 앞의 절반은 왼쪽 열 (1, 2, 3, 4), 뒤의 절반은 오른쪽 열 (5, 6, 7, 8)로 배치
  // 8개 초과하는 남은 사진들도 균형 있게 좌/우 열로 순차 분할 배치
  const leftColumnItems = [];
  const rightColumnItems = [];
  const CHUNK_SIZE = 8;
  for (let i = 0; i < displayedGalleryImages.length; i += CHUNK_SIZE) {
    const chunk = displayedGalleryImages.slice(i, i + CHUNK_SIZE);
    const half = Math.ceil(chunk.length / 2);
    chunk.slice(0, half).forEach((src, idx) => {
      leftColumnItems.push({ src, originalIndex: i + idx });
    });
    chunk.slice(half).forEach((src, idx) => {
      rightColumnItems.push({ src, originalIndex: i + half + idx });
    });
  }

  // 시안 비대칭 매거진 레이아웃 고정 높이 패턴 (4개 단위 사이클)
  // 1~4번째: 좌측 [275, 135, 130, 175] (합 715px), 우측 [135, 225, 265, 135] (합 760px)
  // 5~8번째: 좌측과 우측의 패턴을 교차 적용하여 양쪽 총 높이 균형을 완벽히 유지 (각 1475px)
  const LEFT_HEIGHTS = [
    [275, 135, 130, 175],
    [135, 225, 265, 135],
  ];
  const RIGHT_HEIGHTS = [
    [135, 225, 265, 135],
    [275, 135, 130, 175],
  ];

  const getLeftHeight = (colIdx) => {
    const cycle = Math.floor(colIdx / 4) % 2;
    const subIdx = colIdx % 4;
    return LEFT_HEIGHTS[cycle][subIdx];
  };

  const getRightHeight = (colIdx) => {
    const cycle = Math.floor(colIdx / 4) % 2;
    const subIdx = colIdx % 4;
    return RIGHT_HEIGHTS[cycle][subIdx];
  };

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
  const rawDate = invitation?.wedding_date || '2027-03-27T11:00:00';
  const targetDate = useMemo(() => {
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? new Date('2027-03-27T11:00:00') : d;
  }, [rawDate]);

  // 실시간 카운트다운 타이머
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 });
  useEffect(() => {
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

  // 2. 정보(식사/셔틀/피로연/답례품 등) 동적 안내 카드 리스트
  const infoCards = useMemo(() => {
    if (Array.isArray(invitation?.info_notices) && invitation.info_notices.length > 0) {
      return invitation.info_notices;
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
  }, [invitation?.info_notices, extra.meal_info, extra.shuttle_info]);

  const [infoIndex, setInfoIndex] = useState(0);

  useEffect(() => {
    if (infoCards.length <= 1) return;
    const timer = setInterval(() => {
      setInfoIndex((prev) => (prev + 1) % infoCards.length);
    }, 4500); // 4.5초마다 자동 롤링
    return () => clearInterval(timer);
  }, [infoCards.length]);

  // 3. 오시는 길 (교통수단) 동적 리스트
  const transportationList = useMemo(() => {
    if (Array.isArray(invitation?.transportation) && invitation.transportation.length > 0) {
      return invitation.transportation;
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
  }, [invitation?.transportation, extra.transport_parking, extra.transport_car, extra.transport_bus, extra.transport_subway]);

  const getTransportIcon = (type) => {
    switch (type) {
      case 'car':
        return '/templates/basic/transportation-of-car.svg';
      case 'bus':
        return '/templates/basic/transportation-of-bus.svg';
      case 'subway':
      case 'metro':
        return '/templates/basic/transportation-of-subway.svg';
      case 'parking':
      default:
        return '/templates/basic/transportation-parking.svg';
    }
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
    <div className="w-full max-w-[430px] bg-[#FCFBF7] text-[#333333] min-h-screen flex flex-col font-sans shadow-2xl antialiased selection:bg-stone-200 relative">
      
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
            <div className="relative z-10 pt-[calc(env(safe-area-inset-top,0px)+3.5rem)] px-6 text-center">
              <h1 
                className="font-cormorant italic text-3xl sm:text-4xl drop-shadow-md tracking-wide"
                style={{ color: titleColor }}
              >
                We are getting married
              </h1>
              {Boolean(extra.main_date_en || hasWeddingDate) && (
                <p className="mt-2 text-xs sm:text-sm text-white/90 font-sans tracking-[0.25em] drop-shadow-sm">
                  {extra.main_date_en || `${calendarData.year}.${String(calendarData.month).padStart(2, '0')}.${String(calendarData.weddingDay).padStart(2, '0')} ${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][targetDate.getDay()]}`}
                </p>
              )}
            </div>

            {/* 하단: Welcome to & 신랑 신부 영문 이름 */}
            <div className="relative z-10 pb-[calc(env(safe-area-inset-bottom,0px)+3rem)] px-6 text-center">
              <p 
                className="font-script text-2xl drop-shadow"
                style={{ color: titleColor }}
              >
                Welcome to
              </p>
              {([invitation?.bride_name_en, invitation?.groom_name_en].some(Boolean)) && (
                <p className="font-cormorant italic text-2xl sm:text-3xl text-white font-medium tracking-wide drop-shadow-md mt-1">
                  {[invitation?.bride_name_en, invitation?.groom_name_en].filter(Boolean).join(' & ')}
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* 2. 초대합니다 & 혼주 & 연락처 모달 버튼 & 원형 프로필 (Image 2) */}
      <section className="py-20 px-6 bg-white text-center border-t border-[#F2ECE1]">
        <ScrollReveal>
          <h2 className="text-xl font-serif font-normal text-stone-800 tracking-wider mb-8">
            초대합니다
          </h2>

          {/* 초대 문구 */}
          <div className="text-[14px] font-sans text-stone-600 leading-[2.1] font-normal max-w-[320px] mx-auto mb-10 whitespace-pre-line">
            {invitation?.message || (
              `서로를 만나 평범했던 하루가\n조금 더 따뜻하고 특별해졌습니다.\n이제 두 사람이 한마음으로\n새로운 계절을 시작하려 합니다.\n\n소중한 분들과 함께\n그 순간을 나누고 싶습니다.\n저희의 첫걸음에 따뜻한 축복을 보내주세요.`
            )}
          </div>

          {/* 세로 구분선 */}
          <div className="w-px h-8 bg-stone-200 mx-auto mb-8" />

          {/* 부모님 & 신랑신부 성함 */}
          <div className="space-y-2 text-[14px] font-sans text-stone-700 font-normal mb-8 leading-relaxed">
            <p>
              {(invitation?.groom_father || invitation?.groom_mother) && (
                <span className="text-stone-500">
                  {[invitation?.groom_father, invitation?.groom_mother].filter(Boolean).join(' · ')}의 아들{' '}
                </span>
              )}
              <strong className="font-medium text-stone-900">{invitation?.groom_name || ''}</strong>
            </p>
            <p>
              {(invitation?.bride_father || invitation?.bride_mother) && (
                <span className="text-stone-500">
                  {[invitation?.bride_father, invitation?.bride_mother].filter(Boolean).join(' · ')}의 딸{' '}
                </span>
              )}
              <strong className="font-medium text-stone-900">{invitation?.bride_name || ''}</strong>
            </p>
          </div>

          {/* 축하 연락하기 버튼 */}
          <button
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm font-medium rounded-full font-sans transition-colors mb-16 shadow-2xs cursor-pointer"
          >
            <span>축하 연락하기</span>
            <span>📞</span>
          </button>
        </ScrollReveal>

        {/* We are getting married & 원형 프로필 사진 2개 */}
        <ScrollReveal delay={200}>
          <div>
            <p className="font-cormorant italic text-2xl text-stone-800 mb-6">
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
      </section>

      {/* 3. 웨딩 캘린더 & 카운트다운 타이머 (Image 3) */}
      <section className="py-20 px-6 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <ScrollReveal>
          <h2 className="font-cormorant text-3xl text-stone-800 tracking-wide mb-3">
            Wedding Day
          </h2>
          <p className="text-sm font-sans text-stone-700 font-medium mb-1">
            {formattedKoreanDate}
          </p>
          <p className="text-xs text-stone-400 font-sans tracking-wide mb-8">
            {formattedEnglishDate}
          </p>

          {/* 달력 컨테이너 */}
          <div className="max-w-[320px] mx-auto mb-10 pt-4 border-t border-[#EDE7DD]">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 text-center text-xs text-stone-600 font-sans mb-3.5">
              <span className="text-[#E0645A] font-medium py-1">일</span>
              <span className="text-stone-400 font-medium py-1">월</span>
              <span className="text-stone-400 font-medium py-1">화</span>
              <span className="text-stone-400 font-medium py-1">수</span>
              <span className="text-stone-400 font-medium py-1">목</span>
              <span className="text-stone-400 font-medium py-1">금</span>
              <span className="text-stone-400 font-medium py-1">토</span>
            </div>

            {/* 일자 그리드 (고정 aspect-square 셀 & 동일 높이 보장) */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-sans tabular-nums">
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
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] leading-none transition-colors ${
                        isWeddingDay
                          ? 'bg-[#FCE8A6] text-stone-900 font-bold shadow-xs'
                          : isSunday
                          ? 'text-[#E0645A]'
                          : 'text-stone-700'
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

        {hasWeddingDate && showCountdownSection && (
          <ScrollReveal delay={200}>
            {/* 카운트다운 4분할 카드 */}
            <div className="grid grid-cols-4 gap-2.5 max-w-[320px] mx-auto mb-8 font-sans">
              {[
                { label: 'DAYS', val: timeLeft.days },
                { label: 'HOURS', val: timeLeft.hours },
                { label: 'MINUTES', val: timeLeft.minutes },
                { label: 'SECONDS', val: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-3 shadow-xs border border-[#ECE5D8] flex flex-col items-center">
                  <span className="text-[10px] text-stone-400 tracking-wider font-medium">{item.label}</span>
                  <span className="font-sans text-[21px] font-light text-stone-700 mt-1 tabular-nums leading-tight tracking-normal">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>

            {/* D-Day 남은 일수 강조 문구 */}
            <p className="text-xs text-stone-600 font-sans">
              {(invitation?.groom_name || invitation?.bride_name) 
                ? `${[invitation?.groom_name, invitation?.bride_name].filter(Boolean).join(' ♥ ')}님의` 
                : '두 분의'} 결혼식이{' '}
              <strong className="text-[#E0645A] font-semibold">{timeLeft.totalDays}일</strong> 남았습니다.
            </p>
          </ScrollReveal>
        )}
      </section>

      {/* 4. 웨딩 갤러리 (Image 4) */}
      {initialGalleryImages.length > 0 && (
        <section className="py-20 px-4 bg-white text-center border-t border-[#F2ECE1]">
          <ScrollReveal>
            {/* 상단 손그림 드로잉 아이콘 1 */}
            <img 
              src="/templates/basic/미니멀 웨딩 아이콘 6종 세트 1.svg" 
              alt="갤러리" 
              className="w-16 h-16 mx-auto mb-3.5 object-contain opacity-90" 
            />
            <h2 className="text-lg font-serif text-stone-800 tracking-wider mb-8">
              웨딩 갤러리
            </h2>
          </ScrollReveal>

          {/* 비대칭 2열 매거진 그리드 레이아웃 (시안과 1:1 고정 비율) */}
          <ScrollReveal delay={200}>
            <div className="flex gap-2 max-w-[380px] mx-auto items-start">
              {/* 왼쪽 열 */}
              <div className="flex-1 flex flex-col gap-2">
                {leftColumnItems.map((item, colIdx) => (
                  <div
                    key={item.originalIndex}
                    onClick={() => setSelectedGalleryIndex(item.originalIndex)}
                    style={{ height: `${getLeftHeight(colIdx)}px` }}
                    className="w-full cursor-pointer overflow-hidden rounded-lg group bg-stone-100 shadow-2xs relative"
                  >
                    <img
                      src={item.src}
                      alt={`웨딩 사진 ${item.originalIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              {/* 오른쪽 열 */}
              <div className="flex-1 flex flex-col gap-2">
                {rightColumnItems.map((item, colIdx) => (
                  <div
                    key={item.originalIndex}
                    onClick={() => setSelectedGalleryIndex(item.originalIndex)}
                    style={{ height: `${getRightHeight(colIdx)}px` }}
                    className="w-full cursor-pointer overflow-hidden rounded-lg group bg-stone-100 shadow-2xs relative"
                  >
                    <img
                      src={item.src}
                      alt={`웨딩 사진 ${item.originalIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 더보기 버튼 (8장 초과 시 노출) */}
            {initialGalleryImages.length > 8 && (
              <div className="mt-8 max-w-[380px] mx-auto font-sans">
                <button
                  onClick={() => setShowMorePhotos(!showMorePhotos)}
                  className="w-full py-3.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl font-medium transition-colors"
                >
                  {showMorePhotos ? '접기' : '더보기'}
                </button>
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* 5. 식장 위치 & 지도 & 네비게이션 (Image 5) */}
      <section className="py-20 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <ScrollReveal>
          <div className="px-6">
            {/* 상단 손그림 드로잉 아이콘 2 */}
            <img 
              src="/templates/basic/미니멀 웨딩 아이콘 6종 세트 2.svg" 
              alt="식장 위치" 
              className="w-16 h-16 mx-auto mb-3.5 object-contain opacity-90" 
            />
            <h2 className="text-lg font-serif text-stone-800 tracking-wider mb-4">
              식장 위치
            </h2>
            {invitation?.venue_name && (
              <p className="text-base font-sans font-medium text-stone-800 mb-1">
                {invitation.venue_name}
              </p>
            )}
            {invitation?.venue_address && (
              <div className="inline-flex items-center gap-1.5 text-xs text-stone-500 mb-8 font-sans">
                <span>{invitation.venue_address}</span>
                <button 
                  onClick={() => handleCopy(invitation.venue_address, '식장 주소가')}
                  className="hover:opacity-75 transition-opacity cursor-pointer"
                  title="주소 복사"
                >
                  📋
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* 카카오 지도 */}
        <ScrollReveal delay={200}>
          <div className="w-full max-w-[380px] mx-auto px-4 mb-6">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-stone-200">
              <KakaoMap 
                address={invitation?.venue_address || ''} 
                venueName={invitation?.venue_name || ''} 
              />
            </div>
          </div>

          {/* 네이버 지도 / 카카오내비 버튼 2종 */}
          <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto px-4 font-sans">
            <button
              onClick={() => {
                const query = invitation?.venue_name || invitation?.venue_address;
                if (query) window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank');
              }}
              className="py-3 px-4 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl shadow-2xs border border-stone-200/60 flex items-center justify-center gap-2 transition-colors font-medium cursor-pointer"
            >
              <span>네이버 지도</span>
              <img src="/templates/basic/naver-map.svg" alt="네이버 지도" className="w-[18px] h-[18px] object-contain" />
            </button>
            <button
              onClick={() => {
                const query = invitation?.venue_name || invitation?.venue_address;
                if (query) window.open(`https://map.kakao.com/link/search/${encodeURIComponent(query)}`, '_blank');
              }}
              className="py-3 px-4 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl shadow-2xs border border-stone-200/60 flex items-center justify-center gap-2 transition-colors font-medium cursor-pointer"
            >
              <span>카카오네비</span>
              <img src="/templates/basic/kakao-navi.svg" alt="카카오내비" className="w-[18px] h-[18px] object-contain" />
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* 6. 교통편 상세 안내 (Image 6 - 동적 리스트 렌더링) */}
      {transportationList.length > 0 && (
        <section className="py-16 px-6 bg-[#F7F7F7] space-y-4 font-sans">
          {transportationList.map((item, idx) => (
            <ScrollReveal key={idx} delay={idx * 80}>
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-100">
                <div className="flex items-center gap-2 mb-3.5">
                  <span className="font-semibold text-sm text-stone-800">{item.title}</span>
                  <img
                    src={getTransportIcon(item.type)}
                    alt={item.title}
                    className="w-4 h-4 object-contain opacity-75"
                  />
                </div>
                <div className="w-full h-px bg-stone-100 mb-3.5" />
                <p className="text-xs text-stone-500 leading-relaxed break-keep whitespace-pre-line">
                  {item.content}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </section>
      )}

      {/* 7. 마음 전하실 곳 (Image 7) */}
      {showAccountsSection && (
        <section className="py-20 px-6 bg-white text-center border-t border-[#F2ECE1]">
          <ScrollReveal>
            {/* 상단 손그림 드로잉 아이콘 3 */}
            <img 
              src="/templates/basic/미니멀 웨딩 아이콘 6종 세트 3.svg" 
              alt="마음 전하실 곳" 
              className="w-16 h-16 mx-auto mb-3.5 object-contain opacity-90" 
            />
            <h2 className="text-lg font-serif text-stone-800 tracking-wider mb-8">
              마음 전하실 곳
            </h2>
          </ScrollReveal>

          {/* 신랑측 & 신부측 아코디언 */}
          <ScrollReveal delay={200}>
            {/* 신랑측 아코디언 */}
            <div className="bg-[#FAF9F6] rounded-2xl overflow-hidden shadow-2xs border border-stone-200 text-left mb-4 max-w-[340px] mx-auto font-sans">
              <button
                onClick={() => setOpenGroomAccount(!openGroomAccount)}
                className="w-full py-4 px-5 flex items-center justify-between text-sm font-medium text-stone-700 bg-stone-100/70 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span>신랑측 계좌번호</span>
                <svg
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${openGroomAccount ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openGroomAccount && (
                <div className="p-4 space-y-3 bg-white">
                  {groomAccounts.length > 0 ? (
                    groomAccounts.map((acc, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                        <div>
                          {acc.name && <p className="text-xs text-stone-500">{acc.name}</p>}
                          <p className="text-xs font-medium text-stone-800 mt-0.5">{acc.bank} {acc.number}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name ? acc.name + ' ' : ''}계좌번호가`)}
                          className="px-3.5 py-1.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-xs font-medium text-stone-600 rounded-full transition-colors font-sans cursor-pointer"
                        >
                          복사하기
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400 py-2 text-center font-sans">
                      등록된 계좌번호가 없습니다.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 신부측 아코디언 */}
            <div className="bg-[#FAF9F6] rounded-2xl overflow-hidden shadow-2xs border border-stone-200 text-left max-w-[340px] mx-auto font-sans">
              <button
                onClick={() => setOpenBrideAccount(!openBrideAccount)}
                className="w-full py-4 px-5 flex items-center justify-between text-sm font-medium text-stone-700 bg-stone-100/70 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span>신부측 계좌번호</span>
                <svg
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${openBrideAccount ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openBrideAccount && (
                <div className="p-4 space-y-3 bg-white">
                  {brideAccounts.length > 0 ? (
                    brideAccounts.map((acc, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                        <div>
                          {acc.name && <p className="text-xs text-stone-500">{acc.name}</p>}
                          <p className="text-xs font-medium text-stone-800 mt-0.5">{acc.bank} {acc.number}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name ? acc.name + ' ' : ''}계좌번호가`)}
                          className="px-3.5 py-1.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-xs font-medium text-stone-600 rounded-full transition-colors font-sans cursor-pointer"
                        >
                          복사하기
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400 py-2 text-center font-sans">
                      등록된 계좌번호가 없습니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 8. 정보 (식사/셔틀/피로연 등 동적 안내 카드) (Image 8) */}
      {infoCards.length > 0 && (
        <section className="py-20 px-6 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
          <ScrollReveal>
            {/* 상단 손그림 드로잉 아이콘 4 */}
            <img 
              src="/templates/basic/미니멀 웨딩 아이콘 6종 세트 4.svg" 
              alt="정보" 
              className="w-16 h-16 mx-auto mb-3.5 object-contain opacity-90" 
            />
            <h2 className="text-lg font-serif text-stone-800 tracking-wider mb-6">
              정보
            </h2>
          </ScrollReveal>

          {/* 롤링 슬라이더 컨테이너 */}
          <ScrollReveal delay={200}>
            <div className="flex items-center justify-center gap-2 max-w-[360px] mx-auto font-sans">
              {/* 이전 버튼 (2개 이상일 때만 노출) */}
              {infoCards.length > 1 && (
                <button
                  onClick={() => setInfoIndex((prev) => (prev > 0 ? prev - 1 : infoCards.length - 1))}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-2xl font-light cursor-pointer select-none transition-colors"
                  aria-label="이전 정보"
                >
                  ‹
                </button>
              )}

              {/* 정보 카드 */}
              <div className="w-[275px] max-w-full bg-white rounded-2xl p-6 text-center border border-stone-200/80 shadow-xs transition-all duration-300 min-h-[165px] flex flex-col justify-center">
                <h3 className="text-sm font-semibold text-stone-800 mb-1">
                  {infoCards[infoIndex]?.title}
                </h3>
                {infoCards[infoIndex]?.subtitle && (
                  <p className="text-xs text-stone-500 mb-3.5">
                    {infoCards[infoIndex]?.subtitle}
                  </p>
                )}
                <div className="w-full h-px bg-stone-100 mb-3.5" />
                <p className="text-xs text-stone-600 leading-relaxed break-keep whitespace-pre-line">
                  {infoCards[infoIndex]?.content}
                </p>
              </div>

              {/* 다음 버튼 (2개 이상일 때만 노출) */}
              {infoCards.length > 1 && (
                <button
                  onClick={() => setInfoIndex((prev) => (prev < infoCards.length - 1 ? prev + 1 : 0))}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-2xl font-light cursor-pointer select-none transition-colors"
                  aria-label="다음 정보"
                >
                  ›
                </button>
              )}
            </div>

            {/* 하단 인디케이터 도트 (2개 이상일 때만 노출) */}
            {infoCards.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {infoCards.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInfoIndex(idx)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      idx === infoIndex ? 'w-2 h-2 bg-stone-700' : 'w-1.5 h-1.5 bg-stone-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* 9. 참석 의사 (RSVP) (Image 9) */}
      {showRsvpSection && (
        <section className="py-20 px-6 bg-white text-center border-t border-[#F2ECE1]">
          <ScrollReveal>
            {/* 상단 손그림 드로잉 아이콘 5 */}
            <img 
              src="/templates/basic/미니멀 웨딩 아이콘 6종 세트 5.svg" 
              alt="참석 의사" 
              className="w-16 h-16 mx-auto mb-3.5 object-contain opacity-90" 
            />
            <h2 className="text-lg font-serif text-stone-800 tracking-wider mb-1">
              참석 의사
            </h2>
            <p className="text-xs text-stone-400 font-light mb-8 font-sans">
              모든 분들을 소중하게 모실 수 있도록 전해주세요
            </p>
          </ScrollReveal>

          {/* 안내 카드 & 참석 정보 전달하기 버튼 */}
          <ScrollReveal delay={200}>
            <div className="bg-[#FAF9F6] rounded-2xl p-7 max-w-[320px] mx-auto shadow-2xs border border-stone-200 mb-6 font-sans">
              <p className="text-sm font-semibold text-stone-800 mb-3">
                {[
                  invitation?.groom_name ? `신랑 ${invitation.groom_name}` : '',
                  invitation?.bride_name ? `신부 ${invitation.bride_name}` : ''
                ].filter(Boolean).join(' ♥ ')}
              </p>
              <div className="w-full h-px bg-stone-200 mb-3" />
              <p className="text-xs text-stone-600 mb-1">
                {formattedKoreanDate}
              </p>
              {invitation?.venue_name && (
                <p className="text-xs text-stone-500">
                  {invitation.venue_name}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowRsvpModal(true)}
              className="w-full max-w-[320px] py-4 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded-xl text-sm font-medium tracking-wide transition-colors shadow-sm font-sans cursor-pointer"
            >
              참석 정보 전달하기
            </button>
          </ScrollReveal>
        </section>
      )}

      {/* 10. 방명록 (Image 10) */}
      {showGuestbookSection && (
        <section className="py-20 px-6 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
          <ScrollReveal>
            {/* 상단 손그림 드로잉 아이콘 6 */}
            <img 
              src="/templates/basic/미니멀 웨딩 아이콘 6종 세트 6.svg" 
              alt="방명록" 
              className="w-16 h-16 mx-auto mb-3.5 object-contain opacity-90" 
            />
            <h2 className="text-lg font-serif text-stone-800 tracking-wider mb-1">
              방명록
            </h2>
            <p className="text-xs text-stone-400 font-light mb-8 font-sans">
              저희 둘에게 따뜻한 메시지를 남겨주세요.
            </p>
          </ScrollReveal>

          {/* 방명록 슬라이더 & 버튼 */}
          <ScrollReveal delay={200}>
            <div className="flex items-center justify-center gap-2 max-w-[360px] mx-auto font-sans">
              {/* 이전 화살표 */}
              <button
                onClick={() => setGuestbookIndex((prev) => (prev > 0 ? prev - 1 : guestbookList.length - 1))}
                className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-2xl font-light cursor-pointer select-none transition-colors"
                aria-label="이전 방명록"
              >
                ‹
              </button>

              {/* 방명록 카드 (가로폭 축소로 사각형이 아담해지고 화살표와 겹치지 않음) */}
              <div className="w-[275px] max-w-full bg-white rounded-2xl p-6 text-center border border-stone-200 shadow-xs transition-all duration-300 min-h-[160px] flex flex-col justify-between">
                <div className="flex justify-center mb-3">
                  <span className="inline-flex items-center px-3 py-1 border border-stone-200 rounded-full text-xs text-stone-600 font-serif">
                    <em className="text-[10px] text-stone-400 not-italic mr-1.5">From</em>
                    <strong className="font-medium">{guestbookList[guestbookIndex]?.author}</strong>
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line my-auto break-keep">
                  {guestbookList[guestbookIndex]?.content}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-stone-400 font-sans">
                  <span>
                    {guestbookList[guestbookIndex]?.created_at?.slice(0, 10).replace(/-/g, '.') || ''}
                  </span>
                  {guestbookList[guestbookIndex]?.id && guestbookList[guestbookIndex]?.id !== '1' && (
                    <>
                      <span className="text-stone-300">&middot;</span>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetMsg(guestbookList[guestbookIndex])}
                        className="text-stone-400 hover:text-rose-500 underline underline-offset-2 cursor-pointer transition-colors"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 다음 화살표 */}
              <button
                onClick={() => setGuestbookIndex((prev) => (prev < guestbookList.length - 1 ? prev + 1 : 0))}
                className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-2xl font-light cursor-pointer select-none transition-colors"
                aria-label="다음 방명록"
              >
                ›
              </button>
            </div>

            {/* 인디케이터 도트 */}
            <div className="flex justify-center gap-1.5 mt-4 mb-8">
              {guestbookList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setGuestbookIndex(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === guestbookIndex ? 'w-2 h-2 bg-stone-700' : 'w-1.5 h-1.5 bg-stone-300'
                  }`}
                />
              ))}
            </div>

            {/* 작성하기 버튼 */}
            <div className="max-w-[320px] mx-auto font-sans">
              <button
                onClick={() => setShowGuestbookModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl transition-colors shadow-2xs font-medium cursor-pointer"
              >
                <span>작성하기</span>
                <span>✏️</span>
              </button>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 11. 엔딩 사진 (Image 11 Top) */}
      <ScrollReveal duration={1000}>
        <section className="relative w-full h-[480px] overflow-hidden select-none">
          <img
            src={endingImage}
            alt="Ending Cover"
            className="w-full h-full object-cover"
          />
          {typeof endingImage === 'string' && !endingImage.includes('ending.jpg') && (
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center p-6 text-center">
              <p className="text-white text-base font-light tracking-widest drop-shadow-md">
                축하해주셔서 감사합니다.
              </p>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* 12. 하단 공유 바 (Image 11 Bottom) */}
      <footer className="py-8 px-6 bg-white space-y-3 font-sans border-t border-stone-100">
        <ScrollReveal delay={100}>
          <button
            onClick={handleKakaoShare}
            className="w-full py-4 px-5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-800 text-sm font-medium rounded-2xl flex items-center justify-between transition-colors shadow-2xs mb-3"
          >
            <span>카카오톡으로 공유하기</span>
            <img 
              src="/templates/basic/kakaotalk-share.svg" 
              alt="카카오톡" 
              className="w-6 h-6 object-contain" 
            />
          </button>
          <button
            onClick={() => handleCopy(window.location.href, '청첩장 주소가')}
            className="w-full py-4 px-5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-800 text-sm font-medium rounded-2xl flex items-center justify-between transition-colors shadow-2xs"
          >
            <span>청첩장 주소 복사하기</span>
            <img 
              src="/templates/basic/link-copy.svg" 
              alt="링크 복사" 
              className="w-5 h-5 object-contain" 
            />
          </button>
        </ScrollReveal>
      </footer>

      {/* 모달 레이어들 */}
      {showContactModal && (
        <ContactModal 
          invitation={invitation} 
          onClose={() => setShowContactModal(false)} 
        />
      )}

      {selectedGalleryIndex !== null && initialGalleryImages.length > 0 && (
        <GalleryModal
          images={initialGalleryImages}
          initialIndex={selectedGalleryIndex}
          onClose={() => setSelectedGalleryIndex(null)}
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