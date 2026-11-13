'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
import TodayConciergeCard from '@/components/TodayConciergeCard';
import GuestPhotoSnapSection from '@/components/GuestPhotoSnapSection';
import KakaoMap from '@/components/KakaoMap';
import CinematicIntro from './CinematicIntro';
import EditorialRsvpModal from '../editorial/EditorialRsvpModal';
import EditorialGuestbookModal from '../editorial/EditorialGuestbookModal';
import EditorialGalleryModal from '../editorial/EditorialGalleryModal';
import EditorialContactModal from '../editorial/EditorialContactModal';
import { supabase } from '@/lib/supabase';
import { getSafeKakaoShareImageUrl } from '@/lib/kakaoShare';
import { renderParentPair } from '@/components/ParentDeceasedName';

export default function CinematicTemplate({ invitation }) {
  // 1. ☀️ Brightly (Day) ↔ 🌙 Midnight (Night) 듀얼 테마 스위처
  const [isNightMode, setIsNightMode] = useState(false);

  // 1-1. 커버 인트로 화면 상태 (기본값 true)
  const [showIntro, setShowIntro] = useState(true);

  // 2. 모달 제어 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 3. 갤러리 탭 (Our Story vs Wedding Photo)
  const [galleryTab, setGalleryTab] = useState('story');

  // 4. 축의금 계좌 탭 (신랑측에게 vs 신부측에게)
  const [userAccountTab, setUserAccountTab] = useState(null);



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

  const showIntroSection = config.show_intro !== false;
  const showCountdownSection = config.show_countdown !== false;
  const showGallerySection = config.show_gallery !== false;
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;

  const isModalPreview = Boolean(invitation?.is_modal_preview);

  // 모달 미리보기 중 인트로 활성화 시 모달 스크롤 컨테이너를 잠그고, 수락 시 스크롤 복원
  useEffect(() => {
    if (isModalPreview && typeof document !== 'undefined') {
      const container = document.getElementById('preview-scroll-container');
      if (container) {
        if (showIntro && showIntroSection) {
          container.style.overflowY = 'hidden';
          container.scrollTop = 0;
        } else {
          container.style.overflowY = 'auto';
        }
      }
    }
    return () => {
      if (isModalPreview && typeof document !== 'undefined') {
        const container = document.getElementById('preview-scroll-container');
        if (container) {
          container.style.overflowY = 'auto';
        }
      }
    };
  }, [isModalPreview, showIntro, showIntroSection]);

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
  const couplePhoto = images.couple_photo || images.couple || images.couple_profile || extra.couple_photo || (userGallery && userGallery.length > 0 ? userGallery[0] : null) || (isSample ? '/samples/couple-profile-01.jpg' : '');
  const datePhoto = images.calendar || images.calendar_photo || images.ending || (userGallery && userGallery.length > 1 ? userGallery[1] : null) || (isSample ? '/samples/ending-04-classic.jpg' : '');

  // 성함 데이터 (하드코딩 더미 성함 완전 제거)
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const groomFirstEn = invitation?.groom_first_name_en || (invitation?.groom_name_en || '').split(' ')[0] || '';
  const brideFirstEn = invitation?.bride_first_name_en || (invitation?.bride_name_en || '').split(' ')[0] || '';
  const displayNamesEn = invitation?.main_names_en || (groomFirstEn && brideFirstEn ? `${groomFirstEn} & ${brideFirstEn}` : '');

  const displayNamesEnUpper = useMemo(() => {
    const gf = (
      invitation?.groom_name_en ||
      [invitation?.groom_last_name_en, invitation?.groom_first_name_en].filter(Boolean).join(' ') ||
      invitation?.groom_first_name_en ||
      ''
    ).trim();

    const bf = (
      invitation?.bride_name_en ||
      [invitation?.bride_last_name_en, invitation?.bride_first_name_en].filter(Boolean).join(' ') ||
      invitation?.bride_first_name_en ||
      ''
    ).trim();

    if (gf && bf) {
      return `${gf.toUpperCase()} & ${bf.toUpperCase()}`;
    }
    if (invitation?.main_names_en) {
      return invitation.main_names_en.toUpperCase();
    }
    if (gf || bf) {
      return (gf || bf).toUpperCase();
    }
    if (invitation?.groom_name && invitation?.bride_name) {
      return `${invitation.groom_name} & ${invitation.bride_name}`;
    }
    if (isSample) {
      return 'JANG MIN KI & KWON KI-DEUK';
    }
    return '';
  }, [invitation, isSample]);

  // 섹션 2 Welcome to 영문 타이틀용 TitleCase 성함 (Figma: Jang Min-ki & Kwon Ki-deuk)
  const displayNamesEnTitleCase = useMemo(() => {
    const formatTitleCase = (str) => {
      if (!str) return '';
      return str
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    const gf = formatTitleCase(
      invitation?.groom_name_en ||
      [invitation?.groom_last_name_en, invitation?.groom_first_name_en].filter(Boolean).join(' ') ||
      invitation?.groom_first_name_en
    );
    const bf = formatTitleCase(
      invitation?.bride_name_en ||
      [invitation?.bride_last_name_en, invitation?.bride_first_name_en].filter(Boolean).join(' ') ||
      invitation?.bride_first_name_en
    );

    if (gf && bf) return `${gf}  &  ${bf}`;
    if (invitation?.main_names_en) return invitation.main_names_en;
    if (gf || bf) return gf || bf;
    if (invitation?.groom_name && invitation?.bride_name) {
      return `${invitation.groom_name} & ${invitation.bride_name}`;
    }
    if (isSample) return 'Jang Min-ki  &  Kwon Ki-deuk';
    return '';
  }, [invitation, isSample]);

  // 부모님 성함 & 故 / 국화꽃 표기 포맷팅
  const deceasedMarker = config.deceased_marker || invitation?.deceased_marker || 'hanja';
  const isGroomFatherDeceased = invitation?.groom_father_deceased ?? config.groom_father_deceased ?? false;
  const isGroomMotherDeceased = invitation?.groom_mother_deceased ?? config.groom_mother_deceased ?? false;
  const isBrideFatherDeceased = invitation?.bride_father_deceased ?? config.bride_father_deceased ?? false;
  const isBrideMotherDeceased = invitation?.bride_mother_deceased ?? config.bride_mother_deceased ?? false;

  const groomParentsNode = renderParentPair({
    father: invitation?.groom_father,
    isFatherDeceased: isGroomFatherDeceased,
    mother: invitation?.groom_mother,
    isMotherDeceased: isGroomMotherDeceased,
    markerType: deceasedMarker,
    separator: ' · ',
    iconClassName: 'w-[13px] h-[15px] inline-block align-[-2px] mr-1 text-stone-400 shrink-0',
  });
  const hasGroomParents = Boolean(invitation?.groom_father || invitation?.groom_mother);

  const brideParentsNode = renderParentPair({
    father: invitation?.bride_father,
    isFatherDeceased: isBrideFatherDeceased,
    mother: invitation?.bride_mother,
    isMotherDeceased: isBrideMotherDeceased,
    markerType: deceasedMarker,
    separator: ' · ',
    iconClassName: 'w-[13px] h-[15px] inline-block align-[-2px] mr-1 text-stone-400 shrink-0',
  });
  const hasBrideParents = Boolean(invitation?.bride_father || invitation?.bride_mother);

  const groomRelation = config.groom_relation || invitation?.groom_relation || '';
  const brideRelation = config.bride_relation || invitation?.bride_relation || '';

  // 날짜 계산 (샘플 모드일 때만 기본 데모 일시 사용, 실제 고객은 미입력 시 공백 처리)
  const weddingDateStr = invitation?.wedding_date || (isSample ? '2027-03-27 23:00:00' : '');
  const targetDate = useMemo(() => {
    if (!weddingDateStr) return null;
    const normalized = typeof weddingDateStr === 'string' ? weddingDateStr.replace(' ', 'T') : weddingDateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }, [weddingDateStr]);

  // D-Day 계산 (useMemo를 통한 즉각적 파생 상태 계산)
  const timeLeft = useMemo(() => {
    if (!targetDate) return { totalDays: 0, isPast: false, isToday: false };
    const now = new Date();
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDayCount = Math.round((targetMidnight - nowMidnight) / (1000 * 60 * 60 * 24));
    const isPast = diffDayCount < 0;
    const isToday = diffDayCount === 0;
    const totalDays = Math.abs(diffDayCount);
    return { totalDays, isPast, isToday };
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
    if (!targetDate) return { fullDateDot: '', monthScript: '', timeStr: '', timeStrShort: '', dowEn: '', fullEn: '', calendarHeaderDate: '' };
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dowsEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dowsKo = ['일', '월', '화', '수', '목', '금', '토'];

    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const d = targetDate.getDate();
    const dow = dowsEn[targetDate.getDay()];
    const dowKo = dowsKo[targetDate.getDay()];
    const monthStr = months[m];

    const hours = targetDate.getHours();
    const minutes = targetDate.getMinutes();
    const period = hours < 12 ? 'AM' : 'PM';
    const periodLower = hours < 12 ? 'am' : 'pm';
    const periodKo = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const timeFormatted = `${period} ${displayHour}:${String(minutes).padStart(2, '0')}`;
    const timeFormattedShort = `${period} ${displayHour}:${String(minutes).padStart(2, '0')}`;
    const timeFormattedKo = minutes === 0 ? `${periodKo} ${displayHour}시` : `${periodKo} ${displayHour}시 ${minutes}분`;
    const hourStr24 = String(hours).padStart(2, '0');
    const section1DateFormatted = `${y}.${monthStr.slice(0, 3)} ${d}. ${hourStr24}:${String(minutes).padStart(2, '0')} ${periodLower}`;
    const calendarHeaderFormatted = `${y}년 ${m + 1}월 ${d}일 ${dowKo}요일 | ${timeFormattedKo}`;

    return {
      fullDateDot: `${y}.${String(m + 1).padStart(2, '0')}.${String(d).padStart(2, '0')}`,
      monthScript: `${monthStr}.`,
      timeStr: timeFormatted,
      timeStrShort: timeFormattedShort,
      dowEn: dow.slice(0, 3).toUpperCase(),
      fullEn: `${dow}, ${monthStr} ${d}, ${y}`,
      section1DateStr: section1DateFormatted,
      calendarHeaderDate: calendarHeaderFormatted,
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

  const groomAccounts = allAccounts.filter(
    (a) =>
      a.group === '신랑측' ||
      a.group === '신랑' ||
      a.side === 'groom' ||
      a.title === '신랑' ||
      a.relation === '신랑' ||
      a.title?.includes('신랑') ||
      a.relation?.includes('신랑') ||
      a.name?.includes('신랑') ||
      a.holder?.includes('신랑')
  );
  const brideAccounts = allAccounts.filter(
    (a) =>
      a.group === '신부측' ||
      a.group === '신부' ||
      a.side === 'bride' ||
      a.title === '신부' ||
      a.relation === '신부' ||
      a.title?.includes('신부') ||
      a.relation?.includes('신부') ||
      a.name?.includes('신부') ||
      a.holder?.includes('신부')
  );

  // 신랑측 계좌가 없고 신부측 계좌만 등록된 경우 신부측 탭 자동 우선 선택 (파생 상태)
  const accountTab = userAccountTab || (groomAccounts.length === 0 && brideAccounts.length > 0 ? 'bride' : 'groom');
  const setAccountTab = setUserAccountTab;
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
    const coupleKo = [groomName, brideName].filter(Boolean).join(' ♥ ');
    const shareTitle = displayNamesEn
      ? `${displayNamesEn} 결혼식에 초대합니다`
      : coupleKo
      ? `${coupleKo} 결혼식에 초대합니다`
      : '소중한 결혼식에 초대합니다';
    const shareDesc = [formattedDates.fullDateDot, venueFullName].filter(Boolean).join(' | ');
    const shareImg = getSafeKakaoShareImageUrl(
      images.cover || mainImage,
      'cinematic'
    );

    if (typeof window !== 'undefined' && window.Kakao && window.Kakao.isInitialized()) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: shareTitle,
            description: shareDesc,
            imageUrl: shareImg,
            imageWidth: 800,
            imageHeight: 1000,
            link: { mobileWebUrl: currentUrl, webUrl: currentUrl },
          },
          buttons: [
            { title: '모바일 청첩장 보기', link: { mobileWebUrl: currentUrl, webUrl: currentUrl } },
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
      {(!showIntro || !showIntroSection) && (
        <TodayConciergeCard invitation={invitation} />
      )}

      {/* 0. 시네마틱 모노리스 인트로 커버 화면 */}
      {showIntro && showIntroSection && (
        <CinematicIntro
          invitation={invitation}
          isInModal={isModalPreview}
          isNightMode={isNightMode}
          setIsNightMode={setIsNightMode}
          onOpen={() => {
            setShowIntro(false);
          }}
        />
      )}

      {/* 본문 콘텐츠: 모달 미리보기 중 인트로 활성화 시에는 노출 및 높이 차지 방지 */}
      <div className={isModalPreview && showIntro && showIntroSection ? 'hidden' : 'contents'}>
        {/* ========================================================
            00. 좌측 상단 플로팅 테마 스위처 (☀️ Brightly ↔ 🌙 Midnight)
                (우측 상단 BGM 플레이어와 겹치지 않도록 좌측 상단에 정갈하게 배치)
            ======================================================== */}
        {(!showIntro || !showIntroSection) && (
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
    )}

      {/* ========================================================
          01. 섹션 1 (Figma 1:1 매칭: Full-width 메인 화보 + The marriage of 오버레이 + 하단 그라데이션 페이드)
          ======================================================== */}
      <section className="relative w-full select-none flex flex-col items-center">
        {/* A. 상단 메인 화보 + 텍스트 오버레이 + 하단 페이드 그라데이션 */}
        <div className="relative w-full aspect-[784/937] overflow-hidden bg-stone-100 dark:bg-stone-900">
          {mainImage ? (
            <img
              src={mainImage}
              alt="Main wedding portrait"
              className="w-full h-full object-cover object-center grayscale contrast-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
              Wedding Photo
            </div>
          )}

          {/* 상단 텍스트 오버레이: The marriage of + 신랑 & 신부 영문명 (Figma: #FEFEFE) */}
          <div 
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.2rem)' }}
            className="absolute inset-x-0 flex flex-col items-center text-center px-4 z-10"
          >
            {/* The marriage of (Figma: Weddingday Personal Use 65px -> 1x 32.5px) */}
            <h1
              className="text-[32px] sm:text-[35px] leading-tight text-[#FEFEFE] drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
              style={{
                fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive",
              }}
            >
              The marriage of
            </h1>

            {/* JANG MIN KI & KWON KI-DEUK (Figma: Cormorant Garamond 600, 48px -> 1x 24px) */}
            {displayNamesEnUpper && (
              <h2
                className="font-editorial-serif font-semibold text-[22px] sm:text-[24px] leading-tight tracking-[0.05em] uppercase text-[#FEFEFE] mt-3 sm:mt-3.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                }}
              >
                {displayNamesEnUpper}
              </h2>
            )}
          </div>

          {/* 사진 하단 페이드 그라데이션 (Figma 272px~937px 블렌딩: 투명 -> 배경색으로 부드럽게 전환) */}
          <div
            className={`absolute inset-x-0 bottom-0 h-[52%] pointer-events-none transition-colors duration-500 ${
              isNightMode
                ? 'bg-gradient-to-b from-transparent via-[#000000]/60 to-[#000000]'
                : 'bg-gradient-to-b from-transparent via-[#FEFEFE]/60 to-[#FEFEFE]'
            }`}
          />
        </div>

        {/* B. 하단 정보 영역: 날짜 + 장소 + Welcome to our Wedding Day */}
        <div className="w-full flex flex-col items-center text-center px-6 pt-7 sm:pt-9 pb-12 sm:pb-14 z-10">
          {/* 2027.May 15. 14:00 pm (Figma: Cormorant Garamond 500, 50px -> 1x 25px, letter-spacing 0.04em) */}
          {formattedDates.section1DateStr && (
            <p
              className={`font-editorial-serif font-medium text-[23px] sm:text-[25px] leading-tight tracking-[0.04em] transition-colors duration-300 ${
                isNightMode ? 'text-[#FFFFFF]' : 'text-[#292929]'
              }`}
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              {formattedDates.section1DateStr}
            </p>
          )}

          {/* 반얀트리 클럽 앤 스파 서울 (Figma: NanumSquare Neo OTF 400, 32px -> 1x 16px) */}
          {venueFullName && (
            <p
              className={`font-nanumsquare font-normal text-[15px] sm:text-[16px] leading-normal tracking-wide mt-[18px] sm:mt-[20px] transition-colors duration-300 ${
                isNightMode ? 'text-[#CCCCCC]' : 'text-[#333333]'
              }`}
            >
              {venueFullName}
            </p>
          )}

          {/* Welcome to our Wedding Day (Figma: Cormorant Garamond 400, 34px -> 1x 17px, 피그마 1x 73.5px 널찍한 여백) */}
          <p
            className={`font-editorial-serif text-[16px] sm:text-[17px] leading-tight tracking-[0.06em] mt-[68px] sm:mt-[76px] transition-colors duration-300 ${
              isNightMode ? 'text-[#9E9E9E]' : 'text-[#333333]'
            }`}
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
            }}
          >
            Welcome to our Wedding Day
          </p>

          {/* 섹션 구분선 (사용자 필수 지침: 항상 섹션이 끝날 때마다 구분선 적용) */}
          <div className="w-full max-w-[350px] border-b border-stone-200/80 dark:border-white/10 mt-[44px] sm:mt-[48px]" />
        </div>
      </section>

      {/* ========================================================
          02. 피그마 1:1 매칭: Welcome to 타이틀 + 신부/신랑 2열 프로필 + 양가 혼주 & 신랑신부 성함
          ======================================================== */}
      <section className="py-16 sm:py-20 px-6 text-center select-none flex flex-col items-center">
        <ScrollReveal>
          {/* 상단 2단 타이틀: Welcome to / Jang Min-ki & Kwon Ki-deuk (Figma: Cormorant Garamond 400, 48px -> 1x 24px) */}
          <div className="w-full max-w-[340px] mx-auto text-center mb-10 sm:mb-12">
            <h2
              className={`font-editorial-serif font-normal text-[23px] sm:text-[25px] leading-[1.2] transition-colors duration-300 ${
                isNightMode ? 'text-[#FFFFFF]' : 'text-[#292929]'
              }`}
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              <div>Welcome to</div>
              <div className="mt-1">{displayNamesEnTitleCase}</div>
            </h2>
          </div>

          {/* 중간 2열 프로필 스냅: 좌측 신부(Bride) & 우측 신랑(Groom) (Figma: 283.5px * 315.9px) */}
          <div className="w-full max-w-[340px] mx-auto grid grid-cols-2 gap-5 sm:gap-7 mb-[60px] sm:mb-[68px]">
            {/* 좌측: 신부 (Bride) */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-[283.5/315.9] bg-stone-100 dark:bg-stone-900 overflow-hidden shadow-xs mb-3">
                {bridePhoto ? (
                  <img
                    src={bridePhoto}
                    alt={brideName || 'Bride'}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                    Bride Photo
                  </div>
                )}
              </div>
              {/* Figma: Bride. & 이름 단정한 중앙 정렬 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 mt-2">
                <span
                  className="text-[14px] text-stone-400 tracking-wider italic"
                  style={{
                    fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive",
                  }}
                >
                  Bride.
                </span>
                <span className={`font-nanumsquare text-[13px] sm:text-[13.5px] font-normal transition-colors duration-300 ${
                  isNightMode ? 'text-stone-200' : 'text-[#333333]'
                }`}>
                  {brideName || (isSample ? '박지민' : '')}
                </span>
              </div>
            </div>

            {/* 우측: 신랑 (Groom) */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-[283.5/315.9] bg-stone-100 dark:bg-stone-900 overflow-hidden shadow-xs mb-3">
                {groomPhoto ? (
                  <img
                    src={groomPhoto}
                    alt={groomName || 'Groom'}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                    Groom Photo
                  </div>
                )}
              </div>
              {/* Figma: Groom. & 이름 단정한 중앙 정렬 */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 mt-2">
                <span
                  className="text-[14px] text-stone-400 tracking-wider italic"
                  style={{
                    fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive",
                  }}
                >
                  Groom.
                </span>
                <span className={`font-nanumsquare text-[13px] sm:text-[13.5px] font-normal transition-colors duration-300 ${
                  isNightMode ? 'text-stone-200' : 'text-[#333333]'
                }`}>
                  {groomName || (isSample ? '강민준' : '')}
                </span>
              </div>
            </div>
          </div>

          {/* 하단 혼주 & 서열 & 신랑신부 한글 성함 (Figma 447px * 74px 1:1 정밀 매칭) */}
          {(hasGroomParents || hasBrideParents || isSample) && (
            <div className="w-fit mx-auto flex flex-col space-y-3 select-none text-[13.5px] sm:text-[14px] font-nanumsquare font-normal">
              {/* 1행: 신랑측 (강오진 · 류창희      아들    강민준) */}
              {(hasGroomParents || isSample) && (
                <div className="grid grid-cols-[105px_42px_55px] gap-x-6 sm:gap-x-7 items-center text-left">
                  <div className={`transition-colors duration-300 whitespace-nowrap ${isNightMode ? 'text-stone-200' : 'text-[#333333]'}`}>
                    {hasGroomParents ? groomParentsNode : '강오진 · 류창희'}
                  </div>
                  <div className={`text-[12.5px] sm:text-[13px] text-center transition-colors duration-300 ${isNightMode ? 'text-stone-400' : 'text-[#999999]'}`}>
                    {groomRelation || (isSample ? '아들' : '장남')}
                  </div>
                  <div className={`transition-colors duration-300 whitespace-nowrap ${isNightMode ? 'text-stone-200' : 'text-[#333333]'}`}>
                    {groomName || (isSample ? '강민준' : '')}
                  </div>
                </div>
              )}

              {/* 2행: 신부측 (장철규 · 이정자      딸      박지민) */}
              {(hasBrideParents || isSample) && (
                <div className="grid grid-cols-[105px_42px_55px] gap-x-6 sm:gap-x-7 items-center text-left">
                  <div className={`transition-colors duration-300 whitespace-nowrap ${isNightMode ? 'text-stone-200' : 'text-[#333333]'}`}>
                    {hasBrideParents ? brideParentsNode : '장철규 · 이정자'}
                  </div>
                  <div className={`text-[12.5px] sm:text-[13px] text-center transition-colors duration-300 ${isNightMode ? 'text-stone-400' : 'text-[#999999]'}`}>
                    {brideRelation || (isSample ? '딸' : '장녀')}
                  </div>
                  <div className={`transition-colors duration-300 whitespace-nowrap ${isNightMode ? 'text-stone-200' : 'text-[#333333]'}`}>
                    {brideName || (isSample ? '박지민' : '')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 섹션 하단 구분선 (사용자 필수 지침: 항상 섹션이 끝날 때마다 구분선 적용) */}
          <div className="w-full max-w-[350px] border-b border-stone-200/80 dark:border-white/10 mt-14 sm:mt-16 mx-auto" />
        </ScrollReveal>
      </section>

      {/* ========================================================
          03. 모시는 글 본문 & 커플 화보 & 연락하기 (Figma 섹션3: 780px * 1589px 1:1 정밀 매칭)
          ======================================================== */}
      {(invitation?.message || couplePhoto || isSample) && (
        <section className={`select-none overflow-hidden transition-colors duration-300 ${
          isNightMode ? 'bg-[#1C1C1C]' : 'bg-[#FEFEFE]'
        }`}>
          <ScrollReveal>
            {/* 상단: 풀 와이드 커플 사진 화보 & 하단 페이드 그라데이션 (Figma Rectangle 6304: 780x576 -> 1x aspect-[780/576]) */}
            {couplePhoto && (
              <div className="relative w-full aspect-[780/576] overflow-hidden select-none">
                <img
                  src={couplePhoto}
                  alt="Couple Wedding Editorial"
                  className="w-full h-full object-cover object-center select-none"
                  onError={(e) => {
                    if (isSample && e.currentTarget.src !== '/samples/couple-profile-01.jpg') {
                      e.currentTarget.src = '/samples/couple-profile-01.jpg';
                    }
                  }}
                />
                {/* 피그마 Rectangle 6304 하단 페이드 그라데이션 */}
                <div
                  className="absolute inset-0 pointer-events-none transition-colors duration-300"
                  style={{
                    background: isNightMode
                      ? 'linear-gradient(180deg, rgba(28, 28, 28, 0) 68.73%, rgba(28, 28, 28, 0.4) 82.26%, #1C1C1C 100%)'
                      : 'linear-gradient(180deg, rgba(217, 217, 217, 0) 68.73%, rgba(236, 236, 236, 0.23) 82.26%, #FEFEFE 100%)',
                  }}
                />
              </div>
            )}

            {/* 하단: 모시는 글 본문 (Figma 실측: 사진 아래 178px -> 1x 89px, 초대합니다 18px, 간격 86px -> 1x 43px, 본문 너비 256px, 버튼 아래 간격 160px -> 1x 80px) */}
            <div className={`px-6 text-center flex flex-col items-center ${
              couplePhoto ? 'pt-[89px]' : 'pt-16'
            }`}>
              {/* 제목: 초대합니다 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, #292929, line-height 72%) */}
              <h2 className={`font-nanumsquare text-[18px] font-normal leading-none tracking-tight transition-colors duration-300 ${
                isNightMode ? 'text-stone-100' : 'text-[#292929]'
              }`}>
                {invitation?.message_title || config?.message_title || '초대합니다'}
              </h2>

              {/* 본문 초대글 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, 너비 512px -> 1x 256px, line-height 175%, #333333, 간격 43px) */}
              {(invitation?.message || isSample) && (
                <div className={`mt-[43px] w-[256px] max-w-full mx-auto font-nanumsquare text-[14px] font-normal leading-[1.75] tracking-tight break-keep whitespace-pre-line text-center transition-colors duration-300 ${
                  isNightMode ? 'text-stone-300' : 'text-[#333333]'
                }`}>
                  {invitation?.message ? (
                    invitation.message
                  ) : isSample ? (
                    <>
                      <p className="mb-6">
                        서로를 만나 평범했던 하루가<br />
                        조금 더 따뜻하고 특별해졌습니다.<br />
                        이제 두 사람이 한마음으로<br />
                        새로운 계절을 시작하려 합니다.
                      </p>
                      <p>
                        소중한 분들과 함께<br />
                        그 순간을 나누고 싶습니다.<br />
                        저희의 첫걸음에 따뜻한 축복을 보내주세요.
                      </p>
                    </>
                  ) : null}
                </div>
              )}

              {/* 연락하기 버튼 영역 (Figma: 너비 327px -> 1x 163.5px, 높이 76px -> 1x 38px, bg #F4F3F1, border 1px #D3D3D3, rounded-full, mt 95px -> 1x 47.5px) */}
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                style={{
                  boxShadow: isNightMode ? 'none' : '0px 2px 2.5px rgba(0, 0, 0, 0.07)',
                }}
                className={`mt-[47.5px] w-[163.5px] h-[38px] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] select-none ${
                  isNightMode
                    ? 'bg-[#2A2A2A] hover:bg-[#333333] border border-stone-700 text-stone-200'
                    : 'bg-[#F4F3F1] hover:bg-[#eceae7] border border-[#D3D3D3] text-[#666666]'
                }`}
              >
                {/* 연락하기 텍스트 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #666666) */}
                <span className="font-nanumsquare text-[14px] font-normal tracking-tight">
                  연락하기
                </span>
                {/* 연락하기 전화기 아이콘 (Figma: free-icon-call, 25px * 25px -> 1x 12.5px) */}
                <svg
                  width="12.5"
                  height="12.5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                  className="shrink-0"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>

              {/* 섹션 하단 구분선 (사용자 필수 지침: 항상 섹션이 끝날 때마다 구분선 적용 / Figma: 버튼 아래 160px -> 1x 80px) */}
              <div 
                style={{ borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[80px] mb-[40px] shrink-0 mx-auto" 
              />
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          04. WEDDING DAY & CALENDAR (Figma 섹션4: 780px * 1291px 1:1 정밀 매칭)
          ======================================================== */}
      {showCountdownSection && targetDate && calendarData && (
        <section className={`select-none overflow-hidden text-center transition-colors duration-300 ${
          isNightMode ? 'bg-[#1C1C1C]' : 'bg-[#FEFEFE]'
        }`}>
          <ScrollReveal>
            <div className="pt-16 sm:pt-20 px-6 flex flex-col items-center">
              {/* 상단 1: Wedding Day (Figma: Cormorant Garamond 50px -> 1x 25px, font-weight: 500, #292929, leading-[72%]) */}
              <h2
                className={`text-[25px] font-medium leading-none tracking-normal transition-colors duration-300 ${
                  isNightMode ? 'text-stone-100' : 'text-[#292929]'
                }`}
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
              >
                Wedding Day
              </h2>

              {/* 상단 2: 흑백 사진 화보 (Figma image 763: 354px * 315px -> 1x 177px * 157.5px, mt-[30px]) */}
              {datePhoto && (
                <div className="mt-[30px] w-[177px] aspect-[354/315] overflow-hidden bg-stone-100 dark:bg-stone-900 select-none shadow-xs">
                  <img
                    src={datePhoto}
                    alt="Wedding Day Moment"
                    className="w-full h-full object-cover object-center grayscale select-none"
                    onError={(e) => {
                      if (isSample && e.currentTarget.src !== '/samples/ending-04-classic.jpg') {
                        e.currentTarget.src = '/samples/ending-04-classic.jpg';
                      }
                    }}
                  />
                </div>
              )}

              {/* 상단 3: 일시 텍스트 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #333333, mt-[48px]) */}
              <p className={`mt-[48px] font-nanumsquare text-[14px] font-normal text-center leading-none tracking-tight select-none transition-colors duration-300 ${
                isNightMode ? 'text-stone-300' : 'text-[#333333]'
              }`}>
                {formattedDates.calendarHeaderDate || `${calendarData.year}년 ${calendarData.month}월 ${calendarData.weddingDay}일 | ${formattedDates.timeStr}`}
              </p>

              {/* 중앙: 7열 미니멀 숫자 달력 (Figma: 너비 509.45px -> 1x 254.7px, mt-[38px], 요일 헤더 없이 숫자만 정렬) */}
              <div className="mt-[38px] w-[255px] max-w-full mx-auto select-none font-sans">
                <div className="grid grid-cols-7 gap-y-1.5 text-center items-center">
                  {/* 1일 전 빈칸 */}
                  {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-[34px] h-[34px] mx-auto" />
                  ))}

                  {/* 날짜 숫자들 */}
                  {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                    const day = i + 1;
                    const isWedding = day === calendarData.weddingDay;
                    const isSunday = (calendarData.firstDayIndex + i) % 7 === 0;

                    return (
                      <div key={day} className="flex items-center justify-center w-[34px] h-[34px] mx-auto">
                        <span
                          className={`w-[32px] h-[32px] flex items-center justify-center rounded-full text-[13.5px] leading-none transition-all duration-200 ${
                            isWedding
                              ? (isNightMode 
                                  ? 'bg-stone-200 text-stone-950 font-medium shadow-xs' 
                                  : 'bg-[#454545] text-white font-medium shadow-xs')
                              : isSunday
                                ? 'text-[#E05353] font-normal'
                                : (isNightMode ? 'text-stone-300 font-normal' : 'text-[#666666] font-normal')
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 섹션 하단 구분선 (사용자 필수 지침: 항상 섹션이 끝날 때마다 구분선 적용 / Figma: mt-[75px] mb-[40px]) */}
              <div 
                style={{ borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[75px] mb-[40px] shrink-0 mx-auto" 
              />
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          05. WEDDING GALLERY (시네마틱 룩북 갤러리 - 가로 스와이프 화보)
          ======================================================== */}
      {showGallerySection && activeGalleryImages.length > 0 && (
        <section className={`py-16 sm:py-20 text-center select-none transition-colors duration-300 ${
          isNightMode ? 'bg-[#1C1C1C]' : 'bg-[#FEFEFE]'
        }`}>
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
            <div className={`w-full overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory flex gap-3 px-6 py-2 ${
              activeGalleryImages.length === 1 ? 'justify-center' : ''
            }`}>
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

            {/* 섹션 하단 구분선 (사용자 필수 지침: 항상 섹션이 끝날 때마다 구분선 적용) */}
            <div 
              style={{ borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' }}
              className="w-[280.5px] max-w-[75%] mt-[70px] mb-[10px] shrink-0 mx-auto" 
            />
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          06. INFORMATION (가로 스와이프 안내 카드 캐러셀)
          ======================================================== */}
      {infoCards.length > 0 && (
        <section className="py-18 sm:py-20 px-5 text-center border-t border-stone-200/60 dark:border-white/10">
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
        <section id="location-section" className="py-18 sm:py-20 px-5 text-center border-t border-stone-200/60 dark:border-white/10">
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
        <section id="accounts-section" className="py-18 sm:py-20 px-5 text-center border-t border-stone-200/60 dark:border-white/10">
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
              {currentAccounts.length > 0 ? (
                currentAccounts.map((acc, idx) => {
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
                            {acc.title || (acc.group === '신부측' || acc.side === 'bride' || accountTab === 'bride' ? '신부' : '신랑')}
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
                })
              ) : (
                <div className={`py-6 text-center text-xs ${isNightMode ? 'text-stone-500' : 'text-stone-400'}`}>
                  등록된 계좌 정보가 없습니다.
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 08-2. 하객 현장 사진 선물 섹션 */}
      <GuestPhotoSnapSection invitation={invitation} isNightMode={isNightMode} />

      {/* ========================================================
          09. RSVP & 푸터
          ======================================================== */}
      {showRsvpSection && (
        <section className="py-18 sm:py-20 px-5 text-center border-t border-stone-200/60 dark:border-white/10">
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
            <div id="share-section" className="flex flex-col items-center gap-3 text-xs font-sans text-stone-500 mb-14">
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
      </div>

      {/* 모달 연동 레이어 */}
      {showContactModal && (
        <EditorialContactModal 
          invitation={invitation} 
          isNightMode={isNightMode}
          onClose={() => setShowContactModal(false)} 
        />
      )}
      {showRsvpModal && (
        <EditorialRsvpModal invitation={invitation} invitationId={invitation?.id} onClose={() => setShowRsvpModal(false)} />
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
