'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
import TodayConciergeCard from '@/components/TodayConciergeCard';
import GuestPhotoSnapSection from '@/components/GuestPhotoSnapSection';
import EditorialContactModal from './EditorialContactModal';
import { renderParentPair } from '@/components/ParentDeceasedName';
import EditorialRsvpModal from './EditorialRsvpModal';
import EditorialGuestbookModal from './EditorialGuestbookModal';
import EditorialGuestbookDeleteModal from './EditorialGuestbookDeleteModal';
import EditorialGalleryModal from './EditorialGalleryModal';
import KakaoMap from '@/components/KakaoMap';
import EditorialIntro from './EditorialIntro';
import { supabase } from '@/lib/supabase';
import { getSafeKakaoShareImageUrl } from '@/lib/kakaoShare';

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

export default function EditorialTemplate({ invitation }) {
  // 1. 모달 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 2. 인트로 봉투 상태
  const [showIntro, setShowIntro] = useState(true);

  // 3. 계좌 아코디언 토글 (기본 펼쳐짐)
  const [openGroomAccount, setOpenGroomAccount] = useState(true);
  const [openBrideAccount, setOpenBrideAccount] = useState(true);

  // 4. 방명록 상태
  const [guestbookList, setGuestbookList] = useState([]);
  const [guestbookIndex, setGuestbookIndex] = useState(0);
  const [guestbookPageIndex, setGuestbookPageIndex] = useState(0);
  const guestbookTouchStartX = useRef(null);

  // 5. 갤러리 탭/인덱스 상태
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [activeAccountTab, setActiveAccountTab] = useState('groom'); // 'groom' | 'bride'


  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);
  const noticeTouchStartX = useRef(null);

  // 6. 데이터 언패킹 & fallback
  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  const showIntroSection = config.show_intro !== false;
  const showCountdownSection = config.show_countdown !== false;
  const showGallerySection = config.show_gallery !== false;
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;
  const showGuestbookSection = config.show_guestbook !== false;
  const showQuoteSection = config.show_quote_section !== false;

  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'editorial');

  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const coupleKo = [groomName, brideName].filter(Boolean).join(' · ');
  const coupleHeartText = [groomName, brideName].filter(Boolean).join(' ♥ ') || (isSample ? '기득 ♥ 민기' : '');

  // 대표 이미지 매핑 (실제 고객 청첩장에서는 미등록 사진이 타인의 샘플 사진으로 대체되지 않도록 철저히 차단)
  const mainImage = images.main || images.cover || invitation?.main_image || (isSample ? '/samples/main-02-editorial.jpg' : '');
  const bridePhoto = images.bride_profile || images.bride || extra.bride_profile_image || invitation?.bride_photo || (isSample ? '/samples/bride-solo.jpg' : '');
  const groomPhoto = images.groom_profile || images.groom || extra.groom_profile_image || invitation?.groom_photo || (isSample ? '/samples/groom-solo.jpg' : '');
  const couplePhoto = images.couple_profile || images.couple || extra.couple_profile_image || (isSample ? '/samples/couple-profile-01.jpg' : (mainImage || ''));
  const endingImage = images.ending || extra.ending_image || invitation?.ending_image || mainImage;

  // 갤러리 이미지 안전 파싱
  const galleryImages = useMemo(() => {
    const raw = invitation?.gallery_images;
    if (!raw) return [];
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
    return [];
  }, [invitation?.gallery_images]);

  // 날짜 계산
  const weddingDateStr = invitation?.wedding_date;
  const hasWeddingDate = Boolean(weddingDateStr);
  const targetDate = useMemo(() => {
    if (!weddingDateStr) return null;
    const normalized = typeof weddingDateStr === 'string' ? weddingDateStr.replace(' ', 'T') : weddingDateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }, [weddingDateStr]);

  // 카운트다운 타이머
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
        // 예식 전: 실시간 시/분/초 카운트다운 & 정확한 잔여 일수
        const totalSec = Math.max(0, Math.floor(diff / 1000));
        const hours = Math.floor((totalSec / 3600) % 24);
        const minutes = Math.floor((totalSec / 60) % 60);
        const seconds = totalSec % 60;
        setTimeLeft({ days: diffDayCount, hours, minutes, seconds, totalDays: diffDayCount, isPast: false, isToday: false });
      } else if (isSameDay) {
        // 당일 예식
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, isPast: false, isToday: true });
      } else {
        // 예식일 경과
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
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-based
    const weddingDay = targetDate.getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { year, month: month + 1, weddingDay, firstDayIndex, totalDays };
  }, [targetDate]);

  // 영문/한글 날짜 포맷
  const formattedDates = useMemo(() => {
    if (!targetDate) return { dateDot: '', monthName: '', dayNumber: '', yearNumber: '', timeStr: '', fullKo: '', dowEn: '' };
    const daysKo = ['일', '월', '화', '수', '목', '금', '토'];
    const daysEn = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const monthsEn = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth() + 1;
    const d = targetDate.getDate();
    const dowKo = daysKo[targetDate.getDay()];
    const dowEn = daysEn[targetDate.getDay()];
    const monthEn = monthsEn[targetDate.getMonth()];
    
    const hours = targetDate.getHours();
    const periodKo = hours < 12 ? '오전' : '오후';
    const periodEn = hours < 12 ? 'AM' : 'PM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const mins = targetDate.getMinutes();
    const minStr = mins > 0 ? ` ${mins}분` : '';
    const minStrEn = String(mins).padStart(2, '0');

    return {
      dateDot: `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`,
      dateSlash: `${String(m).padStart(2, '0')} / ${String(d).padStart(2, '0')}`,
      monthName: monthEn,
      dayNumber: String(d).padStart(2, '0'),
      yearNumber: String(y),
      timeStrKo: `${periodKo} ${displayHour}시${minStr}`,
      timeStrEn: `${displayHour}:${minStrEn} ${periodEn}`,
      fullKo: `${y}년 ${m}월 ${d}일 ${dowKo}요일 ${periodKo} ${displayHour}시${minStr}`,
      calendarHeaderDate: `${y}년 ${m}월 ${d}일 ${dowKo}요일 | ${periodKo} ${displayHour}시${minStr}`,
      dowEn,
      dowKo,
      headerDate: `${y} · ${String(m).padStart(2, '0')} · ${String(d).padStart(2, '0')}`,
    };
  }, [targetDate]);

      // 영문 풀네임 동적 계산 (에디토리얼 시그니처 - 신랑 & 신부 전체 영문명 우선 바인딩)
  const fullNamesEn = useMemo(() => {
    // 0) UI 시안 확인용 샘플 모드일 때는 샘플 주인공(강민준 & 박지민) 풀네임 고정
    if (isSample) {
      return 'Kang Min-jun & Park Ji-min';
    }
    // 1) main_names_en 명시 시 우선 사용
    if (invitation?.main_names_en) return invitation.main_names_en;
    if (extra?.main_names_en) return extra.main_names_en;
    // 2) 고객 입력 전체 영문명(groom_name_en & bride_name_en)
    if (invitation?.groom_name_en && invitation?.bride_name_en) {
      return `${invitation.groom_name_en} & ${invitation.bride_name_en}`;
    }
    // 3) first/last name 조합
    const groomFull = [invitation?.groom_last_name_en, invitation?.groom_first_name_en].filter(Boolean).join(' ') || invitation?.groom_name_en;
    const brideFull = [invitation?.bride_last_name_en, invitation?.bride_first_name_en].filter(Boolean).join(' ') || invitation?.bride_name_en;
    if (groomFull && brideFull) {
      return `${groomFull} & ${brideFull}`;
    }
    if (groomFull || brideFull) {
      return groomFull || brideFull;
    }
    // 4) 실제 고객 청첩장: 영문명이 없으면 가짜 샘플이 절대 노출되지 않도록 빈 문자열 반환
    return '';
  }, [invitation, extra, isSample]);

  // 하단 푸터 등에서 사용하는 영문/한글 복합 네임
  const displayNamesEn = fullNamesEn;

  // 부모님 성함 & 故 / 국화꽃 표기 포맷팅
  const deceasedMarker = config.deceased_marker || invitation?.deceased_marker || 'hanja';
  const isGroomFatherDeceased = invitation?.groom_father_deceased ?? config.groom_father_deceased ?? false;
  const isGroomMotherDeceased = invitation?.groom_mother_deceased ?? config.groom_mother_deceased ?? false;
  const isBrideFatherDeceased = invitation?.bride_father_deceased ?? config.bride_father_deceased ?? false;
  const isBrideMotherDeceased = invitation?.bride_mother_deceased ?? config.bride_mother_deceased ?? false;

  const groomRelation = invitation?.groom_relation || config.groom_relation || '';
  const brideRelation = invitation?.bride_relation || config.bride_relation || '';

  const groomParentsNode = renderParentPair({
    father: invitation?.groom_father || (isSample && !invitation?.groom_mother ? '강오진' : ''),
    isFatherDeceased: isGroomFatherDeceased,
    mother: invitation?.groom_mother || (isSample && !invitation?.groom_father ? '류창희' : ''),
    isMotherDeceased: isGroomMotherDeceased,
    markerType: deceasedMarker,
    separator: ' · ',
    iconClassName: 'w-[13px] h-[15px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0',
  });

  const brideParentsNode = renderParentPair({
    father: invitation?.bride_father || (isSample && !invitation?.bride_mother ? '장철규' : ''),
    isFatherDeceased: isBrideFatherDeceased,
    mother: invitation?.bride_mother || (isSample && !invitation?.bride_father ? '이정자' : ''),
    isMotherDeceased: isBrideMotherDeceased,
    markerType: deceasedMarker,
    separator: ' · ',
    iconClassName: 'w-[13px] h-[15px] inline-block align-[-2px] mr-1 text-stone-500 shrink-0',
  });

  // 안전한 혼주 및 성함 표시 (실제 고객 미입력 시 가짜 샘플 노출 차단)
  const displayGroomParents = groomParentsNode || (isSample ? '강오진 · 류창희' : null);
  const displayGroomRelation = groomRelation || (isSample ? '아들' : (groomParentsNode ? '장남' : ''));
  const displayGroomName = groomName || (isSample ? '강민준' : '');
  const hasGroomFamily = Boolean(displayGroomParents && displayGroomName);

  const displayBrideParents = brideParentsNode || (isSample ? '장철규 · 이정자' : null);
  const displayBrideRelation = brideRelation || (isSample ? '딸' : (brideParentsNode ? '장녀' : ''));
  const displayBrideName = brideName || (isSample ? '박지민' : '');
  const hasBrideFamily = Boolean(displayBrideParents && displayBrideName);

  // 세로 타이포그래피용 성함 (3글자면 성 제외한 이름, 그 외는 전체)
  const groomShort = invitation?.groom_name && invitation.groom_name.length === 3 ? invitation.groom_name.slice(1) : (invitation?.groom_name || '');
  const brideShort = invitation?.bride_name && invitation.bride_name.length === 3 ? invitation.bride_name.slice(1) : (invitation?.bride_name || '');

  const venueFullName = [invitation?.venue_name, invitation?.venue_hall || config?.venue_hall].filter(Boolean).join(' ');

  // 방명록 로드 & 자동 롤링
  useEffect(() => {
    if (!invitation?.id) return;
    async function loadGuestbook() {
      const { data, error } = await supabase
        .from('guestbook')
        .select('id, invitation_id, author, content, created_at')
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
    }, 4500);
    return () => clearInterval(timer);
  }, [guestbookList.length]);

  // 계좌 데이터 (JSON 문자열 안전 파싱 및 신랑/신부측 유연한 매칭)
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

  // 신랑측 계좌가 없고 신부측 계좌만 등록된 경우 신부측 탭 자동 우선 선택
  useEffect(() => {
    if (groomAccounts.length === 0 && brideAccounts.length > 0) {
      setActiveAccountTab('bride');
    }
  }, [groomAccounts.length, brideAccounts.length]);

  // 정보 카드 목록 (동적 배열 및 레거시 extra_data 완벽 호환)
  const infoCards = useMemo(() => {
    const raw = invitation?.info_notices;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const legacy = [];
    if (extra.meal_info) legacy.push({ title: '식사 안내', content: extra.meal_info });
    if (extra.shuttle_info) legacy.push({ title: '셔틀버스 안내', content: extra.shuttle_info });
    return legacy;
  }, [invitation?.info_notices, extra.meal_info, extra.shuttle_info]);

  // 교통편 목록 (동적 배열 및 레거시 extra_data 완벽 호환)
  const transportationList = useMemo(() => {
    const raw = invitation?.transportation;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const legacy = [];
    if (extra.transport_subway) legacy.push({ type: 'subway', title: '지하철', content: extra.transport_subway });
    if (extra.transport_bus) legacy.push({ type: 'bus', title: '버스', content: extra.transport_bus });
    if (extra.transport_car) legacy.push({ type: 'car', title: '자가용', content: extra.transport_car });
    if (extra.transport_parking) legacy.push({ type: 'parking', title: '주차 안내', content: extra.transport_parking });
    return legacy;
  }, [invitation?.transportation, extra.transport_subway, extra.transport_bus, extra.transport_car, extra.transport_parking]);

  // 공유 함수
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
    if (typeof window === 'undefined' || !window.Kakao) return;
    const coupleText = [invitation?.groom_name, invitation?.bride_name].filter(Boolean).join(' ♥ ');
    const shareTitle = coupleText ? `${coupleText} 결혼식에 초대합니다` : '소중한 결혼식에 초대합니다';
    const shareDesc = [formattedDates.fullKo, venueFullName].filter(Boolean).join(' | ');

    const shareImageUrl = getSafeKakaoShareImageUrl(
      mainImage || invitation?.images?.cover || invitation?.images?.main,
      'editorial'
    );
    const currentUrl = window.location.href;

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: shareDesc,
          imageUrl: shareImageUrl,
          imageWidth: 800,
          imageHeight: 1000,
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
    } catch (err) {
      console.error('카카오 공유 오류:', err);
    }
  };

  const handleCopyText = async (text, successMsg = '복사되었습니다.') => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert(successMsg);
        return;
      }
      throw new Error('Clipboard API not available');
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert(successMsg);
      } catch {
        alert('복사에 실패했습니다.');
      }
    }
  };

  const handleCopyAccount = (accountNum, label) => {
    handleCopyText(accountNum, `${label} 계좌번호가 복사되었습니다.`);
  };

  return (
    <div className="w-full max-w-[430px] bg-white text-[#191919] min-h-screen flex flex-col font-sans antialiased selection:bg-stone-300 relative mx-auto shadow-2xl">
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

      {/* 클래식 에디토리얼 전용 폰트 로드 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,600&family=Italiana&family=Alex+Brush&family=Noto+Serif+KR:wght@300;400;500;600&display=swap');
        @font-face {
          font-family: 'Bickham Script Pro';
          src: url('/fonts/BickhamScriptPro-Regular.woff') format('woff');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Bickham Script Pro';
          src: url('/fonts/BickhamScriptPro-Regular.woff') format('woff');
          font-weight: 400;
          font-style: italic;
          font-display: swap;
        }
        .font-editorial-serif {
          font-family: 'Cormorant Garamond', serif !important;
        }
        .font-editorial-title {
          font-family: 'Italiana', 'Cormorant Garamond', serif !important;
        }
        .font-korean-serif {
          font-family: 'Noto Serif KR', serif !important;
        }
        .font-bickham {
          font-family: 'Bickham Script Pro', cursive !important;
        }
      `}</style>

      {/* 예식 당일 안내 데스크 (당일 자동 전환) */}
      {(!showIntro || !showIntroSection) && (
        <TodayConciergeCard invitation={invitation} />
      )}

      {/* 0. 에디토리얼 매거진 룩북 인트로 커버 */}
      {showIntro && showIntroSection && (
        <EditorialIntro
          invitation={invitation}
          onOpen={() => {
            setShowIntro(false);
          }}
        />
      )}

      {/* 1. 에디토리얼 본문 첫 화면 (Figma 프레임 390 / 섹션1 780x1386 -> 1x 390x693 1:1 정밀 매칭) */}
      <section className="relative w-full flex flex-col items-center justify-start bg-[#FEFEFE] px-6 sm:px-7 pt-[28.5px] pb-[2px] select-none overflow-hidden">
        
        {/* 상단: 대표 화보 사진 (Figma image 736: 666x830 -> 1x 333x415, aspect-[666/830], top 57px -> 28.5px) */}
        <div className="w-full max-w-[333px] aspect-[666/830] bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center">
          {mainImage ? (
            <img
              src={mainImage}
              alt="Wedding Editorial Main"
              className="w-full h-full object-cover select-none"
              onError={(e) => {
                if (isSample && e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
                  e.currentTarget.src = '/samples/main-02-editorial.jpg';
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-6 text-center select-none bg-stone-50">
              <span className="font-weddingday text-[36px] text-stone-400 mb-1">Our Wedding</span>
              <span className="font-nanumsquare text-[11px] text-stone-400 tracking-wider">REPRESENTATIVE PHOTO</span>
            </div>
          )}
        </div>

        {/* 신랑 · 신부 성함 및 결혼 안내 (Figma: NanumSquare Neo OTF 30px -> 1x 15px #292929, 간격 71px -> 1x 35.5px) */}
        <h1 className="font-nanumsquare text-[15px] text-[#292929] font-normal leading-none tracking-tight text-center mt-[35.5px] shrink-0">
          {coupleKo ? `${coupleKo} 저희 결혼합니다.` : (isSample ? '강민준 · 박지민 저희 결혼합니다.' : '저희 결혼합니다.')}
        </h1>

        {/* 가로 구분선 (Figma Line: 너비 514px -> 1x 257px, 성함 아래 간격 44px -> 1x 22px, border: 0.5px solid #999999) */}
        <div 
          style={{ borderTop: '0.5px solid #999999' }}
          className="w-[257px] max-w-[70%] mt-[22px] shrink-0" 
        />

        {/* 예식 일시 (Figma: NanumSquare Neo OTF 24px -> 1x 12px #333333, 구분선 아래 간격 45px -> 1x 22.5px) */}
        {formattedDates.fullKo && (
          <p className="font-nanumsquare text-[12px] text-[#333333] font-normal leading-none tracking-tight text-center mt-[22.5px] shrink-0">
            {formattedDates.fullKo}
          </p>
        )}

        {/* 예식 장소 (Figma: NanumSquare Neo OTF 24px -> 1x 12px #666666, 날짜 아래 간격 42px -> 1x 21px) */}
        {venueFullName && (
          <p className="font-nanumsquare text-[12px] text-[#666666] font-normal leading-none tracking-tight text-center mt-[21px] shrink-0">
            {venueFullName}
          </p>
        )}

        {/* 하단: SCROLL TO OPEN 버튼 (Figma: 232.4x55.3 -> 1x 116.2x27.65, top 1303px, 장소 아래 간격 158px -> 1x 79px) */}
        <div className="mt-[79px] shrink-0">
          <button
            type="button"
            onClick={() => {
              const nextEl = document.getElementById('editorial-story-section');
              if (nextEl) {
                nextEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-[116.2px] h-[27.65px] bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer group shadow-2xs flex items-center justify-center gap-1 select-none"
            style={{ borderRadius: '50%', border: '0.5px solid #999999' }}
          >
            {/* Figma SCROLL TO OPEN: Bodoni 72 Bold 15.4px -> 1x 7.7px, tracking: 0.09em, #333333 */}
            <span className="font-bodoni font-bold text-[7.7px] tracking-[0.09em] text-[#333333] uppercase leading-none">
              SCROLL TO OPEN
            </span>
            <svg width="6" height="7" viewBox="0 0 6 7" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 transition-transform duration-200 group-hover:translate-y-0.5 ml-0.5">
              <path d="M3 0V5.5M3 5.5L0.8 3.3M3 5.5L5.2 3.3" stroke="#333333" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* 섹션 1 바닥 구분선 (Figma Line 138: 너비 561px -> 1x 280.5px, border: 0.5px solid #999999) */}
        <div 
          style={{ borderTop: '0.5px solid #999999' }}
          className="w-[280.5px] max-w-[75%] mt-[38px] mb-[38px] mx-auto shrink-0" 
        />
      </section>

      {/* 2. 에디토리얼 프로필 스프레드: 신부 & 신랑 단독 프로필 카드 & 혼주 정보 (Figma 섹션2: 780x1178 -> 1x 390x589 1:1 정밀 매칭) */}
      <section id="editorial-story-section" className="pt-[99.5px] pb-0 px-6 bg-[#FEFEFE] relative flex flex-col items-center select-none overflow-hidden">
        <ScrollReveal>
          {/* 상단 영문 필기체 헤더 (Figma: Weddingday Personal Use 55px -> 1x 27.5px, leading: 114%, #292929, height 128px -> 64px) */}
          <div className="text-center mb-[28px] select-none flex flex-col items-center justify-center min-h-[64px]">
            <p className="font-weddingday text-[27.5px] text-[#292929] tracking-normal leading-[1.14] select-none">
              Welcome to
            </p>
            <p className="font-weddingday text-[27.5px] text-[#292929] tracking-normal leading-[1.14] select-none mt-1 whitespace-nowrap">
              {isSample ? 'Jang Min-ki & Kwon Ki-deuk' : (fullNamesEn || coupleKo || '')}
            </p>
          </div>

          {/* 신부 & 신랑 2단 액자 카드 그리드 (Figma: 너비 662.7px -> 1x 331.35px, 카드 317.7x433.8 -> 158.85x216.9, gap 13.65px) */}
          <div className="w-[331.35px] max-w-full mx-auto grid grid-cols-2 gap-[13.65px]">
            {/* 좌측: 신부 카드 (Figma 2849:2734: 158.85x216.9px, 그림자 0px 2.7px 5.1px rgba(0,0,0,0.18), 사진 aspect-[283.5/315.9]) */}
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
                      if (isSample && e.currentTarget.src !== '/samples/bride-solo.jpg') {
                        e.currentTarget.src = '/samples/bride-solo.jpg';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 font-serif">
                    <span className="text-2xl mb-1">👰</span>
                    <span className="text-[11px] font-sans tracking-widest uppercase">Bride</span>
                  </div>
                )}
              </div>
              {/* 사진 아래: Bride. 박지민 (간격 37.48px -> 1x 18.74px, Bride 필기체, 박지민 NanumSquare Neo 14px) */}
              <div className="mt-[18.74px] w-full text-center flex items-center justify-center gap-2.5 select-none leading-none">
                <span className="font-weddingday text-[16px] text-[#999999] select-none pt-0.5">
                  Bride.
                </span>
                <span className="font-nanumsquare text-[14px] text-[#292929] font-normal tracking-tight">
                  {brideName || (isSample ? '박지민' : '')}
                </span>
              </div>
            </div>

            {/* 우측: 신랑 카드 (Figma 2849:2741: 158.85x216.9px, 그림자 0px 2.7px 5.1px rgba(0,0,0,0.18), 사진 aspect-[283.5/315.9]) */}
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
                      if (isSample && e.currentTarget.src !== '/samples/groom-solo.jpg') {
                        e.currentTarget.src = '/samples/groom-solo.jpg';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 font-serif">
                    <span className="text-2xl mb-1">🤵</span>
                    <span className="text-[11px] font-sans tracking-widest uppercase">Groom</span>
                  </div>
                )}
              </div>
              {/* 사진 아래: Groom. 강민준 (간격 37.48px -> 1x 18.74px, Groom 필기체, 강민준 NanumSquare Neo 14px) */}
              <div className="mt-[18.74px] w-full text-center flex items-center justify-center gap-2.5 select-none leading-none">
                <span className="font-weddingday text-[16px] text-[#999999] select-none pt-0.5">
                  Groom.
                </span>
                <span className="font-nanumsquare text-[14px] text-[#292929] font-normal tracking-tight">
                  {groomName || (isSample ? '강민준' : '')}
                </span>
              </div>
            </div>
          </div>

          {/* 혼주 정보 (Figma 시안 2 단아한 정렬 최적화: 국화/故 심볼 포함 시에도 줄바꿈 없이 한 줄로 단정하게 유지) */}
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

          {/* 섹션 2 바닥 공통 구분선 (인수인계서 필수 원칙: w-[280.5px], borderTop: 0.5px solid #999999) */}
          <div 
            style={{ borderTop: '0.5px solid #999999' }}
            className="w-[280.5px] max-w-[75%] mt-[70px] mb-[40px] mx-auto shrink-0" 
          />
        </ScrollReveal>
      </section>

      {/* 3. 에디토리얼 커플 화보 & 초대합니다 (Figma 섹션3: 780x1589 -> 1x 390x794.5 1:1 정밀 매칭) */}
      <section className="bg-[#FEFEFE] select-none overflow-hidden">
        <ScrollReveal>
          {/* 상단: 풀 와이드 커플 사진 화보 (Figma image 745: 780x576 -> 1x 390x288, aspect-[780/576]) */}
          {couplePhoto && (
            <div className="w-full aspect-[780/576] overflow-hidden bg-stone-100 select-none">
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
            </div>
          )}

          {/* 하단: 모시는 글 본문 (Figma 실측: 사진 아래 178px -> 1x 89px, 초대합니다 18px, 간격 86px -> 1x 43px, 본문 너비 256px, 버튼 아래 간격 160px -> 1x 80px) */}
          <div className="pt-[89px] pb-0 px-6 text-center flex flex-col items-center">
            {/* 제목: 초대합니다 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, line-height 26px -> 13px, #292929) */}
            <h2 className="font-nanumsquare text-[18px] text-[#292929] font-normal leading-none tracking-tight">
              {invitation?.message_title || config?.message_title || '초대합니다'}
            </h2>

            {/* 본문 초대글 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, 너비 512px -> 1x 256px, line-height 175% -> leading-[1.75], #333333, 간격 43px) */}
            {(invitation?.message || isSample) && (
              <div className="mt-[43px] w-[256px] max-w-full mx-auto font-nanumsquare text-[14px] text-[#333333] font-normal leading-[1.75] tracking-tight break-keep whitespace-pre-line text-center">
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

            {/* 연락하기 버튼 (Figma: 너비 327px -> 1x 163.5px, 높이 76px -> 1x 38px, bg #F4F3F1, border 1px #D3D3D3, rounded-full, mt 95px -> 1x 47.5px) */}
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

            {/* 섹션 3 바닥 구분선 (Figma Line 140: 섹션 1 바닥선과 100% 동일한 CSS 규격, 너비 280.5px, 버튼 아래 80px) */}
            <div 
              style={{ borderTop: '0.5px solid #999999' }}
              className="w-[280.5px] max-w-[75%] mt-[80px] mb-[40px] shrink-0" 
            />
          </div>
        </ScrollReveal>
      </section>

      {/* 4. 에디토리얼 캘린더 & 카운트다운 (Figma 4151px~5442px: 780x1291 -> 1x 390x645.5 1:1 정밀 매칭) */}
      {hasWeddingDate && calendarData && (
        <section className="w-full bg-[#FEFEFE] pt-[73.5px] pb-0 px-6 text-center select-none overflow-hidden">
          <ScrollReveal>
            {/* 상단 1: Wedding Day 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
            <h2
              className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal"
              style={{ fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive" }}
            >
              Wedding Day
            </h2>

            {/* 상단 2: 예식 일시 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #333333, mt-[34px]) */}
            <p className="mt-[34px] font-nanumsquare text-[14px] text-[#333333] text-center leading-none tracking-tight select-none">
              {formattedDates.calendarHeaderDate || `${formattedDates.yearNumber}년 ${calendarData.month}월 ${calendarData.weddingDay}일 ${formattedDates.dowKo}요일 | ${formattedDates.timeStrKo}`}
            </p>

            {/* 상단 3: 가로 구분선 (Figma Line 127: w-[639px] -> 1x 319.5px, border: 1px solid #999999, mt-[34.3px]) */}
            <div className="w-[319.5px] max-w-[85%] mx-auto border-t border-[#999999] mt-[34.3px]" />

            {/* 중앙: 캘린더 그리드 (Figma: 너비 602.6px -> 1x 301.3px 중앙 정렬, mt-[45px]) */}
            <div className="w-[301.3px] max-w-full mx-auto mt-[45px]">
              {/* 요일 헤더: 일(#F17171), 월~토(#666666) (Figma: NanumSquare Neo OTF 25.2px -> 1x 12.6px, mb-[16px]) */}
              <div className="grid grid-cols-7 text-center font-nanumsquare text-[12.6px] font-normal mb-[16px] select-none">
                <span className="text-[#F17171]">일</span>
                <span className="text-[#666666]">월</span>
                <span className="text-[#666666]">화</span>
                <span className="text-[#666666]">수</span>
                <span className="text-[#666666]">목</span>
                <span className="text-[#666666]">금</span>
                <span className="text-[#666666]">토</span>
              </div>

              {/* 날짜 숫자 그리드: 일요일(#F17171), 평일(#666666), 예식일(#454545 원형 + #F3F3F3) (Figma: Noto Sans KR 27px -> 1x 13.5px) */}
              <div className="grid grid-cols-7 text-center font-sans text-[13.5px] select-none">
                {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[36px]" />
                ))}

                {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                  const day = i + 1;
                  const isSunday = (calendarData.firstDayIndex + i) % 7 === 0;
                  const isWeddingDay = day === calendarData.weddingDay;

                  return (
                    <div key={day} className="flex items-center justify-center h-[36px]">
                      {isWeddingDay ? (
                        <span className="w-[33.3px] h-[34.65px] rounded-full bg-[#454545] text-[#F3F3F3] flex items-center justify-center font-normal shadow-xs">
                          {day}
                        </span>
                      ) : (
                        <span className={isSunday ? 'text-[#F17171]' : 'text-[#666666]'}>
                          {day}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 하단: 카운트다운 타이머 & D-day 문구 */}
            {showCountdownSection && (
              <div className="mt-[46px] w-[301.3px] max-w-full mx-auto">
                {/* 카운트다운 4개 사각 박스 (Figma: 138.6px x 138.6px -> 1x 69.3px x 69.3px, bg #F6F5F5, shadow, rounded-[6.3px], gap 8px) */}
                <div className="grid grid-cols-4 gap-[8px] text-center select-none">
                  {[
                    { label: 'DAYS', val: timeLeft.days },
                    { label: 'HOURS', val: timeLeft.hours },
                    { label: 'MINUTES', val: timeLeft.minutes },
                    { label: 'SECONDS', val: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{ boxShadow: '0px 3.5px 3.2px rgba(147, 147, 147, 0.22)' }}
                      className="w-[69.3px] h-[69.3px] max-w-full bg-[#F6F5F5] rounded-[6.3px] flex flex-col items-center justify-center mx-auto"
                    >
                      <span className="font-bodoni text-[10.8px] text-[#666666] tracking-[0.04em] uppercase leading-none select-none">
                        {item.label}
                      </span>
                      <span className="font-bodoni text-[22.5px] text-[#535353] leading-none tabular-nums font-normal select-none mt-[8px]">
                        {String(item.val).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 하단 D-day 문구 (Figma: mt-[33.3px], NanumSquare Neo OTF 28px -> 1x 14px, #333333, #F17171 강조) */}
                <p className="mt-[33.3px] font-nanumsquare text-[14px] text-[#333333] tracking-tight text-center select-none">
                  {isSample ? (
                    <>
                      기득 <span className="text-[#F17171] mx-0.5">♥</span> 민기님의 결혼식이{' '}
                      <span className="text-[#F17171] font-medium">{timeLeft.totalDays || 120}일</span> 남았습니다.
                    </>
                  ) : (
                    <>
                      {groomName && brideName ? (<>{groomName} <span className="text-[#F17171] mx-0.5">♥</span> {brideName}님의</>) : coupleKo ? (<>{coupleKo}님의</>) : (<>두 사람의</>)} 결혼식이{' '}
                      {timeLeft.isToday ? (
                        <>오늘 <span className="text-[#F17171] font-medium">축복 속에</span> 시작됩니다.</>
                      ) : timeLeft.isPast ? (
                        <>결혼한 지 <span className="text-[#F17171] font-medium">{timeLeft.totalDays}일</span>째 되는 날입니다.</>
                      ) : (
                        <><span className="text-[#F17171] font-medium">{timeLeft.totalDays}일</span> 남았습니다.</>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}

            {/* 캘린더 섹션 바닥 구분선 (Figma: 섹션 1 및 섹션 3 바닥선과 100% 동일한 CSS 규격, 너비 280.5px, border: 0.5px solid #999999) */}
            <div 
              style={{ borderTop: '0.5px solid #999999' }}
              className="w-[280.5px] max-w-[75%] mt-[73px] mb-[40px] mx-auto shrink-0" 
            />
          </ScrollReveal>
        </section>
      )}

      {/* 5. 에디토리얼 화보 갤러리 (Figma Rectangle 6225: 780x1622 -> 1x 390x811, background: #FEFEFE) */}
      {showGallerySection && galleryImages.length > 0 && (
        <section className="w-full bg-[#FEFEFE] pt-[71px] pb-0 px-6 text-center select-none overflow-hidden">
          <ScrollReveal>
            {/* 상단 1: gallery 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%], mb-[34.5px]) */}
            <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal mb-[34.5px]">
              gallery
            </h2>
            {/* 상단 2: 사진 갤러리 (Figma: NanumSquare Neo OTF 400 36px -> 1x 18px, line-height 72% box 26px -> 1x 13px, #292929, mb-[53px]) */}
            <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mb-[53px] tracking-tight">
              사진 갤러리
            </p>

            {/* 메인 화보 대형 컷 (Figma image 736: 666x830 2x -> 333x415 1x, left: calc(50% - 333px/2)) */}
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
                  if (isSample && e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
                    e.currentTarget.src = '/samples/main-02-editorial.jpg';
                  }
                }}
              />
            </div>

            {/* 썸네일 그리드 (Figma Group 1183: 145.8x145.8 2x -> 1x 72.9x72.9 정사각형 4개, 간격 정렬) */}
            <div className="w-[333px] mx-auto flex items-center justify-between mb-[40.6px]">
              {galleryImages.slice(0, 4).map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`w-[72.9px] h-[72.9px] shrink-0 aspect-square overflow-hidden cursor-pointer transition-all ${
                    idx === activeGalleryIndex
                      ? 'ring-1 ring-[#333333] opacity-100'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`갤러리 사진 ${idx + 1}번 보기`}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (isSample && e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
                        e.currentTarget.src = '/samples/main-02-editorial.jpg';
                      }
                    }}
                  />
                </button>
              ))}
            </div>

            {/* 하단 타원형 룩북 버튼 (Figma Ellipse 749: 332x79 2x -> 166x39.5 1x, border: 1px solid #999999, borderRadius: 50%) */}
            <button
              type="button"
              onClick={() => {
                setGalleryModalIndex(0);
                setGalleryModalOpen(true);
              }}
              style={{ borderRadius: '50%' }}
              className="w-[166px] h-[39.5px] border border-[#999999] hover:border-[#333333] flex items-center justify-center gap-1 mx-auto hover:bg-stone-50/80 active:scale-[0.98] transition-all cursor-pointer select-none"
            >
              {/* Figma VIEW THE LOOKBOOK: Bodoni 72 Bold 22px 2x -> cap-height 매칭 text-[9.5px], tracking-[0.02em], #333333 */}
              <span className="font-bodoni font-bold text-[9.5px] text-[#333333] tracking-[0.02em] uppercase leading-none">
                VIEW THE LOOKBOOK
              </span>
              <svg width="11" height="7" viewBox="0 0 11 7" fill="none" className="shrink-0 text-[#333333] ml-0.5">
                <path d="M0.5 3.5H9.5M9.5 3.5L7 1M9.5 3.5L7 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* 갤러리 섹션 바닥 구분선 (Figma: 섹션 공통 구분선 규격, w-[280.5px] max-w-[75%], border: 0.5px solid #999999) */}
            <div 
              style={{ borderTop: '0.5px solid #999999' }}
              className="w-[280.5px] max-w-[75%] mt-[60px] mb-[40px] mx-auto shrink-0" 
            />
          </ScrollReveal>
        </section>
      )}

      {/* 6. 식장 위치 및 오시는 길 안내 (Figma 7064px~8911px: 780x1847 -> 1x 390x923.5 1:1 정밀 매칭) */}
      {(invitation?.venue_name || invitation?.venue_address || isSample) && (
        <section className="w-full bg-[#FEFEFE] pt-[64.5px] pb-0 px-6 text-center select-none overflow-hidden">
          <ScrollReveal>
            {/* 상단 1: location 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
            <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
              location
            </h2>

            {/* 상단 2: 식장 위치 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, #292929, mt-[34.5px]) */}
            <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
              식장 위치
            </p>

            {/* 상단 3: 웨딩홀 명칭 (Figma: NanumSquare Neo OTF 30px -> 1x 15px, #333333, mt-[43px]) */}
            <h3 className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none text-center mt-[43px] tracking-tight">
              {venueFullName || (isSample ? '호텔금오산 컨벤션센터' : '')}
            </h3>

            {/* 상단 4: 식장 주소 & 주소 복사 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #999999, mt-[23.5px]) */}
            <div className="mt-[23.5px] flex items-center justify-center gap-1">
              <span className="font-nanumsquare font-normal text-[14px] text-[#999999] leading-none tracking-tight">
                {invitation?.venue_address || (isSample ? '경북 구미시 금오산로 400' : '')}
              </span>
              <button
                type="button"
                onClick={() => {
                  const addr = invitation?.venue_address || (isSample ? '경북 구미시 금오산로 400' : '');
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

            {/* 지도 컴포넌트 (Figma: 607x433 -> 1x 303.5x216.5, mt-[40.5px]) */}
            <div className="mt-[40.5px] w-[303.5px] h-[216.5px] max-w-full mx-auto overflow-hidden bg-stone-100 border border-stone-200">
              <KakaoMap
                address={invitation?.venue_address || (isSample ? '경북 구미시 금오산로 400' : '')}
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
                  const query = venueFullName || invitation?.venue_address || (isSample ? '호텔금오산 컨벤션센터' : '');
                  window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank');
                }}
                style={{ boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.11)' }}
                className="w-[143.5px] h-[38px] bg-[#F5F4F4] hover:bg-[#eceae7] active:scale-[0.98] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
              >
                <span className="font-nanumsquare font-normal text-[14px] text-[#666666] tracking-tight">
                  네이버 지도
                </span>
                {/* 네이버 지도 심볼 아이콘 */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <rect width="24" height="24" rx="5" fill="#03C75A"/>
                  <path d="M7 6H10.2L13.8 12.3V6H17V18H13.8L10.2 11.7V18H7V6Z" fill="white"/>
                </svg>
              </button>

              {/* 카카오내비 버튼 */}
              <button
                type="button"
                onClick={() => {
                  const query = venueFullName || invitation?.venue_address || (isSample ? '호텔금오산 컨벤션센터' : '');
                  window.open(`https://map.kakao.com/link/search/${encodeURIComponent(query)}`, '_blank');
                }}
                style={{ boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.11)' }}
                className="w-[143.5px] h-[38px] bg-[#F5F4F4] hover:bg-[#eceae7] active:scale-[0.98] rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
              >
                <span className="font-nanumsquare font-normal text-[14px] text-[#666666] tracking-tight">
                  카카오내비
                </span>
                {/* 카카오내비 심볼 아이콘 */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
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
                /* 피그마 시안 2 기본 오시는 길 안내 */
                <div>
                  {/* 지하철 블록 */}
                  <div>
                    <h4 className="font-nanumsquare font-bold text-[14px] text-[#333333] mb-3 leading-none">
                      지하철
                    </h4>
                    <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed">
                      <span className="text-[#407550] mr-1">7호선</span>강남구청역 3-1번 출구
                    </p>
                    <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed">
                      <span className="text-[#C79126] mr-1">분당선</span>강남구청역 3-1번 출구
                    </p>
                    <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed mt-2">
                      좌측 방향 570M 도보 후 좌측 건물
                    </p>
                  </div>

                  {/* 지하철과 버스 사이에 구분선 (Figma: 553px -> 1x 276.5px, border: 0.5px solid #999999) */}
                  <div style={{ borderTop: '0.5px solid #999999' }} className="w-full my-[24px]" />

                  {/* 버스 블록 */}
                  <div>
                    <h4 className="font-nanumsquare font-bold text-[14px] text-[#333333] mb-3 leading-none">
                      버스
                    </h4>
                    <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed">
                      <span className="text-[#5B86BF]">간선버스</span> : 342, 465, 786
                    </p>
                    <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed">
                      <span className="text-[#71AB67]">지선버스</span> : 1234, 5678
                    </p>
                    <p className="font-nanumsquare font-normal text-[13px] text-[#666666] leading-relaxed mt-2">
                      셔틀버스 수시 운행
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            )}

            {/* 식장 위치 섹션 바닥 공통 구분선 (인수인계서 필수 탑재 규격: w-[280.5px], borderTop: 0.5px solid #999999) */}
            <div 
              style={{ borderTop: '0.5px solid #999999' }}
              className="w-[280.5px] max-w-[75%] mt-[40px] mb-[40px] mx-auto shrink-0" 
            />
          </ScrollReveal>
        </section>
      )}

      {/* 7. 마음 전하실 곳 (Figma 8951px~10327px: 780x1376 -> 1x 390x688 1:1 정밀 매칭) */}
      {showAccountsSection && (groomAccounts.length > 0 || brideAccounts.length > 0 || isSample) && (() => {
        const currentAccounts = activeAccountTab === 'groom' ? groomAccounts : brideAccounts;
        const sampleAccounts = activeAccountTab === 'groom'
          ? [
              { relation: '신랑', holder: isSample ? '예금주' : (groomName || '예금주'), bank: '하나은행', number: '504-910579-89707' },
              { relation: '신랑', holder: isSample ? '예금주' : (groomName || '예금주'), bank: '하나은행', number: '504-910579-89707' },
              { relation: '신랑', holder: isSample ? '예금주' : (groomName || '예금주'), bank: '하나은행', number: '504-910579-89707' },
            ]
          : [
              { relation: '신부', holder: isSample ? '예금주' : (brideName || '예금주'), bank: '하나은행', number: '504-910579-89707' },
              { relation: '신부', holder: isSample ? '예금주' : (brideName || '예금주'), bank: '하나은행', number: '504-910579-89707' },
              { relation: '신부', holder: isSample ? '예금주' : (brideName || '예금주'), bank: '하나은행', number: '504-910579-89707' },
            ];
        const displayAccounts = currentAccounts.length > 0 ? currentAccounts : (isSample ? sampleAccounts : []);

        return (
          <section className="w-full bg-[#FEFEFE] pt-[89px] pb-0 px-6 text-center select-none overflow-hidden">
            <ScrollReveal>
              {/* 상단 1: Account 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
              <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
                Account
              </h2>

              {/* 상단 2: 마음 전하실 곳 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, #292929, mt-[34.5px]) */}
              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                마음 전하실 곳
              </p>

              {/* 상단 3: 축복의 마음을 담아 축의금을 전달하실 수 있습니다. (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #333333, leading-[174%], mt-[43px]) */}
              <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.74] text-center mt-[43px] tracking-tight whitespace-pre-line">
                축복의 마음을 담아 축의금을{`\n`}전달하실 수 있습니다.
              </p>

              {/* 중앙: 파일철 탭 카드 (Figma: 너비 630px -> 1x 315px, mt-[46.5px], 그림자, 신랑측/신부측 탭) */}
              <div className="w-[315px] max-w-full mx-auto mt-[46.5px] text-left">
                {/* 탭 헤더 (파일철 인덱스 형태) */}
                <div className="flex items-end">
                  {/* 신랑측 탭 버튼 */}
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

                  {/* 신부측 탭 버튼 */}
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

                {/* 탭 본체 카드 (Figma: bg #F5F4F4, rounded-b-[12px], 그림자) */}
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
                              {/* 좌측 정보: 관계 + 예금주, 아래 은행+계좌 */}
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

                              {/* 우측 복사하기 버튼 (Figma: w-[161px] -> 1x 80.5px, h-[52px] -> 1x 26px, bg-white, border, rounded-full) */}
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

                            {/* 계좌간의 구분선 (Figma: 너비 553px -> 1x 276.5px, border: 0.5px solid #999999) */}
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

              {/* 마음 전하실 곳 섹션 바닥 공통 구분선 (인수인계서 필수 탑재 규격: w-[280.5px], borderTop: 0.5px solid #999999) */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[60px] mb-[45px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        );
      })()}

      {/* 8. Notice 안내사항 (Figma 섹션 10339px~11518px: 780x1179 -> 1x 390x589.5 1:1 정밀 매칭) */}
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
              {/* 상단 1: Notice 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
              <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
                Notice
              </h2>

              {/* 상단 2: 안내 사항 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, #292929, mt-[34.5px]) */}
              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                안내 사항
              </p>

              {/* 중앙: 필름 스트립 프레임 영역 (Figma: 10822px, bg #DDE7F3, mt-[39px], 실측 1x 305px 파스텔 블루 필름) */}
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
                {/* 상단 필름 바: 2, DESIGNED BY ATELIER DE MUKIRU (Figma: NanumSquare Neo 800 10px #FFFFFF), 3 */}
                <div className="w-full max-w-[390px] px-6 flex justify-between items-center text-white select-none mb-[8px]">
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">2</span>
                  <span className="font-nanumsquare font-extrabold text-[10px] text-white tracking-[0.05em] leading-none uppercase text-center">
                    DESIGNED BY ATELIER DE MUKIRU
                  </span>
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">3</span>
                </div>

                {/* 상단 퍼포레이션 구멍 열 (Figma: 너비 38px 높이 46px -> 1x 19x23px, #F5F5F5, radius 8.1px -> 4.05px) */}
                <div className="w-full max-w-[390px] px-3 flex justify-between items-center select-none">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-[19px] h-[23px] bg-[#F5F5F5] rounded-[4px] shrink-0" />
                  ))}
                </div>

                {/* 중앙 프레임 영역 (좌측 잘린 프레임 + 중앙 메인 카드 + 우측 잘린 프레임) */}
                <div className="w-full max-w-[390px] flex items-center justify-center gap-[12px] my-[13px] select-none">
                  {/* 좌측 프레임 가장자리 (여러 장일 땐 클릭 시 이전 카드로 이동) */}
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

                  {/* 중앙 메인 안내 카드 (터치 스와이프 지원 및 부드러운 전환) */}
                  <div 
                    key={activeNoticeIndex}
                    className="w-[276px] min-h-[210px] bg-white rounded-[10px] py-[28px] px-[18px] flex flex-col items-center justify-center text-center shrink-0 shadow-xs transition-all duration-200 animate-in fade-in"
                  >
                    {/* 카드 제목 */}
                    <h3 className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-none text-center tracking-tight">
                      {currentNotice.title || '식사 안내'}
                    </h3>

                    {/* 식사안내 제목과 내용 사이 구분선 (Figma: width 478px -> 1x 239px, border: 0.5px solid #929292) */}
                    <div 
                      style={{ borderTop: '0.5px solid #929292' }} 
                      className="w-[239px] max-w-full my-[17px]" 
                    />

                    {/* 카드 내용 */}
                    <p className="font-nanumsquare font-normal text-[12px] text-[#333333] leading-[1.78] text-center tracking-tight whitespace-pre-line">
                      {currentNotice.content || ''}
                    </p>

                    {/* 카드가 2개 이상일 때 인디케이터 도트 */}
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

                  {/* 우측 프레임 가장자리 (여러 장일 땐 클릭 시 다음 카드로 이동) */}
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

                {/* 하단 퍼포레이션 구멍 열 (10개, #F5F5F5) */}
                <div className="w-full max-w-[390px] px-3 flex justify-between items-center select-none">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-[19px] h-[23px] bg-[#F5F5F5] rounded-[4px] shrink-0" />
                  ))}
                </div>

                {/* 하단 필름 바: 6, 7 */}
                <div className="w-full max-w-[390px] px-6 flex justify-between items-center text-white select-none mt-[8px]">
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">6</span>
                  <span className="font-nanumsquare text-[11px] font-extrabold w-[24px] text-center">7</span>
                </div>
              </div>

              {/* 안내 사항 섹션 바닥 공통 구분선 (인수인계서 필수 원칙: w-[280.5px], borderTop: 0.5px solid #999999) */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[55px] mb-[45px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        );
      })()}

      {/* 9. 참석 의사 (RSVP - Figma 섹션 11548px~12513px: 780x965 -> 1x 390x482.5 1:1 정밀 매칭) */}
      {showRsvpSection && (
        <section className="w-full bg-[#FEFEFE] pt-[96.5px] pb-0 text-center select-none overflow-hidden">
          <ScrollReveal>
            {/* 상단 1: R·S·V·P 영문 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
            <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
              R·S·V·P
            </h2>

            {/* 상단 2: 참석 의사 전달 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, #292929, mt-[34.5px]) */}
            <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
              참석 의사 전달
            </p>

            {/* 상단 3: 안내 문구 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #333333, leading-[1.74], mt-[45px]) */}
            <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.74] text-center mt-[45px] tracking-tight whitespace-pre-line max-w-[280px] mx-auto">
              소중한 분들과 함께하는 뜻깊은 날,{`\n`}
              정성껏 모실 수 있도록{`\n`}
              참석 여부를 알려주시면 감사하겠습니다.
            </p>

            {/* 하단 버튼: 참석 정보 전달하기 (Figma: 329x78 -> 1x 164.5x39, bg #393939, rounded-full, mt-[59.5px]) */}
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

            {/* 참석 의사 전달 섹션 바닥 공통 구분선 (인수인계서 필수 원칙: w-[280.5px], borderTop: 0.5px solid #999999) */}
            <div 
              style={{ borderTop: '0.5px solid #999999' }}
              className="w-[280.5px] max-w-[75%] mt-[65px] mb-[46.5px] mx-auto shrink-0" 
            />
          </ScrollReveal>
        </section>
      )}

      {/* 09-2. 하객 현장 사진 선물 섹션 */}
      <GuestPhotoSnapSection invitation={invitation} isEditorial={true} />

      {/* 10. 축하 메시지 (Guestbook - Figma 섹션 13716px~15279px: 780x1563 -> 1x 390x781.5 1:1 정밀 매칭) */}
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
        // 삭제 등으로 인해 페이지가 초과되었을 때 빈 화면에 갇히지 않도록 안전 보정
        const safePageIndex = Math.min(guestbookPageIndex, Math.max(0, totalPages - 1));
        const currentFour = displayList.slice(safePageIndex * 4, safePageIndex * 4 + 4);

        return (
          <section className="w-full bg-[#FEFEFE] pt-[91px] pb-0 text-center select-none overflow-hidden">
            <ScrollReveal>
              {/* 상단 1: Guestbook 필기체 (Figma: Weddingday Personal Use 70px -> 1x 35px, #292929, leading-[72%]) */}
              <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal">
                Guestbook
              </h2>

              {/* 상단 2: 방명록 (Figma: NanumSquare Neo OTF 36px -> 1x 18px, #292929, mt-[34.5px]) */}
              <p className="font-nanumsquare font-normal text-[18px] text-[#292929] leading-none text-center mt-[34.5px] tracking-tight">
                방명록
              </p>

              {/* 상단 3: 감성 안내 문구 (Figma: NanumSquare Neo OTF 28px -> 1x 14px, #333333, leading-[1.72], mt-[43px]) */}
              <p className="font-nanumsquare font-normal text-[14px] text-[#333333] leading-[1.72] text-center mt-[43px] tracking-tight whitespace-pre-line max-w-[280px] mx-auto">
                두 사람의 새로운 시작에{`\n`}
                따뜻한 축복을 남겨주세요.
              </p>

              {/* 중앙: 방명록 4컷 프레임 영역 (Figma: 너비 700px -> 1x 350px, 배경 #E6EDF5, rounded-[14px], mt-[29px]) */}
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
                {/* 프레임 상단 레터링 바 (Figma: DESIGNED BY ATELIER DE MUKIRU & 화살표 + 32) */}
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

                {/* 4컷 2x2 그리드 (Figma: 각 카드 308x317 -> 1x 154x158.5px, bg #FEFEFE, rounded-[10px]) */}
                <div className="grid grid-cols-2 gap-[8px] w-full">
                  {currentFour.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="w-full min-h-[155px] bg-[#FEFEFE] rounded-[10px] py-[16px] px-[12px] flex flex-col justify-between items-center text-center shadow-2xs"
                    >
                      {/* 본문 메시지 (Figma: NanumSquare Neo OTF 23px -> 1x 11.5px, #333333, leading-[1.78]) */}
                      <div className="flex-1 flex items-center justify-center w-full">
                        <p className="font-nanumsquare font-normal text-[11.5px] text-[#333333] leading-[1.78] whitespace-pre-line tracking-tight text-center line-clamp-4">
                          {item.content}
                        </p>
                      </div>

                      {/* 구분선 (Figma: width 199px -> 1x 99.5px, border: 0.5px solid #999999) */}
                      <div 
                        style={{ borderTop: '0.5px solid #999999' }} 
                        className="w-[99.5px] max-w-[80%] my-[9px] shrink-0" 
                      />

                      {/* 작성자 & 삭제 휴지통 아이콘 (Figma: NanumSquare Neo OTF 24px -> 1x 12px, #999999) */}
                      <div className="w-full flex items-center justify-center gap-1.5 shrink-0">
                        <span className="font-nanumsquare font-normal text-[12px] text-[#999999] leading-none tracking-tight">
                          {item.author || item.name || '하객'}
                        </span>
                        {/* 삭제 휴지통 버튼 */}
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

                  {/* 메시지가 4개 미만일 때 빈 카드 채우기 (피그마 4컷 그리드 대칭 유지 + 클릭 시 작성 모달 오픈 유도) */}
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

                {/* 프레임 하단 레터링 바 (Figma: DESIGNED BY ATELIER DE MUKIRU & 화살표 + 32) */}
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

              {/* 페이지네이션 도트 (모바일 터치 영역 24px 확장 및 스케일 애니메이션) */}
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

              {/* 하단 글 남기기 알약 버튼 (Figma: 268x78 -> 1x 134x39, bg #393939, text 14px bold #F3F3F3, mt-[26px]) */}
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

              {/* 방명록 섹션 바닥 공통 구분선 (인수인계서 필수 원칙: w-[280.5px], borderTop: 0.5px solid #999999, mt-[65px] mb-[50px]) */}
              <div 
                style={{ borderTop: '0.5px solid #999999' }}
                className="w-[280.5px] max-w-[75%] mt-[65px] mb-[50px] mx-auto shrink-0" 
              />
            </ScrollReveal>
          </section>
        );
      })()}

      {/* 11. 엔딩 사진 & 감사 인사 (Figma 섹션 15350px~16696px: 780x1346 -> 1x 390x673, bg #FEFEFE) */}
      <section className="w-full bg-[#FEFEFE] pt-0 pb-[50px] text-center select-none overflow-hidden relative">
        <ScrollReveal duration={1000}>
          {/* 상단: 풀 와이드 엔딩 화보 사진 (Figma: width 780px, height 581.27px -> 1x 390x290.64, aspect-[780/581.27]) */}
          <div className="w-full aspect-[780/581.27] overflow-hidden bg-stone-100 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={endingImage || couplePhoto || mainImage}
              alt="Wedding Ending"
              className="w-full h-full object-cover object-center select-none"
              onError={(e) => {
                if (isSample && e.currentTarget.src !== '/samples/couple-profile-01.jpg') {
                  e.currentTarget.src = '/samples/couple-profile-01.jpg';
                }
              }}
            />
          </div>

          {/* 중앙 1: Thank you 영문 필기체 (Figma: Weddingday Personal Use 75px -> 1x 37.5px, #292929, leading-[72%], mt-[37.5px]) */}
          <h2 className="font-weddingday text-[37.5px] text-[#292929] leading-[72%] text-center select-none tracking-normal mt-[37.5px]">
            Thank you
          </h2>

          {/* 중앙 2: 함께해 주셔서 감사합니다. (Figma: NanumSquare Neo OTF 30px -> 1x 15px, #333333, leading-[162%], mt-[40px]) */}
          <p className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-[1.62] text-center mt-[40px] tracking-tight">
            함께해 주셔서 감사합니다.
          </p>

          {/* 중앙 3: 민준 · 지민 드림 (Figma: NanumSquare Neo OTF 30px -> 1x 15px, #999999, leading-[162%], mt-[10px]) */}
          <p className="font-nanumsquare font-normal text-[15px] text-[#999999] leading-[1.62] text-center mt-[10px] tracking-tight">
            {groomShort && brideShort 
              ? `${groomShort} · ${brideShort} 드림`
              : (groomName && brideName ? `${groomName} · ${brideName} 드림` : (isSample ? '민준 · 지민 드림' : '신랑 · 신부 드림'))}
          </p>

          {/* 하단 브랜드 로고: DESIGNED BY ATELIER DE MUKIRU (Figma top: 16557px -> Poppins 24px -> 1x 12px, line-height: 162%, #999999, mt-[95px]) */}
          <p className="font-sans font-normal text-[12px] leading-[1.62] text-[#999999] tracking-[0.05em] uppercase text-center mt-[95px] select-none">
            DESIGNED BY ATELIER DE MUKIRU
          </p>
        </ScrollReveal>
      </section>

      {/* 12. 하단 고정 공유 바 (카카오톡 공유 & 링크 복사) */}
      <div className="sticky bottom-0 z-40 w-full max-w-[430px] mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200 px-5 py-3.5 flex items-center justify-between gap-3 shadow-lg">
        <button
          type="button"
          onClick={handleKakaoShare}
          className="flex-1 py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] text-[12px] font-serif font-medium rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.708 4.8 4.27 6.054-.187.698-.675 2.528-.773 2.915-.121.482.177.476.372.346.154-.102 2.45-1.666 3.442-2.344.56.082 1.127.129 1.689.129 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
          </svg>
          <span>카카오톡 공유하기</span>
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="py-3 px-5 border border-stone-300 hover:border-stone-900 text-stone-800 text-[12px] font-serif font-medium rounded-full hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
        >
          링크 복사
        </button>
      </div>

      {/* 시안 2 전용 에디토리얼 팝업 모달 */}
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
