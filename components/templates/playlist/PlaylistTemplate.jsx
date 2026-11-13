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

export default function PlaylistTemplate({ invitation }) {
  // 1. 모달 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 2. 뮤직 플레이어 위젯 & 오디오 애니메이션 상태 (시안 3 상단 고유)
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState('0:00');
  const [audioTotalDuration, setAudioTotalDuration] = useState('3:19');

  // 3. 방명록 상태 (시안 2 에디토리얼 4컷 2x2 카드 + 페이지네이션)
  const [guestbookList, setGuestbookList] = useState([]);
  const [guestbookPageIndex, setGuestbookPageIndex] = useState(0);
  const guestbookTouchStartX = useRef(null);

  // 4. 갤러리 상태
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // 5. 계좌 탭 상태
  const [userAccountTab, setUserAccountTab] = useState(null);

  // 6. 안내사항 상태
  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);
  const noticeTouchStartX = useRef(null);

  // 7. 데이터 언패킹 & fallback
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'playlist');
  const config = useMemo(() => invitation?.template_config || {}, [invitation?.template_config]);
  const images = useMemo(() => invitation?.images || {}, [invitation?.images]);
  const extra = useMemo(() => invitation?.extra_data || {}, [invitation?.extra_data]);

  const showCountdownSection = config.show_countdown !== false;
  const showGallerySection = config.show_gallery !== false;
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;
  const showGuestbookSection = config.show_guestbook !== false;

  // 대표 이미지 매핑
  const mainImage = images.main || images.cover || invitation?.main_image || (isSample ? '/samples/main-03-playlist.jpg' : '');
  const bridePhoto = images.bride_profile || images.bride || extra.bride_profile_image || invitation?.bride_photo || (isSample ? '/samples/bride-profile-03.jpg' : '');
  const groomPhoto = images.groom_profile || images.groom || extra.groom_profile_image || invitation?.groom_photo || (isSample ? '/samples/groom-profile-01.jpg' : '');
  const couplePhoto = images.couple_profile || images.couple || extra.couple_profile_image || (isSample ? '/samples/main-beach.jpg' : (mainImage || ''));
  const endingImage = images.ending || extra.ending_image || invitation?.ending_image || couplePhoto || mainImage;
  const datePhoto = images.calendar || images.calendar_photo || images.ending || (galleryImages && galleryImages.length > 1 ? galleryImages[1] : null) || (isSample ? '/samples/ending-04-classic.jpg' : '');

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
  const groomName = invitation?.groom_name || (isSample ? '강민우' : '');
  const brideName = invitation?.bride_name || (isSample ? '서유진' : '');
  const coupleKo = [groomName, brideName].filter(Boolean).join(' · ');

  // 날짜 계산 & 카운트다운
  const weddingDateStr = invitation?.wedding_date 
    ? invitation.wedding_date.replace(' ', 'T') 
    : (isSample ? '2027-05-23T14:00:00' : '');
  const hasWeddingDate = Boolean(weddingDateStr);
  const targetDate = useMemo(() => {
    if (!weddingDateStr) return null;
    const d = new Date(weddingDateStr);
    return isNaN(d.getTime()) ? null : d;
  }, [weddingDateStr]);

  const isValidDate = Boolean(targetDate);
  const year = isValidDate ? targetDate.getFullYear() : (isSample ? 2027 : '');
  const date = isValidDate ? targetDate.getDate() : (isSample ? 23 : '');

  // 카운트다운 타이머 상태
  const [timeLeft, setTimeLeft] = useState({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    totalDays: 0,
    isPast: false,
    isToday: false 
  });

  useEffect(() => {
    if (!targetDate) return;
    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const diffDayCount = Math.round((targetMidnight - nowMidnight) / (1000 * 60 * 60 * 24));
      const isSameDay = diffDayCount === 0;

      if (diffDayCount > 0) {
        const totalSec = Math.max(0, Math.floor(diff / 1000));
        const hours = Math.floor((totalSec / 3600) % 24);
        const minutes = Math.floor((totalSec / 60) % 60);
        const seconds = totalSec % 60;
        setTimeLeft({ days: diffDayCount, hours, minutes, seconds, totalDays: diffDayCount, isPast: false, isToday: false });
      } else if (isSameDay) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, isPast: false, isToday: true });
      } else {
        const pastDays = Math.abs(diffDayCount);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: pastDays, isPast: true, isToday: false });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

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

  const monthEn = formattedDates.monthName || (isSample ? 'MAY' : '');

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

  const isOfficialDemo = invitation?.slug === 'playlist';
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
  const displayGroomName = groomName || (allowSampleParents ? '강민우' : '');
  const hasGroomFamily = Boolean(displayGroomParents && displayGroomName);

  const displayBrideParents = brideParentsNode || (allowSampleParents ? '서병철 · 한정숙' : null);
  const displayBrideRelation = brideRelation || (allowSampleParents ? '차녀' : (brideParentsNode ? '장녀' : ''));
  const displayBrideName = brideName || (allowSampleParents ? '서유진' : '');
  const hasBrideFamily = Boolean(displayBrideParents && displayBrideName);

  const groomShort = invitation?.groom_name && invitation.groom_name.length === 3 ? invitation.groom_name.slice(1) : (invitation?.groom_name || '');
  const brideShort = invitation?.bride_name && invitation.bride_name.length === 3 ? invitation.bride_name.slice(1) : (invitation?.bride_name || '');

  const venueFullName = [invitation?.venue_name, invitation?.venue_hall || config?.venue_hall].filter(Boolean).join(' ');

  // 전역 오디오 상태 동기화 및 제어 (시안 3 상단 플레이어)
  useEffect(() => {
    let audioEl = null;

    const syncState = () => {
      if (!audioEl) audioEl = document.querySelector('audio');
      if (audioEl) {
        setIsPlaying(!audioEl.paused);
        if (audioEl.duration && !isNaN(audioEl.duration)) {
          const cur = Math.floor(audioEl.currentTime);
          const dur = Math.floor(audioEl.duration);
          setAudioCurrentTime(`${Math.floor(cur / 60)}:${String(cur % 60).padStart(2, '0')}`);
          setAudioTotalDuration(`${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}`);
          setTrackProgress((audioEl.currentTime / audioEl.duration) * 100);
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (audioEl && audioEl.duration && !isNaN(audioEl.duration)) {
        const cur = Math.floor(audioEl.currentTime);
        const dur = Math.floor(audioEl.duration);
        setAudioCurrentTime(`${Math.floor(cur / 60)}:${String(cur % 60).padStart(2, '0')}`);
        setAudioTotalDuration(`${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}`);
        setTrackProgress((audioEl.currentTime / audioEl.duration) * 100);
      }
    };

    const attachListeners = () => {
      audioEl = document.querySelector('audio');
      if (audioEl) {
        syncState();
        audioEl.addEventListener('play', handlePlay);
        audioEl.addEventListener('pause', handlePause);
        audioEl.addEventListener('timeupdate', handleTimeUpdate);
      }
    };

    attachListeners();
    const interval = setInterval(() => {
      if (!audioEl) {
        attachListeners();
      } else {
        syncState();
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (audioEl) {
        audioEl.removeEventListener('play', handlePlay);
        audioEl.removeEventListener('pause', handlePause);
        audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, []);

  const togglePlayAudio = () => {
    const audioEl = document.querySelector('audio');
    if (audioEl) {
      if (audioEl.paused) {
        audioEl.play().catch(() => {});
      } else {
        audioEl.pause();
      }
    }
  };

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
  };

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
  const infoCards = useMemo(() => {
    let raw = invitation?.info_notices;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch {}
    }
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const legacy = [];
    if (extra.meal_info) legacy.push({ title: '식사 안내', content: extra.meal_info });
    if (extra.shuttle_info) legacy.push({ title: '셔틀버스 안내', content: extra.shuttle_info });
    return legacy;
  }, [invitation?.info_notices, extra.meal_info, extra.shuttle_info]);

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

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('청첩장 링크가 복사되었습니다.');
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleKakaoShare = () => {
    const isActive = invitation?.is_active ?? config?.is_active ?? true;
    if (!isActive) {
      alert('현재 청첩장은 [샘플 미리보기 모드] 상태입니다.\n정식 인증 또는 관리자 활성화 후 하객분들께 공유해 주세요.');
    }
    if (typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    const weddingDateFormatted = formattedDates.calendarHeaderDate || `${year}년 ${date}일`;
    const venueText = venueFullName || invitation?.venue_name || '웨딩홀';
    const shareTitle = `${groomName} ♥ ${brideName}의 결혼식에 초대합니다`;
    const shareDesc = `${weddingDateFormatted} | ${venueText}`;

    if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
      try {
        const imageUrl = getSafeKakaoShareImageUrl(mainImage || endingImage);
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: shareTitle,
            description: shareDesc,
            imageUrl: imageUrl,
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl,
            },
          },
          buttons: [
            {
              title: '모바일 청첩장 보기',
              link: {
                mobileWebUrl: currentUrl,
                webUrl: currentUrl,
              },
            },
          ],
        });
        return;
      } catch (err) {
        console.warn('Kakao share error, fallback to copy:', err);
      }
    }

    handleCopyLink();
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
      
      {/* 예식 당일 안내 데스크 (당일 자동 전환) */}
      <TodayConciergeCard invitation={invitation} />
      
      {/* ========================================================
          01. HERO SECTION: PREMIUM WEDDING PLAYLIST CARD (시안 3 상단 고유 UI 온전히 유지)
          ======================================================== */}
      <section className="relative px-4 pt-7 pb-10 bg-linear-to-b from-[#F7F5EE] via-[#FAF8F5] to-[#FAF8F5]">
        
        {/* 감성 뮤직 플레이어 카드 */}
        <div className="w-full max-w-[370px] sm:max-w-[390px] mx-auto bg-[#FAF8F5] rounded-[40px] p-3.5 sm:p-4.5 pb-6 sm:pb-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-stone-200/70 select-none">
          
          {/* 1. 상단 둥근 웨딩 화보 사진 */}
          <div className="relative w-full aspect-[537/525] rounded-[32px] overflow-hidden bg-stone-200 shadow-xs">
            {mainImage ? (
              <img
                src={mainImage}
                alt="Wedding Album Cover"
                className="w-full h-full object-cover grayscale contrast-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 font-serif text-sm">
                ATELIER DE MUKIRU
              </div>
            )}
          </div>

          {/* 2. 트랙 정보: 날짜, 이름(정통 Noto Serif KR 명조체), 1줄 고정 카피, 라인 하트 */}
          <div className="mt-5 px-1.5 text-left">
            {/* 영문 대문자 날짜 */}
            <span className="text-[11px] font-sans tracking-[0.24em] text-[#8E8E93] font-normal uppercase block mb-1.5">
              {monthEn.toUpperCase()} {date}, {year}
            </span>

            {/* 신랑 💗 신부 (정통 본명조 Noto Serif KR 24px) & 우측 라인 하트 */}
            <div className="flex items-center justify-between">
              <h1 
                style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
                className="text-[23.5px] sm:text-[25.5px] font-normal text-[#1C1C1E] tracking-tight flex items-center gap-1.5"
              >
                <span>{groomName}</span>
                <span className="text-[17px] inline-block align-middle mx-0.5">💗</span>
                <span>{brideName}</span>
              </h1>

              {/* 좋아요 하트 버튼 */}
              <button
                type="button"
                onClick={handleHeartClick}
                className={`p-1 transition-transform duration-300 cursor-pointer ${heartAnim ? 'scale-125' : 'scale-100 hover:scale-110'}`}
                aria-label="좋아요"
              >
                <svg
                  className={`w-[21px] h-[21px] transition-colors ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-[#1C1C1E]'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  fill="none"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>

            {/* 1줄 고정 하드코딩 서브카피 */}
            <p 
              style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
              className="text-[12.5px] text-[#8E8E93] tracking-[0.18em] font-normal mt-1.5"
            >
              저희  결혼합니다.
            </p>
          </div>

          {/* 3. 프로그레스 바 */}
          <div className="mt-5 px-1.5">
            <div 
              onClick={togglePlayAudio}
              className="relative w-full h-[3px] bg-[#E5E5EA] rounded-full cursor-pointer flex items-center"
            >
              <div 
                className="h-full bg-[#1C1C1E] rounded-full transition-all duration-300 relative flex items-center justify-end"
                style={{ width: `${isPlaying ? trackProgress : 38}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#1C1C1E] shadow-sm shrink-0 -mr-1" />
              </div>
            </div>

            {/* 시간 표시 */}
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#8E8E93]">
              <span>{isPlaying ? audioCurrentTime : '3:19'}</span>
              <span>- {isPlaying ? audioTotalDuration : '4:26'}</span>
            </div>
          </div>

          {/* 4. 하단 미디어 컨트롤러 */}
          <div className="mt-6 mb-2 px-1 w-full flex items-center justify-between">
            {/* 셔플 */}
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-10 h-10 flex items-center justify-center text-[#1C1C1E] hover:text-black transition-colors cursor-pointer"
              aria-label="셔플"
            >
              <svg className="w-[19px] h-[19px] fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M16 3h5v5" />
                <path d="M4 20L21 3" />
                <path d="M21 16v5h-5" />
                <path d="M15 15l6 6" />
                <path d="M4 4l5 5" />
              </svg>
            </button>

            {/* 이전 곡 */}
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-10 h-10 flex items-center justify-center text-[#1C1C1E] hover:scale-105 transition-transform cursor-pointer"
              aria-label="이전 곡"
            >
              <svg className="w-[20px] h-[20px] fill-current" viewBox="0 0 24 24">
                <rect x="4" y="4" width="3" height="16" rx="1.2" />
                <path d="M20 5.2v13.6a1 1 0 0 1-1.6.8L9.2 12.8a1 1 0 0 1 0-1.6L18.4 4.4a1 1 0 0 1 1.6.8z" />
              </svg>
            </button>

            {/* 중앙 대형 재생/일시정지 원형 버튼 */}
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-[52px] h-[52px] rounded-full bg-[#1C1C1E] hover:bg-black text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? (
                <svg className="w-[17px] h-[19px] fill-white" viewBox="0 0 20 24">
                  <rect x="2.5" y="3" width="5" height="18" rx="1.5" />
                  <rect x="12.5" y="3" width="5" height="18" rx="1.5" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[19px] fill-white translate-x-0.5" viewBox="0 0 20 24">
                  <path d="M4 3.5v17a1 1 0 0 0 1.54.85l13-8.5a1 1 0 0 0 0-1.7l-13-8.5A1 1 0 0 0 4 3.5z" />
                </svg>
              )}
            </button>

            {/* 다음 곡 */}
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-10 h-10 flex items-center justify-center text-[#1C1C1E] hover:scale-105 transition-transform cursor-pointer"
              aria-label="다음 곡"
            >
              <svg className="w-[20px] h-[20px] fill-current" viewBox="0 0 24 24">
                <path d="M4 5.2v13.6a1 1 0 0 0 1.6.8L14.8 12.8a1 1 0 0 0 0-1.6L5.6 4.4a1 1 0 0 0-1.6.8z" />
                <rect x="17" y="4" width="3" height="16" rx="1.2" />
              </svg>
            </button>

            {/* 반복 */}
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-10 h-10 flex items-center justify-center text-[#1C1C1E] hover:text-black transition-colors cursor-pointer"
              aria-label="반복 재생"
            >
              <svg className="w-[19px] h-[19px] fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M17 2l4 4-4 4" />
                <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                <path d="M7 22l-4-4 4-4" />
                <path d="M21 13v1a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          </div>

        </div>

        {/* 하단 스크롤 인디케이터 */}
        <div className="mt-8 flex flex-col items-center gap-1.5 opacity-60">
          <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase font-medium">
            SCROLL FOR STORY
          </span>
          <div className="w-px h-5 bg-stone-400 animate-pulse" />
        </div>
      </section>

      {/* ========================================================
          02. 에디토리얼 프로필 스프레드: 신부 & 신랑 단독 프로필 카드 & 혼주 정보 (시안 2 에디토리얼 UI)
          ======================================================== */}
      <section id="editorial-story-section" className="pt-[99.5px] pb-0 px-6 bg-[#FEFEFE] relative flex flex-col items-center select-none overflow-hidden">
        <ScrollReveal>
          {/* 상단 영문 필기체 헤더 */}
          <div className="text-center mb-[28px] select-none flex flex-col items-center justify-center min-h-[64px]">
            <p className="font-weddingday text-[27.5px] text-[#292929] tracking-normal leading-[1.14] select-none">
              Welcome to
            </p>
            <p className="font-weddingday text-[27.5px] text-[#292929] tracking-normal leading-[1.14] select-none mt-1 whitespace-nowrap">
              {fullNamesEn || coupleKo || (isSample ? 'Minwoo & Yujin' : '')}
            </p>
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
          04. 플레이리스트 캘린더 (이미지 포함 + 미니멀 7열 달력, 카운트다운 제거)
          ======================================================== */}
      {hasWeddingDate && calendarData && (
        <section className="w-full bg-[#FEFEFE] pt-16 sm:pt-20 pb-0 px-6 text-center select-none overflow-hidden">
          <ScrollReveal>
            <div className="flex flex-col items-center">
              {/* Wedding Day 필기체 (Playlist 서체: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
              <h2
                className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal"
                style={{ fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive" }}
              >
                Wedding Day
              </h2>

              {/* 흑백/감성 화보 (Figma image 763: 354px * 315px -> 1x 177px * 157.5px, mt-[30px]) */}
              {datePhoto && (
                <div className="mt-[30px] w-[177px] aspect-[354/315] overflow-hidden bg-stone-100 select-none shadow-xs">
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

              {/* 예식 일시 (Playlist 서체: NanumSquare Neo OTF 28px -> 1x 14px, #333333, mt-[48px]) */}
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
            <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal mb-[34.5px]">
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
            <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
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
              { relation: '신랑', holder: isSample ? '강민우' : (groomName || '예금주'), bank: '카카오뱅크', number: '3333-02-9876543' },
            ]
          : [
              { relation: '신부', holder: isSample ? '서유진' : (brideName || '예금주'), bank: '신한은행', number: '110-456-789012' },
            ];
        const displayAccounts = currentAccounts.length > 0 ? currentAccounts : (isSample ? sampleAccounts : []);

        return (
          <section id="accounts-section" className="w-full bg-[#FEFEFE] pt-[89px] pb-0 px-6 text-center select-none overflow-hidden">
            <ScrollReveal>
              <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
                Account
              </h2>

              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                마음 전하실 곳
              </p>

              <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.74] text-center mt-[43px] tracking-tight whitespace-pre-line">
                축복의 마음을 담아 축의금을{`\n`}전달하실 수 있습니다.
              </p>

              {/* 파일철 탭 카드 */}
              <div className="w-[315px] max-w-full mx-auto mt-[46.5px] text-left">
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setActiveAccountTab('groom')}
                    style={{
                      boxShadow: activeAccountTab === 'groom' ? '0px -2px 4px rgba(0,0,0,0.04)' : 'none',
                    }}
                    className={`w-1/2 h-[42px] flex items-center justify-center font-nanumsquare text-[13px] tracking-tight transition-all cursor-pointer rounded-tl-[12px] rounded-tr-[16px] select-none ${
                      activeAccountTab === 'groom'
                        ? 'bg-[#F5F4F4] text-[#292929] font-bold z-10'
                        : 'bg-[#FEFEFE] text-[#999999] font-normal border-t border-l border-stone-200/60 hover:text-[#555555]'
                    }`}
                  >
                    신랑측
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveAccountTab('bride')}
                    style={{
                      boxShadow: activeAccountTab === 'bride' ? '0px -2px 4px rgba(0,0,0,0.04)' : 'none',
                    }}
                    className={`w-1/2 h-[42px] flex items-center justify-center font-nanumsquare text-[13px] tracking-tight transition-all cursor-pointer rounded-tl-[16px] rounded-tr-[12px] select-none ${
                      activeAccountTab === 'bride'
                        ? 'bg-[#F5F4F4] text-[#292929] font-bold z-10'
                        : 'bg-[#FEFEFE] text-[#999999] font-normal border-t border-r border-stone-200/60 hover:text-[#555555]'
                    }`}
                  >
                    신부측
                  </button>
                </div>

                <div 
                  style={{ boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)' }}
                  className="bg-[#F5F4F4] rounded-b-[12px] pt-[28px] pb-[32px] px-[20px]"
                >
                  {displayAccounts.length > 0 ? (
                    <div>
                      {displayAccounts.map((acc, idx) => {
                        const relText = acc.relation || acc.title || (activeAccountTab === 'groom' ? '신랑' : '신부');
                        const holderText = acc.holder || acc.name || '예금주';
                        const bankText = acc.bank || '';
                        const numText = acc.number || acc.account_number || '';

                        return (
                          <div key={idx}>
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-nanumsquare text-[12px] text-[#666666] font-normal leading-none">
                                    {relText}
                                  </span>
                                  <span className="font-nanumsquare text-[12px] text-[#292929] font-bold leading-none">
                                    {holderText}
                                  </span>
                                </div>
                                <p className="font-nanumsquare text-[11.5px] text-[#666666] mt-2 font-normal leading-none tracking-tight">
                                  {bankText} {numText}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  handleCopyText(numText, '계좌번호가 복사되었습니다.');
                                }}
                                className="w-[80.5px] h-[26px] bg-white hover:bg-stone-50 active:scale-95 border border-[#CCCCCC] rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 select-none shadow-2xs"
                              >
                                <span className="font-nanumsquare text-[12px] text-[#292929] font-normal leading-none">
                                  복사하기
                                </span>
                              </button>
                            </div>

                            {idx < displayAccounts.length - 1 && (
                              <div style={{ borderTop: '0.5px solid #D5D5D5' }} className="w-full my-[18px]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-stone-400 font-nanumsquare text-[12px]">
                      등록된 계좌 정보가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[60px] mb-[45px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        );
      })()}

      {/* ========================================================
          08. Notice 안내사항
          ======================================================== */}
      {(infoCards.length > 0 || isSample) && (() => {
        const sampleNotices = [
          {
            title: '식사 안내',
            content: `소중한 시간을 내어 함께해 주시는 분들을 위해\n감사의 마음을 담아 식사를 준비하였습니다.\n맛있게 드시고 편안한 시간 보내시기 바랍니다.`,
          },
        ];
        const displayNotices = infoCards.length > 0 ? infoCards : (isSample ? sampleNotices : []);
        if (displayNotices.length === 0) return null;

        const currentNotice = displayNotices[activeNoticeIndex % displayNotices.length] || displayNotices[0];
        const hasMultiple = displayNotices.length > 1;

        return (
          <section className="w-full bg-[#FEFEFE] pt-[61px] pb-0 text-center select-none overflow-hidden">
            <ScrollReveal>
              <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
                Notice
              </h2>

              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                안내 사항
              </p>

              {/* 필름 스트립 프레임 영역 */}
              <div 
                className="w-full bg-[#DDE7F3] pt-[12px] pb-[14px] mt-[39px] relative overflow-hidden flex flex-col items-center select-none touch-pan-y"
                onTouchStart={(e) => {
                  noticeTouchStartX.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  if (noticeTouchStartX.current === null) return;
                  const deltaX = e.changedTouches[0].clientX - noticeTouchStartX.current;
                  noticeTouchStartX.current = null;
                  if (hasMultiple) {
                    if (deltaX < -35) {
                      setActiveNoticeIndex((prev) => (prev + 1) % displayNotices.length);
                    } else if (deltaX > 35) {
                      setActiveNoticeIndex((prev) => (prev - 1 + displayNotices.length) % displayNotices.length);
                    }
                  }
                }}
              >
                <div className="w-full max-w-[390px] px-6 flex justify-between items-center text-white select-none mb-[8px]">
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">2</span>
                  <span className="font-nanumsquare font-extrabold text-[10px] text-white tracking-[0.05em] leading-none uppercase text-center">
                    DESIGNED BY ATELIER DE MUKIRU
                  </span>
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">3</span>
                </div>

                <div className="w-full max-w-[390px] px-3 flex justify-between items-center select-none">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-[19px] h-[23px] bg-[#F5F5F5] rounded-[4px] shrink-0" />
                  ))}
                </div>

                <div className="w-full max-w-[390px] flex items-center justify-center gap-[12px] my-[13px] select-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasMultiple) {
                        setActiveNoticeIndex((prev) => (prev - 1 + displayNotices.length) % displayNotices.length);
                      }
                    }}
                    aria-label="이전 안내사항 보기"
                    className={`w-[24px] h-[210px] bg-white rounded-r-[8px] opacity-90 shrink-0 flex items-center justify-center transition-all ${
                      hasMultiple
                        ? 'cursor-pointer hover:opacity-100 hover:w-[26px] active:scale-95 text-[#999999] hover:text-[#333333]'
                        : 'cursor-default pointer-events-none'
                    }`}
                  >
                    {hasMultiple && (
                      <span className="text-[12px] font-bold select-none opacity-60">‹</span>
                    )}
                  </button>

                  <div 
                    key={activeNoticeIndex}
                    className="w-[276px] min-h-[210px] bg-white rounded-[10px] py-[28px] px-[18px] flex flex-col items-center justify-center text-center shrink-0 shadow-xs transition-all duration-200 animate-in fade-in"
                  >
                    <h3 className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-none text-center tracking-tight">
                      {currentNotice.title || '식사 안내'}
                    </h3>

                    <div 
                      style={{ borderTop: '0.5px solid #929292' }} 
                      className="w-[239px] max-w-full my-[17px]" 
                    />

                    <p className="font-nanumsquare font-normal text-[12px] text-[#333333] leading-[1.78] text-center tracking-tight whitespace-pre-line">
                      {currentNotice.content || ''}
                    </p>

                    {hasMultiple && (
                      <div className="flex items-center justify-center gap-1.5 mt-4">
                        {displayNotices.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveNoticeIndex(i);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                              i === (activeNoticeIndex % displayNotices.length)
                                ? 'w-4 bg-[#333333]'
                                : 'bg-stone-300'
                            }`}
                            aria-label={`안내 사항 ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (hasMultiple) {
                        setActiveNoticeIndex((prev) => (prev + 1) % displayNotices.length);
                      }
                    }}
                    aria-label="다음 안내사항 보기"
                    className={`w-[24px] h-[210px] bg-white rounded-l-[8px] opacity-90 shrink-0 flex items-center justify-center transition-all ${
                      hasMultiple
                        ? 'cursor-pointer hover:opacity-100 hover:w-[26px] active:scale-95 text-[#999999] hover:text-[#333333]'
                        : 'cursor-default pointer-events-none'
                    }`}
                  >
                    {hasMultiple && (
                      <span className="text-[12px] font-bold select-none opacity-60">›</span>
                    )}
                  </button>
                </div>

                <div className="w-full max-w-[390px] px-3 flex justify-between items-center select-none">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-[19px] h-[23px] bg-[#F5F5F5] rounded-[4px] shrink-0" />
                  ))}
                </div>

                <div className="w-full max-w-[390px] px-6 flex justify-between items-center text-white select-none mt-[8px]">
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">6</span>
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">7</span>
                </div>
              </div>

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[55px] mb-[45px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        );
      })()}

      {/* ========================================================
          09. 참석 의사 (RSVP)
          ======================================================== */}
      {showRsvpSection && (
        <section className="w-full bg-[#FEFEFE] pt-[96.5px] pb-0 text-center select-none overflow-hidden">
          <ScrollReveal>
            <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
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
            content: '두 사람 너무\n잘어울려요\n행복하게 잘 살아요.',
          },
          {
            id: 'sample-2',
            author: '이수빈',
            content: '언니 너무 예뻐요!\n남편이랑 항상\n행복하세요.',
          },
          {
            id: 'sample-3',
            author: '김형욱',
            content: '형, 드디어 장가\n갔네! 항상 좋은 일만\n가득하길 바란다.',
          },
          {
            id: 'sample-4',
            author: '최미자',
            content: '선남선녀끼리\n잘만나 오래오래\n행복하길 기원해~~',
          },
        ];

        const displayList = guestbookList.length > 0 ? guestbookList : (isSample ? sampleGuestbooks : []);
        const totalPages = Math.max(isSample ? 3 : 1, Math.ceil(displayList.length / 4));
        const safePageIndex = Math.min(guestbookPageIndex, Math.max(0, totalPages - 1));
        const currentFour = displayList.slice(safePageIndex * 4, safePageIndex * 4 + 4);

        return (
          <section className="w-full bg-[#FEFEFE] pt-[91px] pb-0 text-center select-none overflow-hidden">
            <ScrollReveal>
              <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
                Guestbook
              </h2>

              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                방명록
              </p>

              <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.72] text-center mt-[43px] tracking-tight whitespace-pre-line max-w-[280px] mx-auto">
                두 사람의 새로운 시작에{`\n`}
                따뜻한 축복을 남겨주세요.
              </p>

              {/* 방명록 4컷 프레임 영역 */}
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
                className="w-[350px] max-w-[92%] mx-auto bg-[#E6EDF5] rounded-[14px] pt-[9px] pb-[9px] px-[10px] mt-[29px] flex flex-col justify-between select-none touch-pan-y"
              >
                <div className="w-full px-2 flex items-center justify-between text-[#999999] text-[8.5px] font-nanumsquare leading-none mb-[8px] select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px]">▶</span>
                    <span className="font-mono text-[9px]">32</span>
                  </div>
                  <span className="tracking-[0.14em] font-normal uppercase text-[8px]">
                    DESIGNED BY ATELIER DE MUKIRU
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px]">32</span>
                    <span className="text-[7px]">◀</span>
                  </div>
                </div>

                {/* 4컷 2x2 그리드 */}
                <div className="grid grid-cols-2 gap-[8px] w-full">
                  {currentFour.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="w-full min-h-[155px] bg-[#FEFEFE] rounded-[10px] py-[16px] px-[12px] flex flex-col justify-between items-center text-center shadow-2xs"
                    >
                      <div className="flex-1 flex items-center justify-center w-full">
                        <p className="font-nanumsquare font-normal text-[11.5px] text-[#333333] leading-[1.78] whitespace-pre-line tracking-tight text-center line-clamp-4">
                          {item.content}
                        </p>
                      </div>

                      <div 
                        style={{ borderTop: '0.5px solid #999999' }} 
                        className="w-[99.5px] max-w-[80%] my-[9px] shrink-0" 
                      />

                      <div className="w-full flex items-center justify-center gap-1.5 shrink-0">
                        <span className="font-nanumsquare font-normal text-[12px] text-[#999999] leading-none tracking-tight">
                          {item.author || item.name || '하객'}
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
                          className="text-[#999999] hover:text-[#333333] transition-colors p-0.5 cursor-pointer shrink-0"
                          title="메시지 삭제"
                          aria-label="방명록 삭제"
                        >
                          <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 2.5H9M3.5 2.5V1.5C3.5 1.22386 3.72386 1 4 1H6C6.27614 1 6.5 1.22386 6.5 1.5V2.5M8 2.5V9.5C8 9.77614 7.77614 10 7.5 10H2.5C2.22386 10 2 9.77614 2 9.5V2.5" stroke="currentColor" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {currentFour.length < 4 && [...Array(4 - currentFour.length)].map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      onClick={() => setShowGuestbookModal(true)}
                      className="w-full min-h-[155px] bg-[#FEFEFE]/80 hover:bg-[#FEFEFE] border border-dashed border-[#D5DCE5] hover:border-[#999999] rounded-[10px] p-[16px] flex flex-col justify-center items-center text-center cursor-pointer transition-all active:scale-[0.99] select-none group"
                      title="클릭하여 축하 메시지 남기기"
                    >
                      <span className="font-weddingday text-[18px] text-[#B0B8C2] group-hover:text-[#393939] block mb-1 transition-colors">
                        Best Wishes
                      </span>
                      <p className="font-nanumsquare text-[10.5px] text-[#A0A8B2] group-hover:text-[#666666] tracking-tight transition-colors">
                        따뜻한 축하를 남겨주세요 ✍️
                      </p>
                    </div>
                  ))}
                </div>

                <div className="w-full px-2 flex items-center justify-between text-[#999999] text-[8.5px] font-nanumsquare leading-none mt-[8px] select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px]">▶</span>
                    <span className="font-mono text-[9px]">32</span>
                  </div>
                  <span className="tracking-[0.14em] font-normal uppercase text-[8px]">
                    DESIGNED BY ATELIER DE MUKIRU
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px]">32</span>
                    <span className="text-[7px]">◀</span>
                  </div>
                </div>
              </div>

              {/* 페이지네이션 도트 */}
              <div className="flex items-center justify-center gap-0.5 mt-[10px] select-none">
                {[...Array(totalPages)].map((_, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setGuestbookPageIndex(pIdx)}
                    className="w-6 h-6 flex items-center justify-center cursor-pointer p-0 bg-transparent border-none"
                    aria-label={`방명록 페이지 ${pIdx + 1}`}
                  >
                    <span
                      className={`w-[6px] h-[6px] rounded-full transition-all ${
                        pIdx === (safePageIndex % totalPages)
                          ? 'bg-[#999999] scale-125'
                          : 'bg-[#D9D9D9] hover:bg-[#B0B0B0]'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* 글 남기기 버튼 */}
              <div className="mt-[26px] flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowGuestbookModal(true)}
                  style={{
                    boxShadow: '0px 4px 14.2px rgba(0, 0, 0, 0.09)',
                  }}
                  className="w-[134px] h-[39px] bg-[#393939] hover:bg-[#2c2c2c] active:scale-[0.98] rounded-full flex items-center justify-center transition-all cursor-pointer select-none"
                >
                  <span className="font-nanumsquare font-bold text-[14px] text-[#F3F3F3] leading-none tracking-tight">
                    글 남기기
                  </span>
                </button>
              </div>

              {/* 구분선 */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[65px] mb-[50px] mx-auto shrink-0" 
              />
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

          <h2 className="font-weddingday text-[37.5px] text-[#292929] leading-[72%] text-center select-none tracking-normal mt-[37.5px]">
            Thank you
          </h2>

          <p className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-[1.62] text-center mt-[40px] tracking-tight">
            함께해 주셔서 감사합니다.
          </p>

          <p className="font-nanumsquare font-normal text-[15px] text-[#999999] leading-[1.62] text-center mt-[10px] tracking-tight">
            {groomShort && brideShort 
              ? `${groomShort} · ${brideShort} 드림`
              : (groomName && brideName ? `${groomName} · ${brideName} 드림` : (isSample ? '민우 · 유진 드림' : '신랑 · 신부 드림'))}
          </p>

          {/* 공유 버튼 */}
          <div id="share-section" className="mt-14 mb-2 flex items-center justify-center gap-2.5 max-w-[340px] mx-auto px-4 select-none">
            <button
              type="button"
              onClick={handleKakaoShare}
              className="flex-1 py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] text-[12px] font-sans font-medium rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.708 4.8 4.27 6.054-.187.698-.675 2.528-.773 2.915-.121.482.177.476.372.346.154-.102 2.45-1.666 3.442-2.344.56.082 1.127.129 1.689.129 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
              </svg>
              <span>카카오톡 공유하기</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-3 px-5 border border-stone-200 hover:border-stone-400 bg-white text-stone-700 text-[12px] font-sans font-medium rounded-full hover:bg-stone-50 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              링크 복사
            </button>
          </div>

          <p className="font-sans font-normal text-[12px] leading-[1.62] text-[#999999] tracking-[0.05em] uppercase text-center mt-[48px] select-none">
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
  );
}
