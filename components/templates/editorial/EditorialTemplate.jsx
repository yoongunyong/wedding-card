'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
import TodayConciergeCard from '@/components/TodayConciergeCard';
import GuestPhotoSnapSection from '@/components/GuestPhotoSnapSection';
import EditorialContactModal from './EditorialContactModal';
import EditorialRsvpModal from './EditorialRsvpModal';
import EditorialGuestbookModal from './EditorialGuestbookModal';
import EditorialGuestbookDeleteModal from './EditorialGuestbookDeleteModal';
import EditorialGalleryModal from './EditorialGalleryModal';
import KakaoMap from '@/components/KakaoMap';
import EditorialIntro from './EditorialIntro';
import { supabase } from '@/lib/supabase';
import { getSafeKakaoShareImageUrl } from '@/lib/kakaoShare';

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

  // 5. 갤러리 탭/인덱스 상태
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

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
      
      const isSameDay =
        targetDate.getFullYear() === now.getFullYear() &&
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getDate() === now.getDate();

      if (diff > 0) {
        // 예식 전: 실시간 카운트다운
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, totalDays: days, isPast: false, isToday: isSameDay });
      } else if (isSameDay) {
        // 당일 예식 시간 경과
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, isPast: false, isToday: true });
      } else {
        // 예식일 경과
        const pastDiff = Math.abs(diff);
        const pastDays = Math.floor(pastDiff / (1000 * 60 * 60 * 24));
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

  // 부모님 성함 & 故 표기 포맷팅
  const formatParentName = (name, isDeceased) => {
    if (!name) return '';
    return isDeceased ? `故 ${name}` : name;
  };
  const isGroomFatherDeceased = invitation?.groom_father_deceased ?? config.groom_father_deceased ?? false;
  const isGroomMotherDeceased = invitation?.groom_mother_deceased ?? config.groom_mother_deceased ?? false;
  const groomFatherText = formatParentName(invitation?.groom_father, isGroomFatherDeceased);
  const groomMotherText = formatParentName(invitation?.groom_mother, isGroomMotherDeceased);
  const groomParents = [groomFatherText, groomMotherText].filter(Boolean).join(' · ');
  const groomRelation = invitation?.groom_relation || config.groom_relation || '';

  const isBrideFatherDeceased = invitation?.bride_father_deceased ?? config.bride_father_deceased ?? false;
  const isBrideMotherDeceased = invitation?.bride_mother_deceased ?? config.bride_mother_deceased ?? false;
  const brideFatherText = formatParentName(invitation?.bride_father, isBrideFatherDeceased);
  const brideMotherText = formatParentName(invitation?.bride_mother, isBrideMotherDeceased);
  const brideParents = [brideFatherText, brideMotherText].filter(Boolean).join(' · ');
  const brideRelation = invitation?.bride_relation || config.bride_relation || '';

  // 안전한 혼주 및 성함 표시 (실제 고객 미입력 시 가짜 샘플 노출 차단)
  const displayGroomParents = groomParents || (isSample ? '강오진 · 류창희' : '');
  const displayGroomRelation = groomRelation || (isSample ? '아들' : (groomParents ? '장남' : ''));
  const displayGroomName = groomName || (isSample ? '강민준' : '');
  const hasGroomFamily = Boolean(displayGroomParents || displayGroomName);

  const displayBrideParents = brideParents || (isSample ? '장철규 · 이정자' : '');
  const displayBrideRelation = brideRelation || (isSample ? '딸' : (brideParents ? '장녀' : ''));
  const displayBrideName = brideName || (isSample ? '박지민' : '');
  const hasBrideFamily = Boolean(displayBrideParents || displayBrideName);

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
    }, 4500);
    return () => clearInterval(timer);
  }, [guestbookList.length]);

  // 계좌 데이터
  const groomAccounts = (invitation?.accounts || []).filter((a) => a.group === '신랑측' || a.side === 'groom');
  const brideAccounts = (invitation?.accounts || []).filter((a) => a.group === '신부측' || a.side === 'bride');

  // 정보 카드 목록
  const infoCards = invitation?.info_notices || [];
  // 교통편 목록
  const transportationList = invitation?.transportation || [];

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

  const handleCopyAccount = async (accountNum, label) => {
    if (!accountNum) return;
    try {
      await navigator.clipboard.writeText(accountNum);
      alert(`${label} 계좌번호가 복사되었습니다.`);
    } catch {
      alert('복사에 실패했습니다.');
    }
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

      {/* 1. 에디토리얼 본문 첫 화면 (Figma 프레임 390 / 섹션1 2849:2705 1:1 정밀 매칭) */}
      <section className="relative w-full flex flex-col items-center justify-start bg-[#fefefe] px-6 sm:px-7 pt-[28px] sm:pt-[30px] pb-[39px] sm:pb-[42px] select-none overflow-hidden">
        
        {/* 상단: 대표 화보 사진 (Figma image 736: 666x830 -> 333x415 1x, aspect-[666/830]) */}
        <div className="w-full max-w-[333px] aspect-[666/830] bg-stone-100 overflow-hidden shrink-0">
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
        </div>

        {/* 신랑 · 신부 성함 및 결혼 안내 (Figma 2849:2707: 사진 하단과의 간격 35.5px, Noto Serif KR 15px #292929) */}
        <h1 className="font-serif text-[15px] sm:text-[15.5px] text-[#292929] font-normal tracking-tight text-center mt-[35.5px] shrink-0">
          {coupleKo ? `${coupleKo} 저희 결혼합니다.` : (isSample ? '강민준 · 박지민 저희 결혼합니다.' : '저희 결혼합니다.')}
        </h1>

        {/* 가로 구분선 (Figma Line 138: 너비 257px 1x, 성함 아래 간격 22px, 1px #e5e5e5) */}
        <div className="w-[257px] max-w-[70%] border-t border-[#e5e5e5] mt-[22px] shrink-0" />

        {/* 예식 일시 (Figma 2849:2709: 구분선 아래 간격 22.5px, Noto Serif KR 12px #333333) */}
        {formattedDates.fullKo && (
          <p className="font-serif text-[12px] sm:text-[12.5px] text-[#333333] font-normal tracking-tight text-center mt-[22.5px] shrink-0">
            {formattedDates.fullKo}
          </p>
        )}

        {/* 예식 장소 (Figma 2849:2708: 날짜 아래 간격 16px, Noto Serif KR 12px #666666) */}
        {venueFullName && (
          <p className="font-serif text-[12px] sm:text-[12.5px] text-[#666666] font-normal tracking-tight text-center mt-[16px] shrink-0">
            {venueFullName}
          </p>
        )}

        {/* 하단: SCROLL TO OPEN 버튼 (Figma Ellipse 749: 116px x 28px, 장소 아래 간격 59px, Bodoni 72 Bold 8px #333333) */}
        <div className="mt-[59px] shrink-0">
          <button
            type="button"
            onClick={() => {
              const nextEl = document.getElementById('editorial-story-section');
              if (nextEl) {
                nextEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-[116px] h-[28px] border border-[#d0d0d0] hover:border-stone-400 bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer group shadow-2xs flex items-center justify-center gap-1 select-none"
            style={{ borderRadius: '50%' }}
          >
            <span className="font-bodoni text-[8px] tracking-[0.14em] text-[#333333] uppercase font-bold leading-none pt-0.5">
              SCROLL TO OPEN
            </span>
            <svg width="7" height="8" viewBox="0 0 7 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 transition-transform duration-200 group-hover:translate-y-0.5">
              <path d="M3.5 0V6.5M3.5 6.5L0.8 3.8M3.5 6.5L6.2 3.8" stroke="#333333" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* 섹션 1 바닥 1px 구분선 (Figma Line 138: 280.5px 너비, 버튼 아래 39px) */}
        <div className="w-[280px] max-w-[75%] border-t border-[#e3e3e3] mt-[39px] shrink-0" />
      </section>

      {/* 2. 에디토리얼 프로필 스프레드: 신부 & 신랑 단독 프로필 카드 & 혼주 정보 (Figma 프레임 390 / 섹션2 2849:2723 1:1 정밀 매칭) */}
      <section id="editorial-story-section" className="pt-[96px] sm:pt-[100px] pb-0 px-6 bg-white relative flex flex-col items-center">
        <ScrollReveal>
          {/* 영문 필기체 헤더 (Figma 2849:2724: Welcome to + 전체 영문 이름 1:1 매칭) */}
          <div className="text-center mb-[28px] select-none flex flex-col items-center justify-center min-h-[64px]">
            <p
              className="font-bickham text-[36px] sm:text-[40px] text-[#292929] tracking-normal leading-[1.05] select-none"
              style={{ fontFamily: "'Bickham Script Pro', cursive" }}
            >
              Welcome to
            </p>
            {fullNamesEn ? (
              <p
                className="font-bickham text-[32px] sm:text-[34px] text-[#292929] tracking-wide leading-[1.1] mt-1 select-none whitespace-nowrap"
                style={{ fontFamily: "'Bickham Script Pro', cursive" }}
              >
                {fullNamesEn}
              </p>
            ) : coupleKo ? (
              <p className="font-serif text-[15px] sm:text-[16px] text-[#292929] tracking-tight mt-1 select-none font-normal">
                {coupleKo}
              </p>
            ) : null}
          </div>

          {/* 신부 & 신랑 2단 액자 카드 그리드 (Figma 2849:2734 ~ 2849:2747: 좌측 신부, 우측 신랑, 간격 14px, 너비 332px) */}
          <div className="grid grid-cols-2 gap-[14px] w-full max-w-[332px] mx-auto">
            {/* 좌측: 신부 카드 (Figma 2849:2734: 159x217px, 사진 142x158px 비율 283.5/315.9) */}
            <div className="bg-[#fefefe] p-2 pb-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#f0f0f0]">
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
              <div className="pt-3.5 pb-0.5 text-center flex items-center justify-center gap-2 select-none">
                <span
                  className="font-bickham text-[18px] sm:text-[19px] text-stone-500 leading-none select-none"
                  style={{ fontFamily: "'Bickham Script Pro', cursive" }}
                >
                  Bride.
                </span>
                <span className="font-serif text-[13.5px] sm:text-[14px] text-[#292929] font-normal tracking-tight">
                  {brideName || (isSample ? '박지민' : '')}
                </span>
              </div>
            </div>

            {/* 우측: 신랑 카드 (Figma 2849:2741: 159x217px, 사진 142x158px 비율 283.5/315.9) */}
            <div className="bg-[#fefefe] p-2 pb-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#f0f0f0]">
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
              <div className="pt-3.5 pb-0.5 text-center flex items-center justify-center gap-2 select-none">
                <span
                  className="font-bickham text-[18px] sm:text-[19px] text-stone-500 leading-none select-none"
                  style={{ fontFamily: "'Bickham Script Pro', cursive" }}
                >
                  Groom.
                </span>
                <span className="font-serif text-[13.5px] sm:text-[14px] text-[#292929] font-normal tracking-tight">
                  {groomName || (isSample ? '강민준' : '')}
                </span>
              </div>
            </div>
          </div>

          {/* 혼주 정보 (Figma Group 1174: 상단 액자 카드와의 여백 44px, 너비 224px 3열 정밀 매칭) */}
          {(hasGroomFamily || hasBrideFamily) && (
            <div className="mt-[44px] w-[224px] sm:w-[230px] mx-auto font-serif text-[13px] sm:text-[13.5px]">
              <div className="space-y-3.5">
                {/* 1행: 신랑측 부모님 & 아들 & 신랑 (Figma 2849:2726) */}
                {hasGroomFamily && (
                  <div className="flex items-center justify-between text-stone-800">
                    <span className="w-[100px] text-left tracking-tight font-normal shrink-0">
                      {displayGroomParents}
                    </span>
                    <span className="w-[38px] text-center text-stone-400 text-[12px] tracking-tight font-normal shrink-0">
                      {displayGroomRelation}
                    </span>
                    <span className="w-[50px] text-right text-[#292929] tracking-tight font-normal shrink-0">
                      {displayGroomName}
                    </span>
                  </div>
                )}

                {/* 2행: 신부측 부모님 & 딸 & 신부 (Figma 2849:2730) */}
                {hasBrideFamily && (
                  <div className="flex items-center justify-between text-stone-800">
                    <span className="w-[100px] text-left tracking-tight font-normal shrink-0">
                      {displayBrideParents}
                    </span>
                    <span className="w-[38px] text-center text-stone-400 text-[12px] tracking-tight font-normal shrink-0">
                      {displayBrideRelation}
                    </span>
                    <span className="w-[50px] text-right text-[#292929] tracking-tight font-normal shrink-0">
                      {displayBrideName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 섹션 2 바닥 1px 구분선 (Figma Line 139: 너비 280px, 혼주 아래 100px) */}
          <div className="w-[280px] max-w-[75%] border-t border-[#e5e5e5] mt-[96px] sm:mt-[100px] mx-auto" />
        </ScrollReveal>
      </section>

      {/* 3. 에디토리얼 커플 화보 & 초대합니다 (Figma 프레임 390 / 섹션3 2849:2718, image 745 1:1 정밀 매칭) */}
      <section className="bg-white">
        <ScrollReveal>
          {/* 상단: 풀 와이드 커플 사진 화보 (Figma image 745: 780x576 2x -> 390x288 1x, aspect-[780/576]) */}
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

          {/* 하단: 모시는 글 본문 (Figma 실측: 사진 아래 간격 81px, 초대합니다 20px, 간격 32.5px, 본문 너비 256px, 바닥 여백 160px) */}
          <div className="pt-[80px] sm:pt-[82px] pb-[80px] sm:pb-[85px] px-6 text-center font-serif flex flex-col items-center">
            {/* 제목: 초대합니다 (Figma 2849:2719: Noto Serif KR 20px #292929) */}
            <h2 className="font-serif text-[19.5px] sm:text-[20px] text-[#292929] font-normal tracking-tight">
              초대합니다
            </h2>

            {/* 본문 초대글 (Figma 2849:2720: 너비 256px 중앙 정렬, Noto Serif KR 13px #555555, 서정적 행간 2.15) */}
            <div className="mt-[32px] sm:mt-[33px] w-[256px] sm:w-[260px] mx-auto text-[13px] sm:text-[13.5px] text-[#555555] font-normal leading-[2.15] sm:leading-[2.2] tracking-tight break-keep whitespace-pre-line">
              {invitation?.message ? (
                invitation.message
              ) : (
                <>
                  <p className="mb-4 sm:mb-4.5">
                    서로를 만나 평범했던 하루가<br />
                    조금 더 따뜻하고 특별해졌습니다.
                  </p>
                  <p className="mb-4 sm:mb-4.5">
                    이제 두 사람이 한마음으로<br />
                    새로운 계절을 시작하려 합니다.
                  </p>
                  <p className="mb-4 sm:mb-4.5">
                    소중한 분들과 함께<br />
                    그 순간을 나누고 싶습니다.
                  </p>
                  <p>
                    저희의 첫걸음에<br />
                    따뜻한 축복을 보내주세요.
                  </p>
                </>
              )}
            </div>

            {/* 연락하기 버튼 (Figma Rectangle 6165 & Group 1090: 271x76 2x -> 136x38 1x, mt-[40px], 텍스트 + 전화 아이콘) */}
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="mt-[40px] sm:mt-[42px] w-[136px] h-[38px] bg-white hover:bg-[#fafafa] active:scale-[0.98] border border-[#e5e5e5] rounded-[6px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center gap-2 cursor-pointer transition-all select-none"
            >
              <span className="font-serif text-[13.5px] sm:text-[14px] text-[#292929] font-normal tracking-tight">
                연락하기
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#292929" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* 4. 에디토리얼 캘린더 & 카운트다운 (Figma Rectangle 6224 / Group 1177 1:1 정밀 매칭) */}
      {hasWeddingDate && calendarData && (
        <section className="w-full bg-[#FEFEFE] pt-[74px] pb-[73px] px-6 text-center select-none overflow-hidden border-b border-stone-200/80">
          <ScrollReveal>
            {/* 상단 1: Wedding Day 필기체 (Figma 2849:2778: Weddingday Personal Use 35px #292929) */}
            <h2
              className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal"
              style={{ fontFamily: "'Weddingday Personal Use', 'Bickham Script Pro', cursive" }}
            >
              Wedding Day
            </h2>

            {/* 상단 2: 예식 일시 (Figma 2849:2779: NanumSquare Neo / font-sans 14px #333333 mt-[26px]) */}
            <p className="mt-[26px] font-sans text-[14px] text-[#333333] text-center leading-none tracking-tight select-none">
              {formattedDates.calendarHeaderDate || `${formattedDates.yearNumber}년 ${calendarData.month}월 ${calendarData.weddingDay}일 ${formattedDates.dowKo}요일 | ${formattedDates.timeStrKo}`}
            </p>

            {/* 상단 3: 가로 구분선 (Figma Line 127: w-[320px] mx-auto border-t border-[#f0f0f0] mt-[34px]) */}
            <div className="w-[320px] max-w-[85%] mx-auto border-t border-[#f0f0f0] mt-[34px]" />

            {/* 중앙: 캘린더 그리드 (Figma Group 1178: 너비 258px 중앙 정렬, mt-[45px]) */}
            <div className="w-[258px] max-w-full mx-auto mt-[45px]">
              {/* 요일 헤더: 일(코랄레드 #F17171), 월~토(그레이 #888888) */}
              <div className="grid grid-cols-7 text-center font-sans text-[11px] sm:text-[11.5px] font-normal mb-3 select-none">
                <span className="text-[#F17171]">일</span>
                <span className="text-[#888888]">월</span>
                <span className="text-[#888888]">화</span>
                <span className="text-[#888888]">수</span>
                <span className="text-[#888888]">목</span>
                <span className="text-[#888888]">금</span>
                <span className="text-[#888888]">토</span>
              </div>

              {/* 날짜 숫자 그리드: 일요일(#F17171), 평일(#333333), 예식일(차콜 원형 #454545 + 흰색) */}
              <div className="grid grid-cols-7 gap-y-1 text-center font-sans text-[13px] sm:text-[13.5px] select-none">
                {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-[34px]" />
                ))}

                {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                  const day = i + 1;
                  const isSunday = (calendarData.firstDayIndex + i) % 7 === 0;
                  const isWeddingDay = day === calendarData.weddingDay;

                  return (
                    <div key={day} className="flex items-center justify-center h-[34px]">
                      {isWeddingDay ? (
                        <span className="w-[33px] h-[33px] rounded-full bg-[#454545] text-white flex items-center justify-center font-normal shadow-xs">
                          {day}
                        </span>
                      ) : (
                        <span className={isSunday ? 'text-[#F17171]' : 'text-[#333333]'}>
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
              <div className="mt-[46px] w-[302px] max-w-full mx-auto">
                {/* 카운트다운 4개 사각 박스 (Figma Rectangle 6167~6170: 69.3px x 69.3px, bg-[#F6F5F5], shadow-[0px_3.5px_3.2px_rgba(147,147,147,0.22)], rounded-[6.3px]) */}
                <div className="grid grid-cols-4 gap-[8px] text-center select-none">
                  {[
                    { label: 'DAYS', val: timeLeft.days },
                    { label: 'HOURS', val: timeLeft.hours },
                    { label: 'MINUTES', val: timeLeft.minutes },
                    { label: 'SECONDS', val: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="w-[69.3px] h-[69.3px] max-w-full bg-[#F6F5F5] rounded-[6.3px] shadow-[0px_3.5px_3.2px_rgba(147,147,147,0.22)] flex flex-col items-center justify-center mx-auto"
                    >
                      <span className="font-bodoni text-[10.8px] sm:text-[11px] text-[#666666] tracking-[0.04em] uppercase leading-none select-none">
                        {item.label}
                      </span>
                      <span className="font-bodoni text-[22.5px] sm:text-[23px] text-[#535353] leading-none tabular-nums font-normal select-none mt-[8px]">
                        {String(item.val).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 하단 D-day 문구 (Figma 2849:2777: mt-[33px], font-sans text-[13px] text-[#333333], #F17171 강조, #EE4D4D 하트) */}
                <p className="mt-[33px] font-sans text-[13px] sm:text-[13.5px] text-[#333333] tracking-tight text-center select-none">
                  {isSample ? (
                    <>
                      기득 <span className="text-[#EE4D4D] mx-0.5">♥</span> 민기님의 결혼식이{' '}
                      <span className="text-[#F17171] font-medium">{timeLeft.totalDays || 120}일</span> 남았습니다.
                    </>
                  ) : (
                    <>
                      {coupleHeartText.split(' ♥ ')[0] || groomName} <span className="text-[#EE4D4D] mx-0.5">♥</span> {coupleHeartText.split(' ♥ ')[1] || brideName}님의 결혼식이{' '}
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
          </ScrollReveal>
        </section>
      )}

      {/* 5. 에디토리얼 화보 갤러리 (Figma Rectangle 6225: 780x1622 -> 1x 390x811, background: #FEFEFE) */}
      {showGallerySection && galleryImages.length > 0 && (
        <section className="w-full bg-[#FEFEFE] pt-[70px] pb-[34px] px-6 text-center select-none overflow-hidden border-b border-stone-200/80">
          <ScrollReveal>
            {/* 상단 1: gallery 필기체 (Figma: Weddingday Personal Use 35px) */}
            <h2 className="font-weddingday text-[35px] text-[#292929] leading-[72%] text-center select-none tracking-normal mb-[16px]">
              gallery
            </h2>
            {/* 상단 2: 사진 갤러리 (Figma: NanumSquare Neo OTF Bold 40px -> 1x 20px, line-height 72% box 29px -> 1x 14.5px, #292929) */}
            <p className="font-nanumsquare font-bold text-[20px] text-[#292929] leading-none text-center mb-[51.5px] tracking-tight">
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
                  if (e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
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
                      if (e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
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
          </ScrollReveal>
        </section>
      )}

      {/* 6. 식장 위치 및 인포그래픽 길안내 (Location & Directions) */}
      {(invitation?.venue_name || invitation?.venue_address) && (
        <section className="pt-16 sm:pt-20 pb-18 sm:pb-22 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 05 · VENUE GUIDE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-[19px] sm:text-[21px] text-stone-900 font-normal tracking-tight mb-2">
              {invitation?.venue_name}
            </h2>
            {invitation?.venue_hall && (
              <p className="font-serif text-[13.5px] sm:text-[14px] text-stone-700 mb-1.5 font-normal tracking-tight">
                {invitation.venue_hall}
              </p>
            )}
            <p className="font-serif text-[12.5px] sm:text-[13px] text-stone-500 mb-7 font-normal tracking-tight">
              {invitation?.venue_address}
            </p>

            {/* 지도 컴포넌트 */}
            <div className="w-full max-w-[380px] mx-auto rounded-none overflow-hidden border border-stone-200/90 shadow-2xs mb-5">
              <KakaoMap
                address={invitation.venue_address}
                venueName={invitation?.venue_name || ''}
                className="w-full h-[260px] sm:h-[300px]"
              />
            </div>

            {/* 네이비/네이버지도 버튼 */}
            <div className="grid grid-cols-2 gap-2.5 max-w-[340px] mx-auto mb-11 font-serif text-[12px] sm:text-[12.5px]">
              <button
                type="button"
                onClick={() => {
                  const query = invitation?.venue_name || invitation?.venue_address;
                  window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank');
                }}
                className="py-2.5 px-3 border border-stone-300 hover:border-stone-900 text-stone-800 rounded-full hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-normal shadow-2xs"
              >
                <span>네이버 지도</span>
                <span className="text-[10px] text-stone-400">↗</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const query = invitation?.venue_name || invitation?.venue_address;
                  window.open(`https://map.kakao.com/link/search/${encodeURIComponent(query)}`, '_blank');
                }}
                className="py-2.5 px-3 border border-stone-300 hover:border-stone-900 text-stone-800 rounded-full hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-normal shadow-2xs"
              >
                <span>카카오 맵</span>
                <span className="text-[10px] text-stone-400">↗</span>
              </button>
            </div>

            {/* 교통편 안내 (에디토리얼 인포그래픽 타임라인 리스트) */}
            {transportationList.length > 0 && (
              <div className="text-left space-y-4 max-w-[380px] mx-auto pt-7 border-t border-stone-200">
                <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.25em] uppercase text-stone-400 block mb-5 font-semibold text-center">
                  DIRECTIONS & TRANSIT
                </span>

                <div className="space-y-3.5">
                  {transportationList.map((item, idx) => (
                    <div key={idx} className="p-5 bg-stone-50/70 border border-stone-200/90 relative rounded-xs">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-sans text-[9.5px] sm:text-[10px] tracking-widest uppercase text-stone-400 font-semibold">
                          0{idx + 1} · {item.type?.toUpperCase() || 'TRANSIT'}
                        </span>
                      </div>
                      <h3 className="font-serif text-[14.5px] sm:text-[15px] font-medium text-stone-900 mb-1.5 tracking-tight">
                        {item.title}
                      </h3>
                      <p className="font-serif text-[12.5px] sm:text-[13px] text-stone-600 leading-[1.85] whitespace-pre-line font-normal tracking-tight">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* 7. 마음 전하실 곳 (Heart to Heart - Accounts) */}
      {showAccountsSection && (groomAccounts.length > 0 || brideAccounts.length > 0) && (
        <section className="pt-16 sm:pt-20 pb-18 sm:pb-22 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 06 · REGISTRY
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-[19px] sm:text-[21px] text-stone-900 font-normal tracking-tight mb-2">
              마음 전하실 곳
            </h2>
            <p className="font-serif text-[13px] sm:text-[13.5px] text-stone-500 mb-8 font-normal tracking-tight">
              축복의 마음을 담아 축의금을 전달하실 수 있습니다.
            </p>

            <div className="max-w-[370px] mx-auto space-y-4 text-left">
              {/* 신랑측 계좌 (기본 펼쳐짐) */}
              {groomAccounts.length > 0 && (
                <div className="border border-stone-200 bg-stone-50/70 p-5 relative rounded-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-stone-900 rounded-full" />
                      <span className="font-serif text-[12px] sm:text-[12.5px] tracking-wide uppercase font-medium text-stone-900">
                        GROOM&apos;S REGISTRY · 신랑측 계좌
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenGroomAccount(!openGroomAccount)}
                      className="text-[9.5px] font-sans tracking-widest text-stone-400 hover:text-stone-900 cursor-pointer"
                    >
                      {openGroomAccount ? 'HIDE —' : 'SHOW +'}
                    </button>
                  </div>

                  {openGroomAccount && (
                    <div className="space-y-3 font-serif">
                      {groomAccounts.map((acc, idx) => (
                        <div key={idx} className="p-3 bg-white border border-stone-200/80 flex items-center justify-between shadow-2xs rounded-xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10.5px] font-normal text-stone-600 bg-stone-100 px-2 py-0.5 rounded-xs">
                                {acc.bank}
                              </span>
                              <span className="text-[13.5px] text-stone-900 font-medium tracking-tight">
                                {acc.name || `${acc.title || ''} ${acc.holder || ''}`.trim() || ''}
                              </span>
                            </div>
                            <p className="text-[12.5px] font-mono text-stone-600 tracking-tight">
                              {acc.number || acc.account_number}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(acc.number || acc.account_number, acc.name || acc.holder || '계좌번호가')}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[9.5px] sm:text-[10px] font-sans tracking-[0.18em] uppercase rounded-full transition-colors cursor-pointer shadow-2xs"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 신부측 계좌 (기본 펼쳐짐) */}
              {brideAccounts.length > 0 && (
                <div className="border border-stone-200 bg-stone-50/70 p-5 relative rounded-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-stone-900 rounded-full" />
                      <span className="font-serif text-[12px] sm:text-[12.5px] tracking-wide uppercase font-medium text-stone-900">
                        BRIDE&apos;S REGISTRY · 신부측 계좌
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenBrideAccount(!openBrideAccount)}
                      className="text-[9.5px] font-sans tracking-widest text-stone-400 hover:text-stone-900 cursor-pointer"
                    >
                      {openBrideAccount ? 'HIDE —' : 'SHOW +'}
                    </button>
                  </div>

                  {openBrideAccount && (
                    <div className="space-y-3 font-serif">
                      {brideAccounts.map((acc, idx) => (
                        <div key={idx} className="p-3 bg-white border border-stone-200/80 flex items-center justify-between shadow-2xs rounded-xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10.5px] font-normal text-stone-600 bg-stone-100 px-2 py-0.5 rounded-xs">
                                {acc.bank}
                              </span>
                              <span className="text-[13.5px] text-stone-900 font-medium tracking-tight">
                                {acc.name || `${acc.title || ''} ${acc.holder || ''}`.trim() || ''}
                              </span>
                            </div>
                            <p className="text-[12.5px] font-mono text-stone-600 tracking-tight">
                              {acc.number || acc.account_number}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(acc.number || acc.account_number, acc.name || acc.holder || '계좌번호가')}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[9.5px] sm:text-[10px] font-sans tracking-[0.18em] uppercase rounded-full transition-colors cursor-pointer shadow-2xs"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 8. 정보 카드 안내 (Information - 식사, 화환 등) */}
      {infoCards.length > 0 && (
        <section className="pt-16 sm:pt-20 pb-18 sm:pb-22 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 07 · NOTICE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-[21px] sm:text-[23px] text-stone-900 font-normal tracking-tight mb-2">
              안내 사항
            </h2>
            <p className="font-serif text-[13px] sm:text-[13.5px] text-stone-500 mb-8 font-normal tracking-tight">
              예식 당일 편안한 걸음을 위한 필수 안내입니다.
            </p>

            <div className="max-w-[370px] mx-auto space-y-4 text-left">
              {infoCards.map((card, idx) => (
                <div key={idx} className="p-6 sm:p-7 bg-stone-50/70 border border-stone-200/90 relative rounded-xs">
                  {/* 상단 라벨 헤더 */}
                  <div className="flex items-baseline justify-between mb-4 pb-2.5 border-b border-stone-200/60">
                    <span className="font-sans text-[10px] text-stone-400 tracking-widest font-semibold">
                      NOTICE NO. 0{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">GUIDE</span>
                  </div>

                  {/* 제목 */}
                  <h3 className="font-serif text-[15px] sm:text-[16px] font-medium text-stone-900 mb-2.5 tracking-tight">
                    {card.title}
                  </h3>

                  {/* 부제목 */}
                  {card.subtitle && (
                    <div className="mb-3">
                      <span className="inline-block px-2.5 py-0.5 bg-stone-200/70 text-stone-700 text-[11px] sm:text-[11.5px] font-serif font-normal tracking-tight rounded-xs">
                        {card.subtitle}
                      </span>
                    </div>
                  )}

                  {/* 본문 설명 */}
                  <p className="font-serif text-[13px] sm:text-[13.5px] text-stone-600 leading-[1.9] whitespace-pre-line font-normal tracking-tight">
                    {card.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 9. 참석 의사 (RSVP - 에디토리얼 엽서 스타일) */}
      {showRsvpSection && (
        <section className="pt-16 sm:pt-20 pb-18 sm:pb-22 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 08 · R. S. V. P.
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>

            {/* 엽서 프레임 박스 */}
            <div className="max-w-[370px] mx-auto p-7 sm:p-8 bg-stone-50/70 border border-stone-200/90 relative shadow-2xs rounded-xs">
              {/* 우측 상단 스탬프 장식 */}
              <div className="absolute top-4 right-4 w-9 h-11 border border-dashed border-stone-300 flex items-center justify-center text-[9px] font-sans tracking-widest text-stone-400 uppercase rotate-6">
                POST
              </div>

              <h2 className="font-serif text-[21px] sm:text-[23px] text-stone-900 leading-tight tracking-[0.03em] mb-2 font-normal">
                Attendance Card
              </h2>
              <p className="font-serif text-[12.5px] sm:text-[13px] text-stone-600 mb-7 leading-[1.8] font-normal tracking-tight break-keep">
                귀한 발걸음으로 두 사람의 첫 시작을 함께해 주실 분들을 정성껏 모시고자 하오니, 참석 여부를 알려주세요.
              </p>

              <button
                type="button"
                onClick={() => setShowRsvpModal(true)}
                className="w-full py-3.5 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[10.5px] sm:text-[11px] uppercase tracking-[0.22em] font-sans font-medium transition-colors cursor-pointer shadow-sm"
              >
                Respond to Invitation ✉
              </button>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 09-2. 하객 현장 사진 선물 섹션 */}
      <GuestPhotoSnapSection invitation={invitation} />

      {/* 10. 축하 메시지 (Guestbook - 에디토리얼 독자 기고란 스타일) */}
      {showGuestbookSection && (
        <section className="pt-16 sm:pt-20 pb-18 sm:pb-22 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 09 · GUESTBOOK
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-[21px] sm:text-[23px] text-stone-900 leading-tight tracking-[0.03em] mb-2 font-normal">
              Warm Wishes
            </h2>
            <p className="font-serif text-[13px] sm:text-[13.5px] text-stone-500 mb-8 font-normal tracking-tight">
              두 사람의 앞날을 축복하는 마음을 남겨주세요.
            </p>

            {/* 방명록 메시지 카드 */}
            {guestbookList.length > 0 ? (
              <div className="max-w-[360px] mx-auto mb-8 p-6 sm:p-7 bg-stone-50/70 border border-stone-200/90 min-h-[140px] flex flex-col justify-between relative text-left rounded-xs">
                <span className="font-sans italic text-3xl text-stone-300 block leading-none mb-2">
                  “
                </span>
                <p className="font-serif text-[13.5px] sm:text-[14px] text-stone-800 leading-[1.9] whitespace-pre-line mb-4 font-normal tracking-tight">
                  {guestbookList[guestbookIndex]?.content}
                </p>
                <div className="flex items-center justify-between text-xs text-stone-400 font-serif border-t border-stone-200/60 pt-3">
                  <span className="font-serif italic tracking-wide text-stone-600 text-[12px]">
                    — From. {guestbookList[guestbookIndex]?.author}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-stone-400">
                      {guestbookIndex + 1} / {guestbookList.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetMsg(guestbookList[guestbookIndex])}
                      className="hover:text-stone-700 cursor-pointer text-[11px] underline underline-offset-2 font-serif"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="font-serif text-stone-400 text-[13px] mb-8 tracking-tight font-normal">
                첫 번째 축하 메시지의 주인공이 되어주세요.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowGuestbookModal(true)}
              className="py-3 px-8 rounded-full border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors text-[10.5px] sm:text-[11px] uppercase tracking-[0.2em] font-sans font-medium cursor-pointer shadow-2xs"
            >
              Write Message · 글 남기기
            </button>
          </ScrollReveal>
        </section>
      )}

      {/* 11. 엔딩 사진 & 매거진 백커버 (Back Cover & Colophon) */}
      <section className="pt-16 sm:pt-20 pb-20 sm:pb-24 px-6 bg-white text-center">
        <ScrollReveal duration={1000}>
          {/* 매거진 백커버 사진 액자 */}
          {endingImage && (
            <div className="max-w-[340px] mx-auto mb-9 overflow-hidden bg-white p-2 border border-stone-200 shadow-sm rounded-xs">
              <img
                src={endingImage}
                alt="Wedding ending"
                className="w-full aspect-[4/3] object-cover grayscale-[5%]"
                onError={(e) => {
                  if (e.currentTarget.src !== mainImage) {
                    e.currentTarget.src = mainImage;
                  }
                }}
              />
            </div>
          )}

          <h2 className="font-wedding-script italic text-[38px] sm:text-[42px] text-stone-900 leading-tight mb-2.5 select-none">
            Thank you
          </h2>
          <p className="font-serif text-[13px] sm:text-[13.5px] text-stone-600 mb-2 tracking-tight font-normal">
            소중한 발걸음으로 축복해 주셔서 진심으로 감사합니다.
          </p>

          {/* 에디토리얼 매거진 백커버 판권지 (Colophon & Barcode) */}
          <div className="max-w-[300px] mx-auto mt-11 pt-8 border-t border-stone-200 text-stone-400">
            <p className="font-sans text-[10.5px] sm:text-[11px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">
              THE WEDDING OF {displayNamesEn || coupleKo || (isSample ? 'MINJUN & JIMIN' : '')}
            </p>
            <p className="font-serif text-[11px] tracking-tight text-stone-400 mb-6 font-normal">
              {formattedDates.fullKo}
            </p>

            {/* 시크한 미니멀 바코드 그래픽 */}
            <div className="flex flex-col items-center justify-center opacity-70">
              <div className="flex items-center gap-[3px] h-8 mb-1.5">
                {[2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3].map((w, i) => (
                  <div key={i} className="bg-stone-800 h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
              <span className="font-mono text-[9px] tracking-[0.3em] text-stone-400">
                {calendarData ? `ISSUE · ${calendarData.year}${String(calendarData.month).padStart(2, '0')}${String(calendarData.weddingDay).padStart(2, '0')} · FOREVER` : 'WEDDING LOOKBOOK · FOREVER'}
              </span>
              <p className="font-sans text-[9px] sm:text-[9.5px] tracking-[0.24em] text-stone-400 uppercase mt-4 select-none">
                Designed by ATELIER DE MUKIRU
              </p>
            </div>
          </div>
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
