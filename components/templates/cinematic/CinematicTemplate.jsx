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

// 전국 지하철 & 버스 노선 공식/감성 컬러 맵 (피그마 1:1 매칭)
const TRANSIT_COLORS = {
  '1호선': '#0052A4',
  '2호선': '#00A84D',
  '3호선': '#EF7C1C',
  '4호선': '#00A5DE',
  '5호선': '#996CAC',
  '6호선': '#CD7C2F',
  '7호선': '#407550', // 피그마 실측 올리브 그린
  '8호선': '#E6186C',
  '9호선': '#BDB092',
  '분당선': '#C79126', // 피그마 실측 골드 옐로우
  '수인분당선': '#C79126',
  '신분당선': '#D4003B',
  '경의중앙선': '#77C4A3',
  '공항철도': '#0090D2',
  '경춘선': '#0C8E72',
  '우이신설선': '#B0CE1A',
  '신림선': '#6789CA',
  '서해선': '#81A914',
  '간선버스': '#5B86BF', // 피그마 실측 간선 파랑
  '지선버스': '#71AB67', // 피그마 실측 지선 초록
  '광역버스': '#E6186C',
  '마을버스': '#8CB83C',
};

// 텍스트에서 지하철/버스 호선 키워드만 감지해 컬러링하는 스마트 파서
function renderTransitText(text) {
  if (!text) return null;
  const regex = /(1호선|2호선|3호선|4호선|5호선|6호선|7호선|8호선|9호선|수인분당선|분당선|신분당선|경의중앙선|공항철도|경춘선|우이신설선|신림선|서해선|간선버스|지선버스|광역버스|마을버스)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const color = TRANSIT_COLORS[part];
    if (color) {
      return (
        <span key={i} style={{ color }} className="font-medium mr-0.5">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);

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

  // 갤러리 이미지 안전 파싱 (고객 등록 사진 최우선, 샘플 모드 시 데모 갤러리 제공)
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

  const defaultGalleryImages = useMemo(() => isSample ? [
    '/samples/garden-couple.jpg',
    '/samples/bride-solo.jpg',
    '/samples/groom-solo.jpg',
    '/samples/photo-11-rose-hug.jpg',
    '/samples/photo-01-walk.jpg',
    '/samples/photo-13-ring-laugh.jpg',
    '/samples/cinematic-cover.jpg',
    '/samples/ending-02-stairs.jpg',
  ] : [], [isSample]);

  const galleryImages = userGallery && userGallery.length > 0 ? userGallery : defaultGalleryImages;
  const currentMainImage = galleryImages[selectedGalleryIndex] || galleryImages[0] || '';
  const displayedThumbnails = isGalleryExpanded ? galleryImages : galleryImages.slice(0, 4);

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

  // 안내 사항 카드 리스트 (Figma 섹션 8 Notice 매칭 - 미등록 시 실제 고객 청첩장에서는 미노출)
  const rawInfoNotices = invitation?.info_notices;
  const mealInfo = extra.meal_info;
  const shuttleInfo = extra.shuttle_info;
  const infoCards = useMemo(() => {
    if (Array.isArray(rawInfoNotices) && rawInfoNotices.length > 0) return rawInfoNotices;
    try {
      const parsed = typeof rawInfoNotices === 'string' ? JSON.parse(rawInfoNotices) : rawInfoNotices;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}

    const legacy = [];
    if (mealInfo) legacy.push({ title: '식사 안내', time: '', content: mealInfo });
    if (shuttleInfo) legacy.push({ title: '셔틀버스 안내', time: '', content: shuttleInfo });
    if (legacy.length > 0) return legacy;

    if (isSample) {
      return [
        {
          title: '식사 안내',
          time: 'PM 12:00 ~ 16:00',
          content: '식사는 12시부터 가능합니다.\n맛있게 식사해주세요!',
        },
        {
          title: '주차장 안내',
          time: '',
          content: '주차는 14시부터 가능합니다.\n편하게 오셔서 주차하세요!',
        },
        {
          title: '사진부스 안내',
          time: 'PM 12:00 ~ 16:00',
          content: '사진 부스는 14시부터 운영됩니다.\n편하게 오셔서 촬영해주세요!',
        },
      ];
    }
    return [];
  }, [rawInfoNotices, mealInfo, shuttleInfo, isSample]);

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
        { group: '신랑측', relation: '신랑', title: '신랑', holder: '예금주', name: '예금주', bank: '하나은행', number: '504-910579-89707' },
        { group: '신랑측', relation: '신랑', title: '신랑', holder: '예금주', name: '예금주', bank: '하나은행', number: '504-910579-89707' },
        { group: '신랑측', relation: '신랑', title: '신랑', holder: '예금주', name: '예금주', bank: '하나은행', number: '504-910579-89707' },
        { group: '신부측', relation: '신부', title: '신부', holder: '예금주', name: '예금주', bank: '하나은행', number: '504-910579-89707' },
        { group: '신부측', relation: '신부', title: '신부', holder: '예금주', name: '예금주', bank: '하나은행', number: '504-910579-89707' },
        { group: '신부측', relation: '신부', title: '신부', holder: '예금주', name: '예금주', bank: '하나은행', number: '504-910579-89707' },
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
      {/* ========================================================
          05. WEDDING GALLERY (Figma 섹션5: 780px * 1622px 1:1 정밀 매칭)
          ======================================================== */}
      {showGallerySection && galleryImages.length > 0 && (
        <section className={`pt-16 sm:pt-20 pb-0 text-center select-none transition-colors duration-300 ${
          isNightMode ? 'bg-[#1C1C1C]' : 'bg-[#FEFEFE]'
        }`}>
          <ScrollReveal>
            <div className="flex flex-col items-center px-4 sm:px-6">
              {/* 상단 1: gallery (Figma: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[72%]) */}
              <h2
                className={`text-[25px] font-medium leading-none tracking-normal transition-colors duration-300 ${
                  isNightMode ? 'text-stone-100' : 'text-[#292929]'
                }`}
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
              >
                gallery
              </h2>

              {/* 상단 2: 사진 갤러리 (Figma: NanumSquare Neo OTF 400, 36px -> 1x 18px, #292929, mt-[24px]) */}
              <h3
                className={`mt-[24px] font-nanumsquare text-[18px] font-normal leading-none tracking-tight transition-colors duration-300 ${
                  isNightMode ? 'text-stone-200' : 'text-[#292929]'
                }`}
              >
                사진 갤러리
              </h3>

              {/* 중앙: 선택된 갤러리 (큰 이미지) (Figma: 너비 666px * 높이 830px -> 1x 333px * 415px, aspect-[666/830], mt-[53px]) */}
              {currentMainImage && (
                <div 
                  onClick={() => {
                    setGalleryModalIndex(selectedGalleryIndex);
                    setGalleryModalOpen(true);
                  }}
                  className="mt-[48px] sm:mt-[53px] w-[333px] max-w-[calc(100vw-48px)] aspect-[666/830] mx-auto overflow-hidden bg-stone-100 dark:bg-stone-900 select-none shadow-xs cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <img
                    src={currentMainImage}
                    alt={`선택된 갤러리 사진 ${selectedGalleryIndex + 1}`}
                    className="w-full h-full object-cover object-center transition-all duration-300"
                  />
                </div>
              )}

              {/* 하단 1: 작은 이미지 (썸네일 그리드: 4개 + 밑에 4개 = 총 8개 나열) */}
              {galleryImages.length > 0 && (
                <div className="mt-[17px] w-[333px] max-w-[calc(100vw-48px)] mx-auto">
                  <div className="grid grid-cols-4 gap-[13.8px]">
                    {galleryImages.slice(0, 8).map((src, idx) => {
                      const isSelected = idx === selectedGalleryIndex;
                      return (
                        <button
                          key={`thumb-${idx}`}
                          type="button"
                          onClick={() => setSelectedGalleryIndex(idx)}
                          className={`relative aspect-square overflow-hidden rounded-none cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? (isNightMode 
                                  ? 'ring-2 ring-stone-100 opacity-100' 
                                  : 'ring-2 ring-stone-900 opacity-100')
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={src}
                            alt={`갤러리 썸네일 ${idx + 1}`}
                            className="w-full h-full object-cover object-center"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 하단 2: 더보기 버튼 영역 (클릭 시 전체화면 갤러리 모달 오픈) */}
              <button
                type="button"
                onClick={() => {
                  setGalleryModalIndex(selectedGalleryIndex);
                  setGalleryModalOpen(true);
                }}
                style={{
                  boxShadow: isNightMode ? 'none' : '0px 2px 2.5px rgba(0, 0, 0, 0.07)',
                }}
                className={`mt-[25px] w-[163.5px] h-[38px] rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] select-none mx-auto ${
                  isNightMode
                    ? 'bg-[#2A2A2A] hover:bg-[#333333] border border-stone-700 text-stone-300'
                    : 'bg-[#F4F3F1] hover:bg-[#eceae7] border border-[#D3D3D3] text-[#666666]'
                }`}
              >
                <span className="font-nanumsquare text-[14px] font-normal tracking-tight">
                  더보기
                </span>
              </button>

              {/* 섹션 하단 구분선 (사용자 필수 지침: 항상 섹션이 끝날 때마다 구분선 적용 / Figma: mt-[55px] mb-[40px]) */}
              <div 
                style={{ borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[55px] mb-[40px] shrink-0 mx-auto" 
              />
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          06. LOCATION (식장 위치 및 오시는 길 안내 - Figma 섹션 6 매칭)
          - 피그마 7135px~9022px (780x1887 -> 1x 390x943.5 1:1 정밀 매칭)
          ======================================================== */}
      {(venueFullName || venueAddress || isSample) && (
        <section 
          id="location-section" 
          className={`w-full pt-[69.5px] pb-0 px-6 text-center select-none overflow-hidden transition-colors duration-300 ${
            isNightMode ? 'bg-[#1E1E1E]' : 'bg-[#FEFEFE]'
          }`}
        >
          <ScrollReveal>
            {/* 상단 1: location 영문 (Figma: Cormorant Garamond 500 50px -> 1x 25px, #292929, leading-[72%]) */}
            <h2 
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className={`text-[25px] font-medium leading-[72%] text-center select-none tracking-normal ${
                isNightMode ? 'text-white' : 'text-[#292929]'
              }`}
            >
              location
            </h2>

            {/* 상단 2: 식장 위치 (Figma: NanumSquare Neo OTF 400 36px -> 1x 18px, leading-[72%], mt-[36.5px]) */}
            <p className={`font-nanumsquare font-normal text-[18px] leading-[72%] text-center mt-[36.5px] tracking-tight ${
              isNightMode ? 'text-[#E5E5E5]' : 'text-[#292929]'
            }`}>
              식장 위치
            </p>

            {/* 상단 3: 호텔금오산 컨벤션센터 (웨딩홀 명칭) (Figma: NanumSquare Neo OTF 400 30px -> 1x 15px, #333333, mt-[43px]) */}
            <h3 className={`font-nanumsquare font-normal text-[15px] leading-[72%] text-center mt-[43px] tracking-tight ${
              isNightMode ? 'text-white' : 'text-[#333333]'
            }`}>
              {venueFullName || (isSample ? '호텔금오산 컨벤션센터' : '')}
            </h3>

            {/* 상단 4: 경북 구미시 금오산로 400 (식장 주소) & 주소 복사 (Figma: NanumSquare Neo 28px -> 1x 14px, #999999, mt-[23.5px]) */}
            <div className="mt-[23.5px] flex items-center justify-center gap-1.5">
              <span className={`font-nanumsquare font-normal text-[14px] leading-[72%] tracking-tight ${
                isNightMode ? 'text-[#A3A3A3]' : 'text-[#999999]'
              }`}>
                {venueAddress || (isSample ? '경북 구미시 금오산로 400' : '')}
              </span>
              <button
                type="button"
                onClick={() => {
                  const addr = venueAddress || (isSample ? '경북 구미시 금오산로 400' : '');
                  handleCopy(addr, '식장 주소가');
                }}
                className={`inline-flex items-center justify-center p-0.5 transition-colors cursor-pointer select-none ${
                  isNightMode ? 'text-stone-400 hover:text-white' : 'text-[#999999] hover:text-[#333333]'
                }`}
                title="주소 복사"
                aria-label="식장 주소 복사"
              >
                {/* 복사 아이콘 (Figma: 31x31 -> 1x 15.5x15.5) */}
                <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>

            {/* 지도 컴포넌트 (Figma image 678: 607x433 -> 1x 303.5x216.5, mt-[40.5px]) */}
            <div className={`mt-[40.5px] w-[303.5px] h-[216.5px] max-w-full mx-auto overflow-hidden border ${
              isNightMode ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'
            }`}>
              <KakaoMap
                address={venueAddress || (isSample ? '경북 구미시 금오산로 400' : '')}
                venueName={venueFullName || (isSample ? '호텔금오산 컨벤션센터' : '')}
                className="w-full h-full"
              />
            </div>

            {/* 길안내 버튼 2개: 네이버 지도 & 카카오내비 (Figma: 너비 각 143.5px, 높이 38px, bg #F5F4F4, rounded-full, mt-[26px]) */}
            <div className="mt-[26px] w-[303.5px] max-w-full mx-auto flex items-center justify-between gap-[16.5px]">
              {/* 네이버 지도 버튼 */}
              <button
                type="button"
                onClick={() => {
                  const query = venueFullName || venueAddress || (isSample ? '호텔금오산 컨벤션센터' : '');
                  window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank');
                }}
                style={{
                  boxShadow: isNightMode ? 'none' : '0px 2px 2px rgba(0, 0, 0, 0.11)',
                }}
                className={`w-[143.5px] h-[38px] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] select-none ${
                  isNightMode
                    ? 'bg-[#2A2A2A] hover:bg-[#333333] text-stone-200 border border-stone-700'
                    : 'bg-[#F5F4F4] hover:bg-[#eceae7] text-[#666666]'
                }`}
              >
                <span className="font-nanumsquare font-normal text-[14px] tracking-tight">
                  네이버 지도
                </span>
                {/* 네이버 지도 아이콘 */}
                <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <rect width="24" height="24" rx="5" fill="#03C75A"/>
                  <path d="M7 6H10.2L13.8 12.3V6H17V18H13.8L10.2 11.7V18H7V6Z" fill="white"/>
                </svg>
              </button>

              {/* 카카오내비 버튼 */}
              <button
                type="button"
                onClick={() => {
                  const query = venueFullName || venueAddress || (isSample ? '호텔금오산 컨벤션센터' : '');
                  window.open(`https://map.kakao.com/link/search/${encodeURIComponent(query)}`, '_blank');
                }}
                style={{
                  boxShadow: isNightMode ? 'none' : '0px 2px 2px rgba(0, 0, 0, 0.11)',
                }}
                className={`w-[143.5px] h-[38px] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] select-none ${
                  isNightMode
                    ? 'bg-[#2A2A2A] hover:bg-[#333333] text-stone-200 border border-stone-700'
                    : 'bg-[#F5F4F4] hover:bg-[#eceae7] text-[#666666]'
                }`}
              >
                <span className="font-nanumsquare font-normal text-[14px] tracking-tight">
                  카카오내비
                </span>
                {/* 카카오내비 아이콘 */}
                <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <rect width="24" height="24" rx="5" fill="#FFEB00"/>
                  <path d="M6 15.5L12 5L18 15.5L12 13L6 15.5Z" fill="#0075FF"/>
                </svg>
              </button>
            </div>

            {/* 오시는 길 안내 관련 박스 (Figma: 너비 553px -> 1x 276.5px, mt-[54.5px], text-left) */}
            {(transportationList.length > 0 || isSample) && (
              <div className="mt-[54.5px] w-[276.5px] max-w-full mx-auto text-left">
                {transportationList.length > 0 ? (
                  /* 고객 직접 입력 교통편이 있는 경우 */
                  <div className="space-y-[24px]">
                    {transportationList.map((item, idx) => (
                      <div key={idx}>
                        <h4 className={`font-nanumsquare font-bold text-[14px] mb-3 leading-none ${
                          isNightMode ? 'text-white' : 'text-[#333333]'
                        }`}>
                          {item.title}
                        </h4>
                        <p className={`font-nanumsquare font-normal text-[13px] leading-relaxed whitespace-pre-line ${
                          isNightMode ? 'text-stone-300' : 'text-[#666666]'
                        }`}>
                          {renderTransitText(item.content)}
                        </p>
                        {idx < transportationList.length - 1 && (
                          <div 
                            style={{ 
                              borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' 
                            }} 
                            className="w-full my-[24px]" 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : isSample ? (
                  /* 피그마 시안 4 기본 오시는 길 안내 */
                  <div>
                    {/* 지하철 블록 */}
                    <div>
                      <h4 className={`font-nanumsquare font-bold text-[14px] mb-3 leading-none ${
                        isNightMode ? 'text-white' : 'text-[#333333]'
                      }`}>
                        지하철
                      </h4>
                      <p className={`font-nanumsquare font-normal text-[13px] leading-relaxed ${
                        isNightMode ? 'text-stone-300' : 'text-[#666666]'
                      }`}>
                        <span style={{ color: '#407550' }} className="font-medium mr-1">7호선</span>강남구청역 3-1번 출구
                      </p>
                      <p className={`font-nanumsquare font-normal text-[13px] leading-relaxed ${
                        isNightMode ? 'text-stone-300' : 'text-[#666666]'
                      }`}>
                        <span style={{ color: '#C79126' }} className="font-medium mr-1">분당선</span>강남구청역 3-1번 출구
                      </p>
                      <p className={`font-nanumsquare font-normal text-[13px] leading-relaxed mt-2 ${
                        isNightMode ? 'text-stone-400' : 'text-[#666666]'
                      }`}>
                        좌측 방향 570M 도보 후 좌측 건물
                      </p>
                    </div>

                    {/* 지하철과 버스 사이에 구분선 (Figma: 553px -> 1x 276.5px, border: 0.5px solid #999999) */}
                    <div 
                      style={{ 
                        borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' 
                      }} 
                      className="w-full my-[24px]" 
                    />

                    {/* 버스 블록 */}
                    <div>
                      <h4 className={`font-nanumsquare font-bold text-[14px] mb-3 leading-none ${
                        isNightMode ? 'text-white' : 'text-[#333333]'
                      }`}>
                        버스
                      </h4>
                      <p className={`font-nanumsquare font-normal text-[13px] leading-relaxed ${
                        isNightMode ? 'text-stone-300' : 'text-[#666666]'
                      }`}>
                        <span style={{ color: '#5B86BF' }} className="font-medium mr-1">간선버스</span> : 342, 465, 786
                      </p>
                      <p className={`font-nanumsquare font-normal text-[13px] leading-relaxed ${
                        isNightMode ? 'text-stone-300' : 'text-[#666666]'
                      }`}>
                        <span style={{ color: '#71AB67' }} className="font-medium mr-1">지선버스</span> : 1234, 5678
                      </p>
                      <p className={`font-nanumsquare font-normal text-[13px] leading-relaxed mt-2 ${
                        isNightMode ? 'text-stone-400' : 'text-[#666666]'
                      }`}>
                        셔틀버스 수시 운행
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* 식장 위치 섹션 바닥 공통 구분선 (인수인계서 필수 탑재 규격: w-[280.5px], borderTop: 0.5px solid #999999) */}
            <div 
              style={{ 
                borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' 
              }}
              className="w-[280.5px] max-w-[75%] mt-[55px] mb-[40px] mx-auto shrink-0" 
            />
          </ScrollReveal>
        </section>
      )}



      {/* ========================================================
          07. ACCOUNT (마음 전하실 곳 - Figma 섹션 7 매칭)
          - 피그마 9022px~10338px (780x1316 -> 1x 390x658 1:1 정밀 매칭)
          ======================================================== */}
      {showAccountsSection && (allAccounts.length > 0 || isSample) && (
        <section 
          id="accounts-section" 
          className={`w-full pt-[69.5px] pb-0 px-6 text-center select-none overflow-hidden transition-colors duration-300 ${
            isNightMode ? 'bg-[#1E1E1E]' : 'bg-[#FEFEFE]'
          }`}
        >
          <ScrollReveal>
            {/* 상단 1: Account 영문 (Figma: Cormorant Garamond 500 50px -> 1x 25px, #292929, leading-[72%]) */}
            <h2 
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className={`text-[25px] font-medium leading-[72%] text-center select-none tracking-normal ${
                isNightMode ? 'text-white' : 'text-[#292929]'
              }`}
            >
              Account
            </h2>

            {/* 상단 2: 마음 전하실 곳 (Figma: NanumSquare Neo OTF 400 36px -> 1x 18px, leading-[72%], mt-[36.5px]) */}
            <p className={`font-nanumsquare font-normal text-[18px] leading-[72%] text-center mt-[36.5px] tracking-tight ${
              isNightMode ? 'text-[#E5E5E5]' : 'text-[#292929]'
            }`}>
              마음 전하실 곳
            </p>

            {/* 상단 3: 축복의 마음을 담아 축의금을 전달하실 수 있습니다. (Figma: NanumSquare Neo 28px -> 1x 14px, leading-[174%], mt-[43px]) */}
            <p className={`font-nanumsquare font-normal text-[14px] leading-[174%] text-center mt-[43px] tracking-tight ${
              isNightMode ? 'text-[#D4D4D4]' : 'text-[#333333]'
            }`}>
              축복의 마음을 담아 축의금을<br />
              전달하실 수 있습니다.
            </p>

            {/* 탭 영역 (Figma: 전체선 너비 553px -> 1x 276.5px, mt-[56px]) */}
            <div className="mt-[56px] w-[276.5px] max-w-full mx-auto">
              <div className="relative flex items-center justify-between pb-[13px]">
                {/* 신랑측 탭 버튼 */}
                <button
                  type="button"
                  onClick={() => setAccountTab('groom')}
                  className={`w-1/2 text-center font-nanumsquare text-[13px] leading-[72%] transition-colors cursor-pointer select-none ${
                    accountTab === 'groom'
                      ? (isNightMode ? 'text-white font-bold' : 'text-[#292929] font-bold')
                      : (isNightMode ? 'text-stone-500 font-normal' : 'text-[#999999] font-normal')
                  }`}
                >
                  신랑측
                </button>

                {/* 신부측 탭 버튼 */}
                <button
                  type="button"
                  onClick={() => setAccountTab('bride')}
                  className={`w-1/2 text-center font-nanumsquare text-[13px] leading-[72%] transition-colors cursor-pointer select-none ${
                    accountTab === 'bride'
                      ? (isNightMode ? 'text-white font-bold' : 'text-[#292929] font-bold')
                      : (isNightMode ? 'text-stone-500 font-normal' : 'text-[#999999] font-normal')
                  }`}
                >
                  신부측
                </button>

                {/* 전체 바닥선 (Figma: 553px -> 1x 276.5px, height: 2px -> 1px, background: #CBCBCB) */}
                <div 
                  className={`absolute bottom-0 left-0 w-full h-[1px] ${
                    isNightMode ? 'bg-stone-700' : 'bg-[#CBCBCB]'
                  }`} 
                />

                {/* 선택된 쪽에 음영주기 위한 선 (Figma: 너비 281px -> 1x 138.25px / 50%, height: 2px, background: #333333) */}
                <div 
                  className={`absolute bottom-0 h-[2px] w-1/2 transition-all duration-300 ${
                    accountTab === 'groom' ? 'left-0' : 'left-1/2'
                  } ${
                    isNightMode ? 'bg-white' : 'bg-[#333333]'
                  }`}
                />
              </div>

              {/* 계좌 목록 영역 (Group 1232: Figma top: 9797px, mt-[37px]) */}
              <div className="mt-[37px] text-left">
                {currentAccounts.length > 0 ? (
                  <div>
                    {currentAccounts.map((acc, idx) => {
                      const relText = acc.relation || acc.title || (accountTab === 'groom' ? '신랑' : '신부');
                      const holderText = acc.holder || acc.name || '예금주';
                      const bankText = acc.bank || '';
                      const numText = acc.number || acc.account_number || '';
                      const copyTarget = [bankText, numText, holderText].filter(Boolean).join(' ');

                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between">
                            {/* 좌측: 신랑 예금주 / 하나은행 504-910579-89707 */}
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className={`font-nanumsquare text-[12px] font-normal leading-none ${
                                  isNightMode ? 'text-stone-400' : 'text-[#666666]'
                                }`}>
                                  {relText}
                                </span>
                                <span className={`font-nanumsquare text-[12px] font-bold leading-none ${
                                  isNightMode ? 'text-white' : 'text-[#292929]'
                                }`}>
                                  {holderText}
                                </span>
                              </div>
                              <p className={`font-nanumsquare font-normal text-[11.5px] leading-none mt-[8px] tracking-tight ${
                                isNightMode ? 'text-stone-300' : 'text-[#666666]'
                              }`}>
                                {bankText} {numText}
                              </p>
                            </div>

                            {/* 우측: 복사하기 버튼 (Figma: 161x52 -> 1x 80.5x26, rounded-full) */}
                            <button
                              type="button"
                              onClick={() => handleCopy(numText || copyTarget, `${bankText} 계좌번호가`)}
                              className={`w-[80.5px] h-[26px] rounded-full border flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] select-none ${
                                isNightMode
                                  ? 'border-stone-600 bg-[#2A2A2A] hover:bg-[#333333] text-stone-200'
                                  : 'border-[#D3D3D3] bg-white hover:bg-[#F5F4F4] text-[#292929]'
                              }`}
                            >
                              <span className="font-nanumsquare font-normal text-[12px] leading-none tracking-tight">
                                복사하기
                              </span>
                            </button>
                          </div>

                          {/* 예금주 간 구분선 (Line 152: border 0.5px solid #999999) */}
                          {idx < currentAccounts.length - 1 && (
                            <div 
                              style={{ 
                                borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #E5E5E5' 
                              }} 
                              className="w-full my-[18px]" 
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`py-8 text-center font-nanumsquare text-[12px] ${
                    isNightMode ? 'text-stone-500' : 'text-stone-400'
                  }`}>
                    등록된 계좌 정보가 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 계좌 섹션 바닥 공통 구분선 (인수인계서 필수 탑재 규격: w-[280.5px], borderTop: 0.5px solid #999999) */}
            <div 
              style={{ 
                borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' 
              }}
              className="w-[280.5px] max-w-[75%] mt-[55px] mb-[40px] mx-auto shrink-0" 
            />
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          08. NOTICE (안내 사항 - Figma 섹션 매칭)
          - 피그마 10339px~11586px (780x1247 -> 1x 390x623.5 1:1 정밀 매칭)
          ======================================================== */}
      {infoCards.length > 0 && (
        <section 
          id="notice-section" 
          className={`w-full pt-[69.5px] pb-0 text-center select-none overflow-hidden transition-colors duration-300 ${
            isNightMode ? 'bg-[#1E1E1E]' : 'bg-[#FEFEFE]'
          }`}
        >
          <ScrollReveal>
            {/* 상단 1: Notice 영문 (Figma: Cormorant Garamond 500 50px -> 1x 25px, #292929, leading-[72%]) */}
            <h2 
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className={`text-[25px] font-medium leading-[72%] text-center select-none tracking-normal ${
                isNightMode ? 'text-white' : 'text-[#292929]'
              }`}
            >
              Notice
            </h2>

            {/* 상단 2: 안내 사항 (Figma: NanumSquare Neo OTF 400 36px -> 1x 18px, leading-[72%], mt-[36.5px]) */}
            <p className={`font-nanumsquare font-normal text-[18px] leading-[72%] text-center mt-[36.5px] tracking-tight ${
              isNightMode ? 'text-[#E5E5E5]' : 'text-[#292929]'
            }`}>
              안내 사항
            </p>

            {/* 안내 사항 여러개 박스 캐러셀 (Figma: 너비 1169px -> 1x 584.5px, 1개 박스 373x473 -> 1x 186.5x236.5, top: 10807px, mt-[52px]) */}
            <div className="relative mt-[52px] w-full">
              <div
                ref={infoContainerRef}
                onScroll={(e) => {
                  const scrollLeft = e.target.scrollLeft;
                  const cardWidthWithGap = 186.5 + 13; // 199.5px
                  const idx = Math.round(scrollLeft / cardWidthWithGap);
                  if (idx >= 0 && idx < infoCards.length && idx !== activeInfoIdx) {
                    setActiveInfoIdx(idx);
                  }
                }}
                className="flex gap-[13px] overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-[calc(50%-93.25px)] py-2"
              >
                {infoCards.map((card, idx) => {
                  const numStr = String(idx + 1).padStart(2, '0');
                  const timeText = card.time || card.sub_title || card.subtitle || '';

                  return (
                    <div
                      key={idx}
                      className={`snap-center shrink-0 w-[186.5px] h-[236.5px] border box-border flex flex-col justify-start items-center text-center pt-[28px] pb-[20px] px-3.5 transition-colors duration-300 ${
                        isNightMode
                          ? 'bg-[#252525] border-[#3D3D3D]'
                          : 'bg-[#F3F3F3] border-[#DCDCDC]'
                      }`}
                    >
                      {/* 번호 (Figma: 01, 02 등 - NanumSquare Neo 26px -> 1x 13px, leading-[72%], #292929) */}
                      <p className={`font-nanumsquare font-normal text-[13px] leading-[72%] ${
                        isNightMode ? 'text-[#D4D4D4]' : 'text-[#292929]'
                      }`}>
                        {numStr}
                      </p>

                      {/* 제목 (Figma: 주차장 안내 등 - NanumSquare Neo 26px -> 1x 13px, leading-[72%], mt-[16px], #292929) */}
                      <h3 className={`font-nanumsquare font-normal text-[13px] leading-[72%] mt-[16px] tracking-tight ${
                        isNightMode ? 'text-white' : 'text-[#292929]'
                      }`}>
                        {card.title}
                      </h3>

                      {/* 제목과 본문 사이 구분선 (Figma: 255px -> 1x 127.5px, border: 0.5px solid #999999, mt-[12px] mb-[14px]) */}
                      <div 
                        style={{ 
                          borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.2)' : '0.5px solid #999999' 
                        }}
                        className="w-[127.5px] max-w-full my-[13px] shrink-0" 
                      />

                      {/* 시간 알약 태그 (옵션: PM 12:00 ~ 16:00 등) */}
                      {timeText ? (
                        <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full border mb-[10px] shrink-0 ${
                          isNightMode ? 'border-stone-600 bg-stone-800/60 text-stone-300' : 'border-[#C4C4C4] bg-white/70 text-[#666666]'
                        }`}>
                          <span className="font-nanumsquare font-normal text-[9.5px] leading-none tracking-tight">
                            {timeText}
                          </span>
                        </div>
                      ) : null}

                      {/* 본문 (Figma: NanumSquare Neo 20px -> 1x 10px, leading-[145%], #333333) */}
                      <p className={`font-nanumsquare font-normal text-[10px] leading-[145%] text-center whitespace-pre-line break-keep px-1 ${
                        isNightMode ? 'text-[#C7C7C7]' : 'text-[#333333]'
                      }`}>
                        {card.content}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 페이지 점선 인디케이터 도트 (Figma 1:1: 9x9 -> 1x 4.5x4.5, 선택: #585858, 미선택: #D9D9D9, 간격: gap-[6px], top: 11363px, mt-[36px]) */}
              {infoCards.length > 1 && (
                <div className="flex items-center justify-center gap-[6px] mt-[36px]">
                  {infoCards.map((_, idx) => {
                    const isSelected = idx === activeInfoIdx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`안내사항 ${idx + 1}번으로 이동`}
                        onClick={() => {
                          if (infoContainerRef.current) {
                            const cardWidthWithGap = 186.5 + 13;
                            infoContainerRef.current.scrollTo({
                              left: idx * cardWidthWithGap,
                              behavior: 'smooth',
                            });
                            setActiveInfoIdx(idx);
                          }
                        }}
                        className="p-1 cursor-pointer flex items-center justify-center transition-all select-none"
                      >
                        <span
                          className={`w-[4.5px] h-[4.5px] rounded-full block transition-colors duration-200 ${
                            isSelected
                              ? (isNightMode ? 'bg-white' : 'bg-[#585858]')
                              : (isNightMode ? 'bg-[#555555]' : 'bg-[#D9D9D9]')
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 안내사항 섹션 바닥 공통 구분선 (인수인계서 필수 탑재 규격: w-[280.5px], borderTop: 0.5px solid #999999) */}
            <div 
              style={{ 
                borderTop: isNightMode ? '0.5px solid rgba(255, 255, 255, 0.15)' : '0.5px solid #999999' 
              }}
              className="w-[280.5px] max-w-[75%] mt-[55px] mb-[40px] mx-auto shrink-0" 
            />
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
          images={galleryImages}
          initialIndex={galleryModalIndex}
          onClose={() => setGalleryModalOpen(false)}
        />
      )}
    </div>
  );
}
