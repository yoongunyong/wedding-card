'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
import TodayConciergeCard from '@/components/TodayConciergeCard';
import GuestPhotoSnapSection from '@/components/GuestPhotoSnapSection';
import EditorialContactModal from '../editorial/EditorialContactModal';
import EditorialRsvpModal from '../editorial/EditorialRsvpModal';
import EditorialGuestbookModal from '../editorial/EditorialGuestbookModal';
import EditorialGuestbookDeleteModal from '../editorial/EditorialGuestbookDeleteModal';
import EditorialGalleryModal from '../editorial/EditorialGalleryModal';
import SceneIntro from './SceneIntro';
import KakaoMap from '@/components/KakaoMap';
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
  '7호선': '#407550',
  '8호선': '#E6186C',
  '9호선': '#BDB092',
  '분당선': '#C79126',
  '수인분당선': '#C79126',
  '신분당선': '#D4003B',
  '경의중앙선': '#77C4A3',
  '공항철도': '#0090D2',
  '경춘선': '#0C8E72',
  '우이신설선': '#B0CE1A',
  '신림선': '#6789CA',
  '서해선': '#81A914',
  '간선버스': '#5B86BF',
  '지선버스': '#71AB67',
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

export default function SceneTemplate({ invitation }) {
  // 1. 모달 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 2. 방명록 상태 (시안 3 플레이리스트 4컷/3컷 카드 + 페이지네이션)
  const [guestbookList, setGuestbookList] = useState([]);
  const [guestbookPageIndex, setGuestbookPageIndex] = useState(0);
  const guestbookTouchStartX = useRef(null);

  // 3. 갤러리 상태
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // 4. 계좌 탭 상태
  const [userAccountTab, setUserAccountTab] = useState(null);

  // 5. 안내사항 상태
  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);
  const noticeContainerRef = useRef(null);

  // 6. 데이터 언패킹 & fallback
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'scene');
  const config = useMemo(() => invitation?.template_config || {}, [invitation?.template_config]);
  const images = useMemo(() => invitation?.images || {}, [invitation?.images]);
  const extra = useMemo(() => invitation?.extra_data || {}, [invitation?.extra_data]);

  const showIntroSection = isSample ? true : config.show_intro !== false;
  const showGallerySection = config.show_gallery !== false;
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;
  const showGuestbookSection = config.show_guestbook !== false;

  // 커버 인트로 화면 상태 (기본값 true)
  const [showIntro, setShowIntro] = useState(true);
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

  // SCROLL TO OPEN 버튼 클릭 시 본문 2섹션(에디토리얼 스토리)으로 부드럽게 스크롤
  const handleScrollToOpen = () => {
    if (typeof document !== 'undefined') {
      const nextSec = document.getElementById('editorial-story-section');
      if (nextSec) {
        nextSec.scrollIntoView({ behavior: 'smooth' });
      } else {
        const previewContainer = document.getElementById('preview-scroll-container');
        if (previewContainer) {
          previewContainer.scrollTo({ top: 706.5, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 706.5, behavior: 'smooth' });
        }
      }
    }
  };

  // 페이지 진입 시 스크롤을 무조건 최상단(오프닝 인트로)으로 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    }
  }, []);

  // 대표 이미지 매핑
  const mainImage = images.main || images.cover || invitation?.main_image || (isSample ? '/samples/main-03-playlist.jpg' : '');
  const bridePhoto = images.bride_profile || images.bride || extra.bride_profile_image || invitation?.bride_photo || (isSample ? '/samples/bride-profile-03.jpg' : '');
  const groomPhoto = images.groom_profile || images.groom || extra.groom_profile_image || invitation?.groom_photo || (isSample ? '/samples/groom-profile-01.jpg' : '');
  const couplePhoto = images.couple_profile || images.couple || extra.couple_profile_image || (isSample ? '/samples/main-beach.jpg' : (mainImage || ''));
  const endingImage = images.ending || extra.ending_image || invitation?.ending_image || couplePhoto || mainImage;
  const datePhoto = images.calendar || images.calendar_photo || images.ending || (isSample ? '/samples/ending-04-classic.jpg' : '');
  const mainPhotoSrc = mainImage;

  // 갤러리 이미지 안전 파싱 (문자열, JSON, Postgres 배열 형태 방어)
  const galleryImages = useMemo(() => {
    const raw = invitation?.gallery_images;
    if (!raw) return isSample ? ['/samples/main-03-playlist.jpg', '/samples/main-beach.jpg', '/samples/photo-04-garden-wine.jpg', '/samples/photo-09-kiss-bouquet.jpg'] : [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        if (raw.startsWith('{') && raw.endsWith('}')) {
          const items = raw.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
          if (items.length > 0) return items;
        }
      }
    }
    return isSample ? ['/samples/main-03-playlist.jpg', '/samples/main-beach.jpg', '/samples/photo-04-garden-wine.jpg', '/samples/photo-09-kiss-bouquet.jpg'] : [];
  }, [invitation?.gallery_images, isSample]);

  // 성함 데이터
  const groomName = invitation?.groom_name || (isSample ? '장민기' : '');
  const brideName = invitation?.bride_name || (isSample ? '권기득' : '');
  const coupleKo = [groomName, brideName].filter(Boolean).join(' · ');

  // 날짜 계산
  const weddingDateStr = invitation?.wedding_date 
    ? (typeof invitation.wedding_date === 'string' ? invitation.wedding_date.replace(' ', 'T') : String(invitation.wedding_date))
    : (isSample ? '2027-05-15T14:00:00' : '');
  const hasWeddingDate = Boolean(weddingDateStr);
  const targetDate = useMemo(() => {
    if (!weddingDateStr) return null;
    const d = new Date(weddingDateStr);
    return isNaN(d.getTime()) ? null : d;
  }, [weddingDateStr]);

  const isValidDate = Boolean(targetDate);
  const year = isValidDate ? targetDate.getFullYear() : (isSample ? 2027 : '');
  const date = isValidDate ? targetDate.getDate() : (isSample ? 15 : '');

  // 캘린더 데이터 생성
  const calendarData = useMemo(() => {
    if (!targetDate) return null;
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const weddingDay = targetDate.getDate();
    const firstDayIndex = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    return { year: y, month: m + 1, weddingDay, firstDayIndex, totalDays };
  }, [targetDate]);

  // 포맷팅 날짜
  const formattedDates = useMemo(() => {
    if (!targetDate) return { monthName: isSample ? 'MAY' : '', calendarHeaderDate: '', dowKo: '', timeStrKo: '', yearNumber: '' };
    const daysKo = ['일', '월', '화', '수', '목', '금', '토'];
    const monthsEn = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth() + 1;
    const d = targetDate.getDate();
    const dowKo = daysKo[targetDate.getDay()];
    const monthEn = monthsEn[targetDate.getMonth()];
    
    const hours = targetDate.getHours();
    const periodKo = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const mins = targetDate.getMinutes();
    const minStr = mins > 0 ? ` ${mins}분` : '';

    return {
      monthName: monthEn,
      dayNumber: String(d).padStart(2, '0'),
      yearNumber: String(y),
      timeStrKo: `${periodKo} ${displayHour}시${minStr}`,
      calendarHeaderDate: `${y}년 ${m}월 ${d}일 ${dowKo}요일 | ${periodKo} ${displayHour}시${minStr}`,
      dowKo,
    };
  }, [targetDate, isSample]);

  // 영문 풀네임 동적 계산
  const fullNamesEn = useMemo(() => {
    if (invitation?.main_names_en) return invitation.main_names_en;
    if (extra?.main_names_en) return extra.main_names_en;
    if (invitation?.groom_name_en && invitation?.bride_name_en) {
      return `${invitation.groom_name_en} & ${invitation.bride_name_en}`;
    }
    const groomFull = [invitation?.groom_last_name_en, invitation?.groom_first_name_en].filter(Boolean).join(' ') || invitation?.groom_name_en;
    const brideFull = [invitation?.bride_last_name_en, invitation?.bride_first_name_en].filter(Boolean).join(' ') || invitation?.bride_name_en;
    if (groomFull && brideFull) return `${groomFull} & ${brideFull}`;
    if (groomFull || brideFull) return groomFull || brideFull;
    if (isSample && !groomName && !brideName) return 'Minwoo Kang & Yujin Seo';
    return '';
  }, [invitation, extra, isSample, groomName, brideName]);

  // 부모님 성함 & 故 / 국화꽃 표기
  const deceasedMarker = config.deceased_marker || invitation?.deceased_marker || 'hanja';
  const isGroomFatherDeceased = invitation?.groom_father_deceased ?? config.groom_father_deceased ?? false;
  const isGroomMotherDeceased = invitation?.groom_mother_deceased ?? config.groom_mother_deceased ?? false;
  const isBrideFatherDeceased = invitation?.bride_father_deceased ?? config.bride_father_deceased ?? false;
  const isBrideMotherDeceased = invitation?.bride_mother_deceased ?? config.bride_mother_deceased ?? false;

  const groomRelation = invitation?.groom_relation || config.groom_relation || '';
  const brideRelation = invitation?.bride_relation || config.bride_relation || '';

  const isOfficialDemo = invitation?.slug === 'scene';
  const hasUserEnteredAny = Boolean(groomName || brideName || invitation?.groom_father || invitation?.groom_mother || invitation?.bride_father || invitation?.bride_mother);
  const allowSampleParents = isOfficialDemo || (!hasUserEnteredAny && isSample);

  const groomParentsNode = renderParentPair({
    father: invitation?.groom_father || (allowSampleParents && !invitation?.groom_mother ? '강대현' : ''),
    isFatherDeceased: isGroomFatherDeceased,
    mother: invitation?.groom_mother || (allowSampleParents && !invitation?.groom_father ? '문영희' : ''),
    isMotherDeceased: isGroomMotherDeceased,
    markerType: deceasedMarker,
    separator: ' · ',
    iconClassName: 'w-[13px] h-[15px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0',
  });

  const brideParentsNode = renderParentPair({
    father: invitation?.bride_father || (allowSampleParents && !invitation?.bride_mother ? '서병철' : ''),
    isFatherDeceased: isBrideFatherDeceased,
    mother: invitation?.bride_mother || (allowSampleParents && !invitation?.bride_father ? '한정숙' : ''),
    isMotherDeceased: isBrideMotherDeceased,
    markerType: deceasedMarker,
    separator: ' · ',
    iconClassName: 'w-[13px] h-[15px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0',
  });

  const displayGroomParents = groomParentsNode || (allowSampleParents ? '강대현 · 문영희' : null);
  const displayGroomRelation = groomRelation || (allowSampleParents ? '장남' : (groomParentsNode ? '장남' : ''));
  const displayGroomName = groomName || (allowSampleParents ? '장민기' : '');
  const hasGroomFamily = Boolean(displayGroomParents && displayGroomName);

  const displayBrideParents = brideParentsNode || (allowSampleParents ? '서병철 · 한정숙' : null);
  const displayBrideRelation = brideRelation || (allowSampleParents ? '차녀' : (brideParentsNode ? '장녀' : ''));
  const displayBrideName = brideName || (allowSampleParents ? '권기득' : '');
  const hasBrideFamily = Boolean(displayBrideParents && displayBrideName);

  const groomShort = invitation?.groom_name && invitation.groom_name.length === 3 ? invitation.groom_name.slice(1) : (invitation?.groom_name || '');
  const brideShort = invitation?.bride_name && invitation.bride_name.length === 3 ? invitation.bride_name.slice(1) : (invitation?.bride_name || '');

  const venueFullName = [invitation?.venue_name, invitation?.venue_hall || config?.venue_hall].filter(Boolean).join(' ');

  // 예식장 장소 (피그마 1:1, 예: 서울 크리스탈 볼룸 1층)
  const venueText = useMemo(() => {
    if (isSample) return '서울 크리스탈 볼룸 1층';
    const hall = config.venue_hall || invitation?.venue_hall;
    const parts = [invitation?.venue_name, hall].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return '서울 크리스탈 볼룸 1층';
  }, [invitation?.venue_name, config.venue_hall, invitation?.venue_hall, isSample]);

  // 날짜 포맷 (피그마 1:1, 예: 2027.May 15. 14:00 pm)
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

  // 방명록 로드
  useEffect(() => {
    if (!invitation?.id) return;
    async function loadGuestbook() {
      const { data, error } = await supabase
        .from('guestbook')
        .select('id, invitation_id, author, content, created_at')
        .eq('invitation_id', invitation.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        setGuestbookList(data);
      }
    }
    loadGuestbook();
  }, [invitation?.id]);

  // 계좌 데이터 (JSON 문자열 안전 파싱)
  const allParsedAccounts = useMemo(() => {
    const raw = invitation?.accounts;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }, [invitation?.accounts]);

  const groomAccounts = useMemo(() => {
    return allParsedAccounts.filter(
      (a) =>
        a.group === '신랑측' ||
        a.group === '신랑' ||
        a.side === 'groom' ||
        a.title === '신랑' ||
        a.relation === '신랑' ||
        a.title?.includes('신랑') ||
        a.relation?.includes('신랑')
    );
  }, [allParsedAccounts]);

  const brideAccounts = useMemo(() => {
    return allParsedAccounts.filter(
      (a) =>
        a.group === '신부측' ||
        a.group === '신부' ||
        a.side === 'bride' ||
        a.title === '신부' ||
        a.relation === '신부' ||
        a.title?.includes('신부') ||
        a.relation?.includes('신부')
    );
  }, [allParsedAccounts]);

  const activeAccountTab = userAccountTab || (groomAccounts.length === 0 && brideAccounts.length > 0 ? 'bride' : 'groom');
  const setActiveAccountTab = setUserAccountTab;

  // 정보 카드 목록 (JSON 문자열 및 레거시 extra_data 완벽 호환)
  const rawInfoNotices = invitation?.info_notices;
  const mealInfo = extra.meal_info;
  const shuttleInfo = extra.shuttle_info;
  const infoCards = useMemo(() => {
    let raw = rawInfoNotices;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch {}
    }
    if (Array.isArray(raw) && raw.length > 0) return raw;
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
          title: '화환 안내',
          time: 'PM 12:00~16:00',
          content: '예식장 공간이 좁아\n화환은 정중히 사양하오니\n너른 양해 부탁드립니다.',
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

  // 교통편 목록 (JSON 문자열 및 레거시 extra_data 완벽 호환)
  const transportationList = useMemo(() => {
    let raw = invitation?.transportation;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch {}
    }
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const legacy = [];
    if (extra.transport_subway) legacy.push({ type: 'subway', title: '지하철', content: extra.transport_subway });
    if (extra.transport_bus) legacy.push({ type: 'bus', title: '버스', content: extra.transport_bus });
    if (extra.transport_car) legacy.push({ type: 'car', title: '자가용', content: extra.transport_car });
    if (extra.transport_parking) legacy.push({ type: 'parking', title: '주차 안내', content: extra.transport_parking });
    return legacy;
  }, [invitation?.transportation, extra.transport_subway, extra.transport_bus, extra.transport_car, extra.transport_parking]);

  // 클립보드 복사 함수
  const handleCopyText = async (text, msg = '복사되었습니다.') => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(text);
      alert(msg);
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  return (
    <div className="w-full max-w-[440px] min-h-screen bg-[#FEFEFE] text-[#222E26] font-sans mx-auto shadow-2xl relative overflow-hidden select-none">
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

      {/* 0. 시안5 캠코더 뷰파인더 인트로 커버 화면 */}
      {showIntro && showIntroSection && (
        <SceneIntro
          invitation={invitation}
          isInModal={isModalPreview}
          onOpen={() => {
            setShowIntro(false);
          }}
        />
      )}

      {/* 본문 콘텐츠: 모달 미리보기 중 인트로 활성화 시에는 노출 및 높이 차지 방지 */}
      <div className={isModalPreview && showIntro && showIntroSection ? 'hidden' : 'contents'}>
        {(!showIntro || !showIntroSection) && (
          <TodayConciergeCard invitation={invitation} />
        )}

        {/* ========================================================
            01. HERO SECTION: 시안 5 모던 씬 레트로 캠코더 메인 화보
            - 피그마 2x 실측 규격: width 780px, height 1413px (1x: 390px * 706.5px)
            - 배경: #1C1C1C 및 메인 사진
            - 좌상단: CAMERA1 / PLAY ▶ ('VCR OSD Mono' 40px -> 1x 20px, top 84px -> 1x 42px)
            - 4개 외곽 코너 브래킷 (1x 76.5px, 2px solid #FEFEFE)
            - 중앙 타이틀: Our Wedding Day! ('VCR OSD Mono' 60px -> 1x 30px, top 319px -> 1x 159.5px)
            - 중앙 오토포커스 타겟 브래킷 (Group 1275 1:1 실측: 149.25px * 225.25px)
            - 일시 & 장소: 2027.May 15. 14:00 pm / 서울 크리스탈 볼룸 1층
            - 하단 캠코더 스펙: 4K 60FPS / HD
            - SCROLL TO OPEN 버튼 (Figma: width 232.4px -> 1x 116.2px, height 55.3px -> 1x 27.65px, top 1298px -> 1x 649px, border 0.7px)
            ======================================================== */}
        <section className="relative w-full max-w-[390px] h-[706.5px] mx-auto overflow-hidden bg-[#1C1C1C] text-white select-none">
          {/* 전체 배경 사진 */}
          {mainPhotoSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainPhotoSrc}
              alt="Wedding Main Couple"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          )}

          {/* 텍스트 가독성을 위한 얇은 시네마틱 비네팅 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55 pointer-events-none" />

          {/* 1. 뷰파인더 4개 코너 브래킷 */}
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
              bottom: '34.5px',
              width: '76.5px',
              height: '76.5px',
            }}
          />
          {/* Bottom-Right ┘ */}
          <div
            className="absolute border-b-[2px] border-r-[2px] border-[#FEFEFE] pointer-events-none"
            style={{
              right: '21.25px',
              bottom: '34.5px',
              width: '76.5px',
              height: '76.5px',
            }}
          />

          {/* 2. CAMERA1 & PLAY (Figma: top 84px -> 1x 42px, left: calc(50% - 165px/2 - 231.5px) -> 1x 38px) */}
          <div
            className="absolute font-vcr text-[#FEFEFE] pointer-events-none select-none"
            style={{
              left: 'calc(50% - 41.25px - 115.75px)',
              top: '42px',
              width: '82.5px',
              height: '48px',
              fontFamily: "'VCR OSD Mono', monospace",
              fontSize: '20px',
              lineHeight: '24px',
            }}
          >
            <div>CAMERA1</div>
            <div>PLAY</div>
          </div>

          {/* PLAY 옆 삼각 재생 아이콘 (Figma: left 179px -> 1x 89.5px, top 139px -> 1x 69.5px, width 41px, height 34px, rotate 90deg, #FEFEFE, r=3px) */}
          <svg
            className="absolute pointer-events-none select-none"
            style={{
              left: '89.5px',
              top: '69.5px',
              width: '17px',
              height: '20.5px',
            }}
            viewBox="0 0 17 20.5"
            fill="none"
          >
            <path
              d="M2.2 1.4C1.3 0.9 0.2 1.5 0.2 2.6V17.9C0.2 19 1.3 19.6 2.2 19.1L15.6 11.5C16.4 11 16.4 9.5 15.6 9L2.2 1.4Z"
              fill="#FEFEFE"
            />
          </svg>

          {/* 3. Our Wedding Day! (Figma: top 319px -> 1x 159.5px, 'VCR OSD Mono' 60px -> 1x 30px) */}
          <p
            className="absolute w-full text-center font-vcr text-[30px] leading-[19px] text-[#FEFEFE] tracking-tight pointer-events-none"
            style={{
              top: '159.5px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            Our Wedding Day!
          </p>

          {/* 4. 중앙 오토포커스 타겟 브래킷 (피그마 Group 1275 1:1 실측) */}
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

          {/* 5. 일시 (Figma: top 1084px -> 1x 542px, 'VCR OSD Mono' 34px -> 1x 17px) */}
          <p
            className="absolute w-full text-center font-vcr text-[17px] leading-[12px] tracking-[0.04em] text-[#FEFEFE] pointer-events-none"
            style={{
              top: '542px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            {formattedDate}
          </p>

          {/* 6. 장소 (Figma: top 1141px -> 1x 570.5px, 'NanumSquare Neo' 30px -> 1x 15px) */}
          <p
            className="absolute w-full text-center font-nanumsquare text-[15px] leading-[11px] text-[#FEFEFE] pointer-events-none"
            style={{
              top: '570.5px',
              fontFamily: "'NanumSquare Neo', 'NanumSquare Neo OTF', sans-serif",
            }}
          >
            {venueText}
          </p>

          {/* 7. 하단 캠코더 스펙 (4K 60FPS & HD) */}
          <span
            className="absolute font-vcr text-[15px] leading-[11px] text-[#FEFEFE] pointer-events-none"
            style={{
              left: '40.5px',
              top: '642.5px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            4K 60FPS
          </span>
          <span
            className="absolute font-vcr text-[15px] leading-[11px] text-[#FEFEFE] pointer-events-none"
            style={{
              left: '330px',
              top: '642.5px',
              fontFamily: "'VCR OSD Mono', monospace",
            }}
          >
            HD
          </span>

          {/* 8. SCROLL TO OPEN 버튼 (Figma: top 1298px -> 1x 649px, width 232.4px -> 1x 116.2px, height 55.3px -> 1x 27.65px, border 0.7px solid #FEFEFE) */}
          <button
            type="button"
            onClick={handleScrollToOpen}
            className="absolute flex items-center justify-center rounded-full border-[0.7px] border-[#FEFEFE] text-[#FEFEFE] cursor-pointer hover:bg-white/10 active:scale-95 transition-all select-none z-20 backdrop-blur-[2px]"
            style={{
              top: '649px',
              left: 'calc(50% - 58.1px + 1.1px)',
              width: '116.2px',
              height: '27.65px',
            }}
          >
            <span
              className="font-editorial-serif text-[8.5px] font-medium tracking-[0.12em] uppercase leading-none"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
              }}
            >
              SCROLL TO OPEN ↓
            </span>
          </button>

          {/* 섹션 1 하단 구분선 (Line 138: Figma 561px -> 1x 280.5px, top: 1413px -> 706.5px, border: 0.5px solid #999999) */}
          <div 
            className="absolute pointer-events-none z-20"
            style={{
              bottom: '0px',
              left: 'calc(50% - 140.25px + 0.25px)',
              width: '280.5px',
              borderTop: '0.5px solid #999999',
            }}
          />
        </section>

        {/* ========================================================
            02. 에디토리얼 프로필 스프레드: 신부 & 신랑 단독 프로필 카드 & 혼주 정보 (시안 4 타이포그래피 적용)
            ======================================================== */}
        <section id="editorial-story-section" className="pt-[99.5px] pb-0 px-6 bg-[#FEFEFE] relative flex flex-col items-center select-none overflow-hidden">
          <ScrollReveal>
            {/* 상단 2단 타이틀: Welcome to / Minwoo & Yujin (Figma 시안 4: Cormorant Garamond 400, 48px -> 1x 24px) */}
            <div className="w-full max-w-[340px] mx-auto text-center mb-[28px] select-none flex flex-col items-center justify-center min-h-[64px]">
              <h2
                className="font-normal text-[23px] sm:text-[25px] leading-[1.2] text-[#292929] select-none"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                }}
              >
                <div>Welcome to</div>
                <div className="mt-1 whitespace-nowrap">
                  {fullNamesEn || coupleKo || (isSample ? 'Minwoo & Yujin' : '')}
                </div>
              </h2>
            </div>

            {/* 신부 & 신랑 2단 액자 카드 그리드 */}
            <div className="w-[331.35px] max-w-full mx-auto grid grid-cols-2 gap-[13.65px]">
              {/* 좌측: 신부 카드 */}
              <div 
                style={{ boxShadow: '0px 2.7px 5.1px rgba(0, 0, 0, 0.18)' }}
                className="bg-[#FEFEFE] pt-[7.76px] px-[8.55px] pb-[21.4px] flex flex-col items-center"
              >
                <div className="w-full aspect-[283.5/315.9] overflow-hidden bg-stone-100 flex items-center justify-center">
                  {bridePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bridePhoto}
                      alt={brideName || 'Bride'}
                      className="w-full h-full object-cover object-center select-none"
                      onError={(e) => {
                        if (isSample && e.currentTarget.src !== '/samples/bride-profile-03.jpg') {
                          e.currentTarget.src = '/samples/bride-profile-03.jpg';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FAF9F5] border border-[#ECE8E1] flex flex-col items-center justify-center p-3 select-none">
                      <svg className="w-6 h-6 text-[#A8A199] mb-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11m0 0a4 4 0 10-4-4c0 2.21 4 4 4 4zm0 0a4 4 0 114-4c0 2.21-4 4-4 4z" />
                      </svg>
                      <span className="font-serif italic text-[15px] text-[#78716C] tracking-wide">Bride</span>
                      <span className="font-nanumsquare text-[8px] tracking-[0.25em] text-[#A8A29E] uppercase mt-0.5">Portrait</span>
                    </div>
                  )}
                </div>
                <div className="mt-[18.74px] w-full text-center flex items-center justify-center gap-2.5 select-none leading-none">
                  <span className="font-weddingday text-[16px] text-[#999999] select-none pt-0.5">
                    Bride.
                  </span>
                  <span className="font-nanumsquare text-[14px] text-[#292929] font-normal tracking-tight">
                    {brideName}
                  </span>
                </div>
              </div>

              {/* 우측: 신랑 카드 */}
              <div 
                style={{ boxShadow: '0px 2.7px 5.1px rgba(0, 0, 0, 0.18)' }}
                className="bg-[#FEFEFE] pt-[7.76px] px-[8.55px] pb-[21.4px] flex flex-col items-center"
              >
                <div className="w-full aspect-[283.5/315.9] overflow-hidden bg-stone-100 flex items-center justify-center">
                  {groomPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={groomPhoto}
                      alt={groomName || 'Groom'}
                      className="w-full h-full object-cover object-center select-none"
                      onError={(e) => {
                        if (isSample && e.currentTarget.src !== '/samples/groom-profile-01.jpg') {
                          e.currentTarget.src = '/samples/groom-profile-01.jpg';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FAF9F5] border border-[#ECE8E1] flex flex-col items-center justify-center p-3 select-none">
                      <svg className="w-6 h-6 text-[#A8A199] mb-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l7 4-7 4V8zm14 0l-7 4 7 4V8z" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                      </svg>
                      <span className="font-serif italic text-[15px] text-[#78716C] tracking-wide">Groom</span>
                      <span className="font-nanumsquare text-[8px] tracking-[0.25em] text-[#A8A29E] uppercase mt-0.5">Portrait</span>
                    </div>
                  )}
                </div>
                <div className="mt-[18.74px] w-full text-center flex items-center justify-center gap-2.5 select-none leading-none">
                  <span className="font-weddingday text-[16px] text-[#999999] select-none pt-0.5">
                    Groom.
                  </span>
                  <span className="font-nanumsquare text-[14px] text-[#292929] font-normal tracking-tight">
                    {groomName}
                  </span>
                </div>
              </div>
            </div>

            {/* 혼주 정보 */}
            {(hasGroomFamily || hasBrideFamily) && (
              <div className="mt-[43.55px] w-[255px] max-w-full mx-auto font-nanumsquare text-[14px]">
                <div className="space-y-[13px]">
                  {/* 1행: 신랑측 부모님 & 관계 & 신랑 */}
                  {hasGroomFamily && (
                    <div className="flex items-center justify-between gap-2 leading-tight">
                      <span className="text-left text-[#333333] tracking-tight font-normal shrink-0 whitespace-nowrap">
                        {displayGroomParents}
                      </span>
                      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                        <span className="w-[26px] text-center text-[#999999] text-[13px] tracking-tight font-normal">
                          {displayGroomRelation}
                        </span>
                        <span className="w-[42px] text-right text-[#333333] tracking-tight font-normal">
                          {displayGroomName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2행: 신부측 부모님 & 관계 & 신부 */}
                  {hasBrideFamily && (
                    <div className="flex items-center justify-between gap-2 leading-tight">
                      <span className="text-left text-[#333333] tracking-tight font-normal shrink-0 whitespace-nowrap">
                        {displayBrideParents}
                      </span>
                      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                        <span className="w-[26px] text-center text-[#999999] text-[13px] tracking-tight font-normal">
                          {displayBrideRelation}
                        </span>
                        <span className="w-[42px] text-right text-[#333333] tracking-tight font-normal">
                          {displayBrideName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 구분선 */}
            <div 
              style={{ borderTop: '0.5px solid #999999' }}
              className="w-[280.5px] max-w-[75%] mt-[70px] mb-[40px] mx-auto shrink-0" 
            />
          </ScrollReveal>
        </section>

        {/* ========================================================
            03. 에디토리얼 커플 화보 & 초대합니다
            ======================================================== */}
        <section className="bg-[#FEFEFE] select-none overflow-hidden">
          <ScrollReveal>
            {/* 풀 와이드 커플 사진 화보 */}
            {couplePhoto && (
              <div className="w-full aspect-[780/576] overflow-hidden bg-stone-100 select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={couplePhoto}
                  alt="Couple Wedding Editorial"
                  className="w-full h-full object-cover object-center select-none"
                  onError={(e) => {
                    if (isSample && e.currentTarget.src !== '/samples/main-beach.jpg') {
                      e.currentTarget.src = '/samples/main-beach.jpg';
                    }
                  }}
                />
              </div>
            )}

            {/* 모시는 글 본문 */}
            <div className="pt-[89px] pb-0 px-6 text-center flex flex-col items-center">
              <h2 className="font-nanumsquare text-[18px] text-[#292929] font-normal leading-none tracking-tight">
                {invitation?.message_title || config?.message_title || '초대합니다'}
              </h2>

              {(invitation?.message || isSample) && (
                <div className="mt-[43px] w-[256px] max-w-full mx-auto font-nanumsquare text-[14px] text-[#333333] font-normal leading-[1.75] tracking-tight break-keep whitespace-pre-line text-center">
                  {invitation?.message ? (
                    invitation.message
                  ) : isSample ? (
                    <>
                      <p className="mb-6">
                        어느 따스한 봄날,<br />
                        서로의 멜로디가 어우러져 하나의 화음이 되었습니다.<br />
                        이제 두 사람이 한마음으로<br />
                        평생 아름다운 노래처럼 살아가겠습니다.
                      </p>
                      <p>
                        저희가 시작하는 첫 소절에<br />
                        귀한 걸음으로 따뜻한 축복을 더해주세요.
                      </p>
                    </>
                  ) : null}
                </div>
              )}

              {/* 연락하기 버튼 */}
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                style={{ boxShadow: '0px 2px 2.5px rgba(0, 0, 0, 0.07)' }}
                className="mt-[47.5px] w-[163.5px] h-[38px] bg-[#F4F3F1] hover:bg-[#eceae7] active:scale-[0.98] border border-[#D3D3D3] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
              >
                <span className="font-nanumsquare text-[14px] text-[#555555] font-normal tracking-tight">
                  연락하기
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#555555" stroke="none" className="shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[80px] mb-[40px] shrink-0" 
              />
            </div>
          </ScrollReveal>
        </section>

        {/* ========================================================
            04. 캘린더 (이미지 포함 + 미니멀 7열 달력)
            ======================================================== */}
        {hasWeddingDate && calendarData && (
          <section className="w-full bg-[#FEFEFE] pt-16 sm:pt-20 pb-0 px-6 text-center select-none overflow-hidden">
            <ScrollReveal>
              <div className="flex flex-col items-center">
                {/* 상단 1: Wedding Day (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[72%]) */}
                <h2
                  className="text-[25px] font-medium leading-[72%] text-center select-none tracking-normal text-[#292929]"
                  style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                >
                  Wedding Day
                </h2>

                {/* 흑백/감성 화보 (Figma image 763: 354px * 315px -> 1x 177px * 157.5px, mt-[30px]) */}
                {datePhoto && (
                  <div className="mt-[30px] w-[177px] aspect-[354/315] overflow-hidden bg-stone-100 select-none shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

                {/* 예식 일시 (NanumSquare Neo 28px -> 1x 14px, #333333, mt-[48px]) */}
                <p className="mt-[48px] font-nanumsquare text-[14px] text-[#333333] text-center leading-none tracking-tight select-none">
                  {formattedDates.calendarHeaderDate || `${formattedDates.yearNumber}년 ${calendarData.month}월 ${calendarData.weddingDay}일 ${formattedDates.dowKo}요일 | ${formattedDates.timeStrKo}`}
                </p>

                {/* 중앙: 7열 미니멀 숫자 달력 (요일 헤더 없이 숫자만 정렬, mt-[38px]) */}
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
                                ? 'bg-[#454545] text-white font-medium shadow-xs'
                                : isSunday
                                  ? 'text-[#E05353] font-normal'
                                  : 'text-[#666666] font-normal'
                            }`}
                          >
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 구분선 */}
                <div 
                  style={{ borderTop: '0.5px solid #999999' }}
                  className="w-[280.5px] max-w-[75%] mt-[75px] mb-[40px] shrink-0 mx-auto" 
                />
              </div>
            </ScrollReveal>
          </section>
        )}

        {/* ========================================================
            05. 에디토리얼 화보 갤러리
            ======================================================== */}
        {showGallerySection && galleryImages.length > 0 && (
          <section className="w-full bg-[#FEFEFE] pt-[71px] pb-0 px-6 text-center select-none overflow-hidden">
            <ScrollReveal>
              {/* 상단 1: gallery (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[72%]) */}
              <h2
                className="text-[25px] font-medium leading-[72%] text-center select-none tracking-normal text-[#292929] mb-[34.5px]"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
              >
                gallery
              </h2>
              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mb-[53px] tracking-tight">
                사진 갤러리
              </p>

              {/* 메인 화보 대형 컷 */}
              <div 
                onClick={() => {
                  setGalleryModalIndex(activeGalleryIndex);
                  setGalleryModalOpen(true);
                }}
                className="w-[333px] h-[415px] mx-auto mb-[17px] overflow-hidden bg-stone-100 cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryImages[activeGalleryIndex] || galleryImages[0]}
                  alt="Selected wedding photo"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.01]"
                  onError={(e) => {
                    if (isSample && e.currentTarget.src !== '/samples/main-03-playlist.jpg') {
                      e.currentTarget.src = '/samples/main-03-playlist.jpg';
                    }
                  }}
                />
              </div>

              {/* 썸네일 그리드: 4개 + 밑에 4개 = 총 8개 나열 */}
              {galleryImages.length > 1 && (
                <div className="w-[333px] max-w-[calc(100vw-48px)] mx-auto mb-[32px] sm:mb-[40px]">
                  <div className="grid grid-cols-4 gap-[13.8px]">
                    {galleryImages.slice(0, 8).map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveGalleryIndex(idx)}
                        className={`relative aspect-square overflow-hidden rounded-none cursor-pointer transition-all ${
                          idx === activeGalleryIndex
                            ? 'ring-2 ring-[#333333] opacity-100'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`갤러리 사진 ${idx + 1}번 보기`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            if (isSample && e.currentTarget.src !== '/samples/main-03-playlist.jpg') {
                              e.currentTarget.src = '/samples/main-03-playlist.jpg';
                            }
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 하단 더보기 버튼 (클릭 시 전체화면 갤러리 모달 오픈) */}
              <button
                type="button"
                onClick={() => {
                  setGalleryModalIndex(activeGalleryIndex);
                  setGalleryModalOpen(true);
                }}
                style={{
                  boxShadow: '0px 2px 2.5px rgba(0, 0, 0, 0.07)',
                }}
                className="w-[163.5px] h-[38px] rounded-full bg-[#F4F3F1] hover:bg-[#eceae7] border border-[#D3D3D3] text-[#666666] flex items-center justify-center mx-auto active:scale-[0.98] transition-all cursor-pointer select-none"
              >
                <span className="font-nanumsquare text-[14px] font-normal tracking-tight">
                  더보기
                </span>
              </button>

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[60px] mb-[40px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        )}

        {/* ========================================================
            06. 식장 위치 및 오시는 길 안내
            ======================================================== */}
        {(invitation?.venue_name || invitation?.venue_address || isSample) && (
          <section id="location-section" className="w-full bg-[#FEFEFE] pt-[64.5px] pb-0 px-6 text-center select-none overflow-hidden">
            <ScrollReveal>
              {/* 상단 1: location (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[72%]) */}
              <h2
                className="text-[25px] font-medium leading-[72%] text-center select-none tracking-normal text-[#292929]"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
              >
                location
              </h2>

              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                식장 위치
              </p>

              <h3 className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none text-center mt-[43px] tracking-tight">
                {venueFullName || (isSample ? '빌라드지디 청담 르씨엘홀' : '')}
              </h3>

              <div className="mt-[23.5px] flex items-center justify-center gap-1">
                <span className="font-nanumsquare font-normal text-[14px] text-[#999999] leading-none tracking-tight">
                  {invitation?.venue_address || (isSample ? '서울 강남구 학동로 519' : '')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const addr = invitation?.venue_address || (isSample ? '서울 강남구 학동로 519' : '');
                    handleCopyText(addr, '식장 주소가 복사되었습니다.');
                  }}
                  className="inline-flex items-center justify-center p-0.5 text-[#999999] hover:text-[#333333] transition-colors cursor-pointer select-none"
                  title="주소 복사"
                  aria-label="식장 주소 복사"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>

              {/* 지도 컴포넌트 */}
              <div className="mt-[40.5px] w-[303.5px] h-[216.5px] max-w-full mx-auto overflow-hidden bg-stone-100 border border-stone-200">
                <KakaoMap
                  address={invitation?.venue_address || (isSample ? '서울 강남구 학동로 519' : '')}
                  venueName={venueFullName || (isSample ? '빌라드지디 청담' : '')}
                  className="w-full h-full"
                />
              </div>

              {/* 길안내 버튼 2개 */}
              <div className="mt-[26px] w-[303.5px] max-w-full mx-auto flex items-center justify-between gap-[16.5px]">
                <button
                  type="button"
                  onClick={() => {
                    const query = venueFullName || invitation?.venue_address || (isSample ? '빌라드지디 청담' : '');
                    window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank');
                  }}
                  style={{ boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.11)' }}
                  className="w-[143.5px] h-[38px] bg-[#F5F4F4] hover:bg-[#eceae7] active:scale-[0.98] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
                >
                  <span className="font-nanumsquare font-normal text-[14px] text-[#666666] tracking-tight">
                    네이버 지도
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <rect width="24" height="24" rx="5" fill="#03C75A"/>
                    <path d="M7 6H10.2L13.8 12.3V6H17V18H13.8L10.2 11.7V18H7V6Z" fill="white"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const query = venueFullName || invitation?.venue_address || (isSample ? '빌라드지디 청담' : '');
                    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(query)}`, '_blank');
                  }}
                  style={{ boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.11)' }}
                  className="w-[143.5px] h-[38px] bg-[#F5F4F4] hover:bg-[#eceae7] active:scale-[0.98] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
                >
                  <span className="font-nanumsquare font-normal text-[14px] text-[#666666] tracking-tight">
                    카카오내비
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <rect width="24" height="24" rx="5" fill="#FFEB00"/>
                    <path d="M6 15.5L12 5L18 15.5L12 13L6 15.5Z" fill="#0075FF"/>
                  </svg>
                </button>
              </div>

              {/* 오시는 길 안내 관련 박스 */}
              {(transportationList.length > 0 || isSample) && (
                <div className="mt-[54.5px] w-[276.5px] max-w-full mx-auto text-left">
                  {transportationList.length > 0 ? (
                    <div className="space-y-[24px]">
                      {transportationList.map((item, idx) => (
                        <div key={idx}>
                          <h4 className="font-nanumsquare font-bold text-[14px] text-[#333333] mb-3 leading-none">
                            {item.title}
                          </h4>
                          <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed whitespace-pre-line">
                            {renderTransitText(item.content)}
                          </p>
                          {idx < transportationList.length - 1 && (
                            <div style={{ borderTop: '0.5px solid #999999' }} className="w-full my-[24px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : isSample ? (
                    <div>
                      <div>
                        <h4 className="font-nanumsquare font-bold text-[14px] text-[#333333] mb-3 leading-none">
                          지하철
                        </h4>
                        <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed">
                          <span className="text-[#407550] mr-1">7호선</span>청담역 12번 출구 바로 앞 (도보 1분)
                        </p>
                      </div>

                      <div style={{ borderTop: '0.5px solid #999999' }} className="w-full my-[24px]" />

                      <div>
                        <h4 className="font-nanumsquare font-bold text-[14px] text-[#333333] mb-3 leading-none">
                          버스
                        </h4>
                        <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed">
                          <span className="text-[#5B86BF]">간선버스</span> : 143, 301, 362번 청담역 하차
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[40px] mb-[40px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        )}

        {/* ========================================================
            07. 마음 전하실 곳
            ======================================================== */}
        {showAccountsSection && (groomAccounts.length > 0 || brideAccounts.length > 0 || isSample) && (() => {
          const currentAccounts = activeAccountTab === 'groom' ? groomAccounts : brideAccounts;
          const sampleAccounts = activeAccountTab === 'groom'
            ? [
                { relation: '신랑', holder: isSample ? '장민기' : (groomName || '예금주'), bank: '카카오뱅크', number: '3333-02-9876543' },
              ]
            : [
                { relation: '신부', holder: isSample ? '권기득' : (brideName || '예금주'), bank: '신한은행', number: '110-456-789012' },
              ];
          const displayAccounts = currentAccounts.length > 0 ? currentAccounts : (isSample ? sampleAccounts : []);

          return (
            <section id="accounts-section" className="w-full bg-[#FEFEFE] pt-[89px] pb-0 px-6 text-center select-none overflow-hidden">
              <ScrollReveal>
                {/* 상단 1: Account (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[72%]) */}
                <h2
                  className="text-[25px] font-medium leading-[72%] text-center select-none tracking-normal text-[#292929]"
                  style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                >
                  Account
                </h2>

                <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                  마음 전하실 곳
                </p>

                <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.74] text-center mt-[43px] tracking-tight whitespace-pre-line">
                  축복의 마음을 담아 축의금을{`\n`}전달하실 수 있습니다.
                </p>

                {/* 탭 영역 (Figma: 전체선 너비 553px -> 1x 276.5px, mt-[56px]) */}
                <div className="mt-[56px] w-[276.5px] max-w-full mx-auto">
                  <div className="relative flex items-center justify-between pb-[13px]">
                    {/* 신랑측 탭 버튼 */}
                    <button
                      type="button"
                      onClick={() => setActiveAccountTab('groom')}
                      className={`w-1/2 text-center font-nanumsquare text-[13px] leading-[72%] transition-colors cursor-pointer select-none ${
                        activeAccountTab === 'groom'
                          ? 'text-[#292929] font-bold'
                          : 'text-[#999999] font-normal'
                      }`}
                    >
                      신랑측
                    </button>

                    {/* 신부측 탭 버튼 */}
                    <button
                      type="button"
                      onClick={() => setActiveAccountTab('bride')}
                      className={`w-1/2 text-center font-nanumsquare text-[13px] leading-[72%] transition-colors cursor-pointer select-none ${
                        activeAccountTab === 'bride'
                          ? 'text-[#292929] font-bold'
                          : 'text-[#999999] font-normal'
                      }`}
                    >
                      신부측
                    </button>

                    {/* 전체 바닥선 (Figma: 553px -> 1x 276.5px, height: 2px -> 1px, background: #CBCBCB) */}
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#CBCBCB]" />

                    {/* 선택된 쪽에 음영주기 위한 선 (Figma: 너비 281px -> 1x 138.25px / 50%, height: 2px, background: #333333) */}
                    <div 
                      className={`absolute bottom-0 h-[2px] w-1/2 bg-[#333333] transition-all duration-300 ${
                        activeAccountTab === 'groom' ? 'left-0' : 'left-1/2'
                      }`}
                    />
                  </div>

                  {/* 계좌 목록 영역 */}
                  <div className="mt-[37px] text-left">
                    {displayAccounts.length > 0 ? (
                      <div>
                        {displayAccounts.map((acc, idx) => {
                          const relText = acc.relation || acc.title || (activeAccountTab === 'groom' ? '신랑' : '신부');
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
                                    <span className="font-nanumsquare text-[12px] font-normal leading-none text-[#666666]">
                                      {relText}
                                    </span>
                                    <span className="font-nanumsquare text-[12px] font-bold leading-none text-[#292929]">
                                      {holderText}
                                    </span>
                                  </div>
                                  <p className="font-nanumsquare font-normal text-[11.5px] leading-none mt-[8px] tracking-tight text-[#666666]">
                                    {bankText} {numText}
                                  </p>
                                </div>

                                {/* 우측: 복사하기 버튼 */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(numText || copyTarget, '계좌번호가 복사되었습니다.')}
                                  className="w-[80.5px] h-[26px] rounded-full border border-[#D3D3D3] bg-white hover:bg-[#F5F4F4] text-[#292929] flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] select-none"
                                >
                                  <span className="font-nanumsquare font-normal text-[12px] leading-none tracking-tight">
                                    복사하기
                                  </span>
                                </button>
                              </div>

                              {/* 예금주 간 구분선 */}
                              {idx < displayAccounts.length - 1 && (
                                <div style={{ borderTop: '0.5px solid #E5E5E5' }} className="w-full my-[18px]" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center font-nanumsquare text-[12px] text-stone-400">
                        등록된 계좌 정보가 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                {/* 구분선 */}
                <div 
                  style={{ borderTop: '0.5px solid #999999' }}
                  className="w-[280.5px] max-w-[75%] mt-[55px] mb-[40px] mx-auto shrink-0" 
                />
              </ScrollReveal>
            </section>
          );
        })()}

        {/* 08. Notice 안내사항 (Figma 캐러셀 규격 매칭) */}
        {(infoCards.length > 0 || isSample) && (
          <section 
            id="notice-section" 
            className="w-full bg-[#FEFEFE] pt-[69.5px] pb-0 text-center select-none overflow-hidden"
          >
            <ScrollReveal>
              {/* 상단 1: Notice (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[72%]) */}
              <h2
                className="text-[25px] font-medium leading-[72%] text-center select-none tracking-normal text-[#292929]"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
              >
                Notice
              </h2>

              {/* 상단 2: 안내 사항 */}
              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-[72%] text-center mt-[36.5px] tracking-tight">
                안내 사항
              </p>

              {/* 안내 사항 여러개 박스 캐러셀 (1개 박스 186.5x236.5) */}
              <div className="relative mt-[52px] w-full">
                <div
                  ref={noticeContainerRef}
                  onScroll={(e) => {
                    const scrollLeft = e.target.scrollLeft;
                    const cardWidthWithGap = 186.5 + 13;
                    const idx = Math.round(scrollLeft / cardWidthWithGap);
                    if (idx >= 0 && idx < infoCards.length && idx !== activeNoticeIndex) {
                      setActiveNoticeIndex(idx);
                    }
                  }}
                  className={`flex gap-[13px] overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 ${
                    infoCards.length === 1 ? 'justify-center px-4' : 'pl-6 pr-[calc(100%-210.5px)]'
                  }`}
                >
                  {infoCards.map((card, idx) => {
                    const numStr = String(idx + 1).padStart(2, '0');
                    const timeText = card.time || card.sub_title || card.subtitle || '';

                    return (
                      <div
                        key={idx}
                        className="snap-start shrink-0 w-[186.5px] h-[236.5px] border box-border flex flex-col justify-start items-center text-center pt-[39.5px] pb-[39.5px] px-2 bg-[#F3F3F3] border-[#DCDCDC]"
                      >
                        {/* 번호 */}
                        <p className="font-nanumsquare font-normal text-[13px] leading-[9.5px] text-[#292929]">
                          {numStr}
                        </p>

                        {/* 제목 */}
                        <h3 className="font-nanumsquare font-normal text-[13px] leading-[9.5px] mt-[23px] tracking-tight text-[#292929]">
                          {card.title}
                        </h3>

                        {/* 제목과 소제목/시간 사이 구분선 */}
                        <div 
                          style={{ borderTop: '0.5px solid #999999' }}
                          className="w-[127.5px] max-w-full mt-[11px] shrink-0" 
                        />

                        {/* 소제목/시간 원형 영역 */}
                        {timeText ? (
                          <div className="w-[103.5px] h-[19px] rounded-[13.25px] border border-[#999999] box-border flex items-center justify-center shrink-0 mt-[23px] bg-transparent text-[#575757]">
                            <span className="font-nanumsquare font-normal text-[9px] leading-none tracking-tight text-center">
                              {timeText}
                            </span>
                          </div>
                        ) : null}

                        {/* 안내사항 본문 */}
                        <p className={`w-[164px] max-w-full font-nanumsquare font-normal text-[10px] leading-[14.5px] text-[#333333] text-center whitespace-pre-line break-keep px-0.5 ${
                          timeText ? 'mt-[19px]' : 'mt-[23px]'
                        }`}>
                          {card.content}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* 페이지 점선 인디케이터 도트 */}
                {infoCards.length > 1 && (
                  <div className="flex items-center justify-center gap-[4px] mt-[36px]">
                    {infoCards.map((_, idx) => {
                      const isSelected = idx === activeNoticeIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          aria-label={`안내사항 ${idx + 1}번으로 이동`}
                          onClick={() => {
                            if (noticeContainerRef.current) {
                              const cardWidthWithGap = 186.5 + 13;
                              noticeContainerRef.current.scrollTo({
                                left: idx * cardWidthWithGap,
                                behavior: 'smooth',
                              });
                              setActiveNoticeIndex(idx);
                            }
                          }}
                          className="px-[2px] py-1 cursor-pointer flex items-center justify-center select-none"
                        >
                          <span
                            className={`w-[4.5px] h-[4.5px] rounded-full block transition-colors duration-200 ${
                              isSelected ? 'bg-[#585858]' : 'bg-[#D9D9D9]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[55px] mb-[45px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        )}

        {/* ========================================================
            09. 참석 의사 (RSVP)
            ======================================================== */}
        {showRsvpSection && (
          <section className="w-full bg-[#FEFEFE] pt-[96.5px] pb-0 text-center select-none overflow-hidden">
            <ScrollReveal>
              {/* R·S·V·P (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[18px]) */}
              <h2
                className="text-[25px] font-medium leading-[18px] text-center select-none tracking-normal text-[#292929]"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
              >
                R·S·V·P
              </h2>

              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                참석 의사 전달
              </p>

              <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.74] text-center mt-[45px] tracking-tight whitespace-pre-line max-w-[280px] mx-auto">
                소중한 분들과 함께하는 뜻깊은 날,{`\n`}
                정성껏 모실 수 있도록{`\n`}
                참석 여부를 알려주시면 감사하겠습니다.
              </p>

              <div className="mt-[59.5px] flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowRsvpModal(true)}
                  style={{
                    boxShadow: '0px 4px 14.2px rgba(0, 0, 0, 0.09)',
                  }}
                  className="w-[164.5px] h-[39px] bg-[#393939] hover:bg-[#2c2c2c] active:scale-[0.98] rounded-full flex items-center justify-center transition-all cursor-pointer select-none"
                >
                  <span className="font-nanumsquare font-bold text-[14px] text-[#F3F3F3] leading-none tracking-tight">
                    참석 정보 전달하기
                  </span>
                </button>
              </div>

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[65px] mb-[46.5px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        )}

        {/* 09-2. 하객 현장 사진 선물 섹션 */}
        <GuestPhotoSnapSection invitation={invitation} isEditorial={true} />

        {/* ========================================================
            10. 축하 메시지 (Guestbook)
            ======================================================== */}
        {showGuestbookSection && (() => {
          const sampleGuestbooks = [
            {
              id: 'sample-1',
              author: '장성경',
              content: '두 사람 꽃길 결혼 생활 예약🌷\n행복과 축복으로 가득하길 바래🤍',
              created_at: '2027. 10.21',
            },
            {
              id: 'sample-2',
              author: '민경훈',
              content: '형, 드디어 장가갔네! 항상 좋은 일만 가득하길 바란다.\n형이 결혼할 줄 몰랐어. 나도 곧 따라갈게. 늘 행복해라~~~',
              created_at: '2027. 10.21',
            },
            {
              id: 'sample-3',
              author: '강형욱',
              content: '선남선녀끼리 잘만나 오래오래\n행복하길 기원해~~',
              created_at: '2027. 10.21',
            },
          ];

          const displayList = guestbookList.length > 0 ? guestbookList : (isSample ? sampleGuestbooks : []);
          const totalPages = Math.max(isSample ? 3 : 1, Math.ceil(displayList.length / 3));
          const safePageIndex = Math.min(guestbookPageIndex, Math.max(0, totalPages - 1));
          const currentThree = displayList.slice(safePageIndex * 3, safePageIndex * 3 + 3);

          const formatGuestbookDate = (dateStr) => {
            if (!dateStr) return '2027. 10.21';
            if (typeof dateStr === 'string' && dateStr.includes('.')) return dateStr;
            try {
              const d = new Date(dateStr);
              if (isNaN(d.getTime())) return '2027. 10.21';
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${year}. ${month}.${day}`;
            } catch {
              return '2027. 10.21';
            }
          };

          return (
            <section
              id="guestbook-section"
              className="w-full max-w-[430px] mx-auto pt-[96px] pb-[64.5px] px-[21px] text-center select-none bg-gradient-to-b from-[#FEFEFE] to-[#EAEAEA]"
            >
              <ScrollReveal>
                {/* 상단 1: Guestbook (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[18px]) */}
                <h2
                  className="text-[25px] font-medium leading-[18px] text-center select-none tracking-normal text-[#292929]"
                  style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
                >
                  Guestbook
                </h2>

                {/* 상단 2: 방명록 */}
                <p className="font-nanumsquare font-normal text-[18px] leading-[13px] text-center mt-[36.5px] tracking-tight text-[#292929]">
                  방명록
                </p>

                {/* 상단 3: 서브 안내글 */}
                <p className="w-[156.5px] max-w-full mx-auto font-nanumsquare font-normal text-[14px] leading-[24px] text-center mt-[43px] tracking-tight whitespace-pre-line text-[#333333]">
                  두 사람의 새로운 시작에{'\n'}
                  따뜻한 축복을 남겨주세요.
                </p>

                {/* 중앙: 방명록 카드 3개 리스트 영역 */}
                <div
                  onTouchStart={(e) => {
                    guestbookTouchStartX.current = e.touches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    if (guestbookTouchStartX.current === null) return;
                    const deltaX = e.changedTouches[0].clientX - guestbookTouchStartX.current;
                    guestbookTouchStartX.current = null;
                    if (deltaX < -40 && safePageIndex < totalPages - 1) {
                      setGuestbookPageIndex(safePageIndex + 1);
                    } else if (deltaX > 40 && safePageIndex > 0) {
                      setGuestbookPageIndex(safePageIndex - 1);
                    }
                  }}
                  className="w-full max-w-[348px] mx-auto mt-[26.5px] flex flex-col gap-[11px] select-none touch-pan-y"
                >
                  {currentThree.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="w-full min-h-[123.5px] rounded-[14px] p-[18px] pb-[16px] flex flex-col justify-between text-left transition-colors duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] bg-white border border-[#DCDCDC] text-stone-900"
                    >
                      {/* 상단: 작성자 & 삭제 (X) 버튼 */}
                      <div className="w-full flex items-center justify-between">
                        <span className="font-nanumsquare font-normal text-[10px] leading-none tracking-tight text-[#666666]">
                          From : {item.author || item.name || '하객'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSample && String(item.id).startsWith('sample')) {
                              alert('샘플 메시지입니다.');
                              return;
                            }
                            setDeleteTargetMsg(item);
                          }}
                          className="p-0.5 cursor-pointer transition-colors text-[#999999] hover:text-[#292929]"
                          title="메시지 삭제"
                          aria-label="방명록 삭제"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M1 1L9 9M9 1L1 9"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* 본문 메시지 */}
                      <p className="font-nanumsquare font-normal text-[11.5px] leading-[1.6] my-[10px] whitespace-pre-line break-keep line-clamp-3 text-left text-[#333333]">
                        {item.content}
                      </p>

                      {/* 하단: 등록 날짜 */}
                      <span className="font-nanumsquare font-normal text-[10px] leading-none text-[#999999]">
                        {formatGuestbookDate(item.created_at)}
                      </span>
                    </div>
                  ))}

                  {/* 메시지가 없을 때 */}
                  {currentThree.length === 0 && (
                    <div
                      onClick={() => setShowGuestbookModal(true)}
                      className="w-full min-h-[123.5px] rounded-[14px] p-[18px] flex flex-col justify-center items-center text-center cursor-pointer transition-all active:scale-[0.99] select-none border border-dashed bg-white/80 border-[#DCDCDC] hover:border-[#999999] text-stone-500"
                    >
                      <p className="font-nanumsquare text-[12px] tracking-tight">
                        따뜻한 축하 메시지를 남겨주세요 ✍️
                      </p>
                    </div>
                  )}
                </div>

                {/* 페이지네이션 도트 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-[4px] mt-[18px] select-none">
                    {[...Array(totalPages)].map((_, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setGuestbookPageIndex(pIdx)}
                        className="px-[2px] py-1 flex items-center justify-center cursor-pointer bg-transparent border-none"
                        aria-label={`방명록 페이지 ${pIdx + 1}`}
                      >
                        <span
                          className={`w-[5px] h-[5px] rounded-full transition-all ${
                            pIdx === (safePageIndex % totalPages)
                              ? 'bg-[#292929] scale-125'
                              : 'bg-[#CCCCCC] hover:bg-[#999999]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* 하단: 글 남기기 버튼 */}
                <div className="mt-[24px] flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setShowGuestbookModal(true)}
                    style={{
                      boxShadow: '0px 4px 14.2px rgba(0, 0, 0, 0.09)',
                    }}
                    className="w-[134px] h-[39px] rounded-[24.5px] flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 bg-[#393939] hover:bg-[#252525] text-[#F3F3F3]"
                  >
                    <span className="font-nanumsquare font-bold text-[14px] leading-none text-center">
                      글 남기기
                    </span>
                  </button>
                </div>
              </ScrollReveal>
            </section>
          );
        })()}

        {/* ========================================================
            11. 엔딩 사진 & 감사 인사
            ======================================================== */}
        <section className="w-full bg-[#FEFEFE] pt-0 pb-[50px] text-center select-none overflow-hidden relative">
          <ScrollReveal duration={1000}>
            {/* 풀 와이드 엔딩 화보 사진 */}
            <div className="w-full aspect-[780/581.27] overflow-hidden bg-stone-100 select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={endingImage || couplePhoto || mainImage}
                alt="Wedding Ending"
                className="w-full h-full object-cover object-center select-none"
                onError={(e) => {
                  if (isSample && e.currentTarget.src !== '/samples/ending-03-childhood.jpg') {
                    e.currentTarget.src = '/samples/ending-03-childhood.jpg';
                  }
                }}
              />
            </div>

            {/* Thank you (Figma 시안 4: Cormorant Garamond 500, 50px -> 1x 25px, #292929, leading-[18px], mt-[37.5px]) */}
            <h2
              className="font-medium text-[25px] leading-[18px] text-center select-none tracking-normal mt-[37.5px] text-[#292929]"
              style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}
            >
              Thank you
            </h2>

            <p className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-[1.62] text-center mt-[40px] tracking-tight">
              함께해 주셔서 감사합니다.
            </p>

            <p className="font-nanumsquare font-normal text-[15px] text-[#999999] leading-[1.62] text-center mt-[10px] tracking-tight">
              {groomShort && brideShort 
                ? `${groomShort} · ${brideShort} 드림`
                : (groomName && brideName ? `${groomName} · ${brideName} 드림` : (isSample ? '민기 · 기득 드림' : '신랑 · 신부 드림'))}
            </p>

            {/* 브랜드 카피라이트 (Figma 1:1: Poppins 12px, #999999, mt-[95px], pb-[40px]) */}
            <p className="font-sans font-normal text-[12px] leading-[1.62] text-[#999999] tracking-[0.05em] uppercase text-center mt-[95px] pb-[40px] select-none">
              DESIGNED BY ATELIER DE MUKIRU
            </p>
          </ScrollReveal>
        </section>

        {/* 에디토리얼 전용 팝업 모달 */}
        {showContactModal && (
          <EditorialContactModal invitation={invitation} onClose={() => setShowContactModal(false)} />
        )}
        {showRsvpModal && (
          <EditorialRsvpModal invitation={invitation} invitationId={invitation?.id} onClose={() => setShowRsvpModal(false)} />
        )}
        {showGuestbookModal && (
          <EditorialGuestbookModal
            invitationId={invitation?.id}
            onClose={() => setShowGuestbookModal(false)}
            onSuccess={(newMsg) => setGuestbookList((prev) => [newMsg, ...prev])}
          />
        )}
        {deleteTargetMsg && (
          <EditorialGuestbookDeleteModal
            targetMsg={deleteTargetMsg}
            onClose={() => setDeleteTargetMsg(null)}
            onDeleteSuccess={(delId) => setGuestbookList((prev) => prev.filter((m) => m.id !== delId))}
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
    </div>
  );
}
