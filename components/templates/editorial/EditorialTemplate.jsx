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
      dowEn,
      dowKo,
      headerDate: `${y} · ${String(m).padStart(2, '0')} · ${String(d).padStart(2, '0')}`,
    };
  }, [targetDate]);

  // 영문 네임 계산 (에디토리얼 시그니처)
  const displayNamesEn = (() => {
    if (invitation?.main_names_en) return invitation.main_names_en;
    if (extra?.main_names_en) return extra.main_names_en;
    const groomFirst = invitation?.groom_first_name_en || invitation?.groom_name_en?.split(' ')[0] || '';
    const brideFirst = invitation?.bride_first_name_en || invitation?.bride_name_en?.split(' ')[0] || '';
    if (groomFirst && brideFirst) {
      return `${groomFirst} & ${brideFirst}`;
    }
    if (groomFirst || brideFirst) {
      return groomFirst || brideFirst;
    }
    if (invitation?.groom_name_en && invitation?.bride_name_en) {
      return `${invitation.groom_name_en} & ${invitation.bride_name_en}`;
    }
    if (invitation?.groom_name && invitation?.bride_name) {
      return `${invitation.groom_name} & ${invitation.bride_name}`;
    }
    return invitation?.groom_name || invitation?.bride_name || '';
  })();

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

      {/* 1. 에디토리얼 본문 첫 화면 (화이트 프레임 화보 세로 확장 & 상단 밀착 & Bodoni 72 타원 버튼) */}
      <section className="relative w-full flex flex-col items-center justify-start bg-white px-6 sm:px-8 pt-4 sm:pt-5 pb-0 select-none overflow-hidden">
        
        {/* 상단: 대표 화보 사진 (세로 길이 시원하게 확장: aspect-[3/4.35] max-h-[61vh]) */}
        <div className="w-full max-w-[340px] sm:max-w-[365px] aspect-[3/4.35] max-h-[61vh] sm:max-h-[64vh] bg-stone-100 overflow-hidden shadow-2xs shrink-0">
          <img
            src={mainImage}
            alt="Wedding Editorial"
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              if (isSample && e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
                e.currentTarget.src = '/samples/main-02-editorial.jpg';
              }
            }}
          />
        </div>

        {/* 중앙: 한글 성함, 가로선, 일시/장소 (사진 하단과 밀착 mt-4 sm:mt-5) */}
        <div className="w-full max-w-[340px] sm:max-w-[365px] flex flex-col items-center text-center mt-4 sm:mt-5 shrink-0">
          {/* 신랑 · 신부 성함 및 결혼 안내 */}
          <h1 className="font-serif text-[16px] sm:text-[17.5px] text-stone-900 font-normal tracking-tight">
            {coupleKo ? `${coupleKo} 저희 결혼합니다.` : (isSample ? '강민준 · 박지민 저희 결혼합니다.' : '저희 결혼합니다.')}
          </h1>

          {/* 은은한 가로 구분선 */}
          <div className="w-[68%] max-w-[220px] mx-auto border-t border-stone-200/90 mt-2.5 sm:mt-3 mb-2.5 sm:mb-3" />

          {/* 예식 일시 & 예식 장소 */}
          <div className="space-y-1 font-serif">
            {formattedDates.fullKo && (
              <p className="text-[12.5px] sm:text-[13px] text-stone-700 font-normal tracking-tight">
                {formattedDates.fullKo}
              </p>
            )}
            {venueFullName && (
              <p className="text-[11.5px] sm:text-[12px] text-stone-500 font-normal tracking-tight">
                {venueFullName}
              </p>
            )}
          </div>
        </div>

        {/* 하단: SCROLL TO OPEN ↓ (주소와 시원한 여백 확보 mt-10 sm:mt-12) */}
        <div className="mt-10 sm:mt-12 shrink-0">
          <button
            type="button"
            onClick={() => {
              const nextEl = document.getElementById('editorial-story-section');
              if (nextEl) {
                nextEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-[138px] sm:w-[145px] h-[30px] sm:h-[32px] border border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer group shadow-2xs flex items-center justify-center"
            style={{ borderRadius: '50% / 50%' }}
          >
            <span className="font-sans text-[8.5px] sm:text-[9px] tracking-[0.24em] text-stone-800 uppercase font-medium leading-none">
              SCROLL TO OPEN ↓
            </span>
          </button>
        </div>

        {/* 가로 구분선 (사용자 전달 시안 1:1 매칭: 버튼 아래 정확히 43px, 1px #e3e3e3) */}
        <div className="w-full max-w-[340px] sm:max-w-[365px] mx-auto border-t border-[#e3e3e3] mt-[43px] shrink-0" />
      </section>

      {/* 2. 에디토리얼 프로필 스프레드: 신부 & 신랑 단독 프로필 카드 & 혼주 정보 (커플사진과의 하단 간격 대폭 확대 pb-[140px] sm:pb-[160px]) */}
      <section id="editorial-story-section" className="pt-[115px] sm:pt-[132px] pb-[210px] sm:pb-[240px] px-6 bg-white">
        <ScrollReveal>
          {/* 영문 필기체 헤더 (1번째 레퍼런스 시안 1:1 정밀 매칭: 은은한 차콜 그레이 & 정갈한 크기) */}
          <div className="text-center mb-9 sm:mb-10 select-none">
            <p
              className="font-bickham text-[24px] sm:text-[26px] text-[#555555] tracking-wide leading-tight select-none"
              style={{ fontFamily: "'Bickham Script Pro', cursive" }}
            >
              Welcome to
            </p>
            <p
              className="font-bickham text-[22px] sm:text-[24px] text-[#555555] tracking-wide leading-tight mt-1 sm:mt-1.5 select-none"
              style={{ fontFamily: "'Bickham Script Pro', cursive" }}
            >
              {displayNamesEn || (isSample ? 'Jang Min-ki & Kwon Ki-deuk' : (coupleKo || 'Our Wedding'))}
            </p>
          </div>

          {/* 신부 & 신랑 2단 액자 카드 그리드 (좌측: 신부, 우측: 신랑) */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 max-w-[350px] sm:max-w-[375px] mx-auto">
            {/* 좌측: 신부 카드 (테두리선 없이 소프트 그림자) */}
            <div className="bg-white p-2.5 sm:p-3 pb-3 sm:pb-3.5 shadow-[0_4px_22px_rgba(0,0,0,0.07)] rounded-xs">
              <div className="w-full aspect-[3/3.85] overflow-hidden bg-stone-100 flex items-center justify-center">
                {bridePhoto ? (
                  <img
                    src={bridePhoto}
                    alt={brideName || 'Bride'}
                    className="w-full h-full object-cover object-center"
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
              <div className="pt-3 sm:pt-3.5 pb-0.5 text-center flex items-center justify-center gap-3 sm:gap-3.5 select-none">
                <span
                  className="font-bickham text-[18px] sm:text-[19px] text-stone-400 leading-none select-none"
                  style={{ fontFamily: "'Bickham Script Pro', cursive" }}
                >
                  Bride.
                </span>
                <span className="font-serif text-[14px] sm:text-[14.5px] text-stone-900 font-normal tracking-tight">
                  {brideName || (isSample ? '박지민' : '')}
                </span>
              </div>
            </div>

            {/* 우측: 신랑 카드 (테두리선 없이 소프트 그림자) */}
            <div className="bg-white p-2.5 sm:p-3 pb-3 sm:pb-3.5 shadow-[0_4px_22px_rgba(0,0,0,0.07)] rounded-xs">
              <div className="w-full aspect-[3/3.85] overflow-hidden bg-stone-100 flex items-center justify-center">
                {groomPhoto ? (
                  <img
                    src={groomPhoto}
                    alt={groomName || 'Groom'}
                    className="w-full h-full object-cover object-center"
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
              <div className="pt-3 sm:pt-3.5 pb-0.5 text-center flex items-center justify-center gap-3 sm:gap-3.5 select-none">
                <span
                  className="font-bickham text-[18px] sm:text-[19px] text-stone-400 leading-none select-none"
                  style={{ fontFamily: "'Bickham Script Pro', cursive" }}
                >
                  Groom.
                </span>
                <span className="font-serif text-[14px] sm:text-[14.5px] text-stone-900 font-normal tracking-tight">
                  {groomName || (isSample ? '강민준' : '')}
                </span>
              </div>
            </div>
          </div>

          {/* 혼주 정보 (서체: Noto Serif KR - 상단 액자 카드와의 여백 20% 확대 mt-12 sm:mt-14) */}
          {(hasGroomFamily || hasBrideFamily) && (
            <div className="mt-16 sm:mt-18 w-[260px] mx-auto font-serif text-[13.5px] sm:text-[14px]">
              <div className="space-y-3">
                {/* 1행: 신랑측 부모님 & 아들 & 신랑 */}
                {hasGroomFamily && (
                  <div className="flex items-center justify-between text-stone-800">
                    <span className="w-[116px] text-left tracking-tight font-normal shrink-0">
                      {displayGroomParents}
                    </span>
                    <span className="w-[44px] text-center text-stone-500 text-[12.5px] tracking-tight font-normal shrink-0">
                      {displayGroomRelation}
                    </span>
                    <span className="w-[54px] text-left text-stone-900 tracking-tight font-normal shrink-0">
                      {displayGroomName}
                    </span>
                  </div>
                )}

                {/* 2행: 신부측 부모님 & 딸 & 신부 */}
                {hasBrideFamily && (
                  <div className="flex items-center justify-between text-stone-800">
                    <span className="w-[116px] text-left tracking-tight font-normal shrink-0">
                      {displayBrideParents}
                    </span>
                    <span className="w-[44px] text-center text-stone-500 text-[12.5px] tracking-tight font-normal shrink-0">
                      {displayBrideRelation}
                    </span>
                    <span className="w-[54px] text-left text-stone-900 tracking-tight font-normal shrink-0">
                      {displayBrideName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* 3. 에디토리얼 커플 화보 & 초대합니다 (이미지 2 매칭) */}
      <section className="bg-white border-b border-stone-200/80">
        <ScrollReveal>
          {/* 상단: 가로 와이드 커플 사진 */}
          {couplePhoto && (
            <div className="w-full aspect-[4/2.85] overflow-hidden bg-stone-100">
              <img
                src={couplePhoto}
                alt="Couple Wedding"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  if (isSample && e.currentTarget.src !== '/samples/couple-profile-01.jpg') {
                    e.currentTarget.src = '/samples/couple-profile-01.jpg';
                  }
                }}
              />
            </div>
          )}

          {/* 하단: 초대 문구 (서체: Noto Serif KR) */}
          <div className="pt-12 sm:pt-14 pb-16 sm:pb-20 px-6 sm:px-8 text-center font-serif">
            {/* 제목: 초대합니다 */}
            <div className="flex items-center justify-center gap-2 mb-2.5">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 02 · INVITATION
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-[21px] sm:text-[23px] text-stone-900 font-normal tracking-tight mb-8 sm:mb-9">
              초대합니다
            </h2>

            {/* 본문 초대글 (Noto Serif KR) */}
            <div className="text-[13.5px] sm:text-[14px] text-stone-600 font-normal leading-[2.1] sm:leading-[2.2] tracking-tight break-keep whitespace-pre-line max-w-[340px] mx-auto">
              {invitation?.message ? (
                invitation.message
              ) : (
                <>
                  <p className="mb-5 sm:mb-6">
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
              )}
            </div>

            {/* 감성 인용구 (Quote - 설정 및 입력된 경우 노출) */}
            {showQuoteSection && invitation?.quote_content && (
              <div className="mt-10 pt-8 border-t border-stone-100 max-w-[310px] mx-auto text-center">
                <span className="font-editorial-serif italic text-2xl text-stone-300 block leading-none mb-2">
                  “
                </span>
                <p className="text-[12.5px] sm:text-[13px] text-stone-500 leading-[2.1] font-normal whitespace-pre-line break-keep italic">
                  {invitation.quote_content}
                </p>
                {invitation.quote_source && (
                  <p className="font-editorial-serif text-[11px] text-stone-400 tracking-wider mt-2">
                    — {invitation.quote_source}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* 4. 에디토리얼 룩북 캘린더 (Lookbook Calendar & Countdown) */}
      {hasWeddingDate && calendarData && (
        <section className="pt-16 sm:pt-20 pb-18 sm:pb-22 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 03 · THE DATE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-[22px] sm:text-[24px] text-stone-900 leading-tight tracking-[0.03em] mb-1.5 font-normal">
              {formattedDates.monthName} {formattedDates.yearNumber}
            </h2>
            <p className="font-sans text-[11.5px] sm:text-[12px] tracking-[0.2em] text-stone-500 mb-8 uppercase font-medium">
              {formattedDates.dowEn} · {formattedDates.timeStrEn}
            </p>

            {/* 미니멀 에디토리얼 달력 그리드 */}
            <div className="max-w-[330px] mx-auto mb-9 border-t border-b border-stone-200 py-6">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center font-sans text-[10.5px] sm:text-[11px] tracking-wider text-stone-400 uppercase mb-4">
                <span className="text-[#A24444]">SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-y-2 text-center font-sans text-[13.5px] sm:text-[14px] tabular-nums">
                {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}

                {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                  const day = i + 1;
                  const isSunday = (calendarData.firstDayIndex + i) % 7 === 0;
                  const isWeddingDay = day === calendarData.weddingDay;

                  return (
                    <div key={day} className="flex items-center justify-center h-8">
                      <span
                        className={`w-7 h-7 flex items-center justify-center text-[13px] transition-colors ${
                          isWeddingDay
                            ? 'bg-stone-900 text-white rounded-full font-medium shadow-xs'
                            : isSunday
                            ? 'text-[#A24444] font-light'
                            : 'text-stone-800 font-light'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D-Day 카운트다운 타이머 */}
            {showCountdownSection && (
              <div className="max-w-[330px] mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-stone-800 text-[10px] sm:text-[10.5px] font-sans tracking-[0.2em] uppercase mb-4 font-medium rounded-full">
                  <span>
                    {timeLeft.isToday
                      ? 'D - DAY'
                      : timeLeft.isPast
                      ? `D + ${timeLeft.totalDays}`
                      : `D - ${timeLeft.totalDays}`}
                  </span>
                  <span className="text-stone-300">|</span>
                  <span>
                    {timeLeft.isToday
                      ? 'TODAY WEDDING'
                      : timeLeft.isPast
                      ? 'MEMORABLE DAY'
                      : 'WEDDING COUNTDOWN'}
                  </span>
                </div>

                {!timeLeft.isPast ? (
                  <div className="grid grid-cols-4 gap-2 font-sans text-center mb-5">
                    {[
                      { label: 'DAYS', val: timeLeft.days },
                      { label: 'HOURS', val: timeLeft.hours },
                      { label: 'MINUTES', val: timeLeft.minutes },
                      { label: 'SECONDS', val: timeLeft.seconds },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-stone-50 py-3 px-1 border border-stone-200/90 rounded-xs">
                        <span className="text-[9.5px] tracking-[0.2em] text-stone-400 block mb-0.5 font-semibold">
                          {item.label}
                        </span>
                        <span className="text-[19px] sm:text-[21px] font-normal text-stone-900 tabular-nums">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-stone-50/80 py-4 px-4 border border-stone-200/90 mb-5 text-center rounded-xs">
                    <p className="font-sans text-[10.5px] tracking-[0.2em] text-stone-400 uppercase mb-1">
                      Our New Chapter Has Begun
                    </p>
                    <p className="font-serif text-[15px] sm:text-[16px] text-stone-900 tracking-tight">
                      결혼한 지 <span className="font-semibold">{timeLeft.totalDays}일</span>째 되는 날입니다
                    </p>
                  </div>
                )}

                <p className="font-serif text-[13px] sm:text-[13.5px] text-stone-600 font-normal tracking-tight">
                  {timeLeft.isToday ? (
                    <>오늘 두 사람의 축복된 예식이 시작됩니다.</>
                  ) : timeLeft.isPast ? (
                    <>소중한 걸음으로 축복해 주신 모든 분께 진심으로 감사드립니다.</>
                  ) : (
                    <>두 사람의 예식일까지 <strong className="text-stone-900 font-medium">{timeLeft.totalDays}일</strong> 남았습니다.</>
                  )}
                </p>
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* 5. 에디토리얼 화보 갤러리 (Magazine Lookbook Spread) */}
      {showGallerySection && galleryImages.length > 0 && (
        <section className="pt-16 sm:pt-20 pb-18 sm:pb-22 px-5 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-sans text-[10px] sm:text-[10.5px] tracking-[0.28em] uppercase text-stone-400 font-medium">
                CHAPTER 04 · VISUAL ARCHIVE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-serif text-[22px] sm:text-[24px] text-stone-900 leading-tight tracking-[0.03em] mb-2 font-normal">
              Gallery & Memories
            </h2>
            <p className="font-serif text-[13px] sm:text-[13.5px] text-stone-500 mb-8 font-normal tracking-tight">
              두 사람의 소중한 순간들을 기록합니다.
            </p>

            {/* 메인 화보 대형 컷 (매거진 프레임 & 캡션) */}
            <div className="max-w-[380px] mx-auto mb-6">
              <div 
                onClick={() => {
                  setGalleryModalIndex(activeGalleryIndex);
                  setGalleryModalOpen(true);
                }}
                className="relative w-full aspect-[4/5] bg-white p-2 border border-stone-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden cursor-pointer group rounded-xs"
              >
                <img
                  src={galleryImages[activeGalleryIndex] || galleryImages[0]}
                  alt="Selected wedding photo"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  onError={(e) => {
                    if (e.currentTarget.src !== '/samples/main-02-editorial.jpg') {
                      e.currentTarget.src = '/samples/main-02-editorial.jpg';
                    }
                  }}
                />
                
                {/* 상단 좌측: 룩북 태그 */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-sans tracking-widest uppercase px-2.5 py-1">
                  ARCHIVE NO. {String(activeGalleryIndex + 1).padStart(2, '0')}
                </div>

                {/* 하단 오버레이 줌인 안내 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-stone-900 text-[10px] sm:text-[10.5px] px-3.5 py-2 uppercase tracking-widest font-sans transition-opacity duration-300 shadow-md rounded-full">
                    Enlarge Spread ↗
                  </span>
                </div>
              </div>

              {/* 매거진 룩북 하단 캡션 */}
              <div className="pt-3 px-1 flex items-center justify-between text-stone-400 font-sans text-[11px] sm:text-[11.5px] tracking-wider">
                <span className="italic font-light">Fig. {String(activeGalleryIndex + 1).padStart(2, '0')}{displayNamesEn ? ` / ${displayNamesEn}` : ''}</span>
                <span>{activeGalleryIndex + 1} OF {galleryImages.length}</span>
              </div>
            </div>

            {/* 썸네일 그리드 */}
            <div className="grid grid-cols-4 gap-2 max-w-[380px] mx-auto">
              {galleryImages.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`aspect-square overflow-hidden bg-white p-0.5 border cursor-pointer transition-all relative rounded-xs ${
                    idx === activeGalleryIndex
                      ? 'border-stone-900 ring-1 ring-stone-900 opacity-100'
                      : 'border-stone-200 opacity-60 hover:opacity-100'
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
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white/90 drop-shadow-sm">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>

            {/* 전체 사진 크게 보기 버튼 */}
            <div className="mt-7">
              <button
                type="button"
                onClick={() => {
                  setGalleryModalIndex(0);
                  setGalleryModalOpen(true);
                }}
                className="py-2.5 px-6 border border-stone-300 hover:border-stone-900 text-stone-800 text-[10px] sm:text-[10.5px] font-sans uppercase tracking-[0.22em] rounded-full hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
              >
                View Full Lookbook ({galleryImages.length})
              </button>
            </div>
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
