'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
import TodayConciergeCard from '@/components/TodayConciergeCard';
import EditorialContactModal from './EditorialContactModal';
import EditorialRsvpModal from './EditorialRsvpModal';
import EditorialGuestbookModal from './EditorialGuestbookModal';
import EditorialGuestbookDeleteModal from './EditorialGuestbookDeleteModal';
import EditorialGalleryModal from './EditorialGalleryModal';
import KakaoMap from '@/components/KakaoMap';
import EditorialIntro from './EditorialIntro';
import { supabase } from '@/lib/supabase';

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

  // 대표 이미지 매핑
  const mainImage = images.main || images.cover || invitation?.main_image || '';
  const couplePhoto = images.couple_profile || images.couple || extra.couple_profile_image || mainImage;
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

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: shareDesc,
          imageUrl: mainImage,
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '모바일 청첩장 보기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
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
        .font-editorial-serif {
          font-family: 'Cormorant Garamond', serif !important;
        }
        .font-editorial-title {
          font-family: 'Italiana', 'Cormorant Garamond', serif !important;
        }
        .font-korean-serif {
          font-family: 'Noto Serif KR', serif !important;
        }
      `}</style>

      {/* 예식 당일 안내 데스크 (당일 자동 전환) */}
      <TodayConciergeCard invitation={invitation} />

      {/* 0. 에디토리얼 매거진 룩북 인트로 커버 */}
      {showIntro && showIntroSection && (
        <EditorialIntro
          invitation={invitation}
          onOpen={() => {
            setShowIntro(false);
          }}
        />
      )}

      {/* 1. 에디토리얼 매거진 커버 (Editorial Cover - Image 1/3 무드) */}
      <section className="relative w-full h-[100lvh] min-h-[100vh] flex flex-col justify-between overflow-hidden bg-stone-900 select-none">
        {/* 커버 배경 사진 */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url(${mainImage})` }}
        />
        {/* 에디토리얼 시네마틱 틴트 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 pointer-events-none" />

        {/* 커버 상단: SAVE THE DATE 헤어라인 바 */}
        <div className="relative z-10 w-full pt-8 px-6 flex items-center justify-between text-white/90">
          <span className="font-editorial-serif text-[13px] sm:text-[14px] tracking-[0.25em] font-light">
            SAVE THE DATE
          </span>
          {formattedDates.headerDate && (
            <span className="font-editorial-serif text-[13px] sm:text-[14px] tracking-[0.18em] font-light text-white/80">
              {formattedDates.headerDate}
            </span>
          )}
        </div>

        {/* 커버 하단: 세리프 타이포그래피 & 일시 */}
        <div className="relative z-10 w-full pb-14 px-7 text-left text-white">
          <ScrollReveal>
            <p className="font-editorial-serif italic text-white/80 text-[16px] sm:text-[18px] tracking-[0.15em] mb-1 font-light">
              The Wedding of
            </p>
            <h1 className="font-editorial-title text-[40px] sm:text-[46px] leading-[1.08] tracking-normal text-white drop-shadow-md">
              {displayNamesEn}
            </h1>
            
            {/* 얇은 라인 */}
            <div className="w-12 h-px bg-white/60 my-5" />

            <div className="space-y-1 font-sans text-white/90">
              <p className="text-[13.5px] sm:text-[14px] font-light tracking-wide">
                {formattedDates.fullKo}
              </p>
              {venueFullName && (
                <p className="text-[12.5px] sm:text-[13px] text-white/75 font-light tracking-tight">
                  {venueFullName}
                </p>
              )}
            </div>

            {/* 스크롤 유도 인디케이터 */}
            <div className="mt-8 flex items-center gap-2 text-white/60 text-[11px] tracking-[0.2em] uppercase font-editorial-serif">
              <div className="w-4 h-px bg-white/40" />
              <span>Scroll to open</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. 에디토리얼 오프닝 스프레드 (⭐️ 레퍼런스 2번 폰 화면의 핵심 감성) */}
      <section className="pt-16 sm:pt-20 pb-20 sm:pb-24 px-6 bg-[#FFFFFF] border-b border-stone-200/80">
        <ScrollReveal>
          {/* 상단 라벨 (Save the date & 날짜) */}
          <div className="flex items-center justify-between pb-5 border-b border-stone-200 text-stone-400 font-editorial-serif text-[12.5px] tracking-[0.18em]">
            <span className="italic font-light">Save the date</span>
            <span className="font-light">{formattedDates.headerDate || ''}</span>
          </div>

          {/* 비대칭 2단 분할 레이아웃: 좌측 세로 한글 이름 vs 우측 감성 액자 화보 */}
          <div className="grid grid-cols-[auto_1fr] gap-6 sm:gap-8 items-center pt-10 sm:pt-12 pb-8">
            {/* 좌측: 세로형 한글 성함 타이포그래피 (신랑 / 그리고 / 신부) */}
            {(groomShort || brideShort) ? (
              <div className="flex flex-col items-center justify-center pl-2 sm:pl-3 pr-1 select-none">
                {/* 신랑 이름 */}
                {groomShort && (
                  <div className="flex flex-col items-center space-y-2">
                    {groomShort.split('').map((char, i) => (
                      <span key={i} className="font-korean-serif text-[26px] sm:text-[28px] font-normal text-stone-900 leading-none">
                        {char}
                      </span>
                    ))}
                  </div>
                )}

                {/* 중앙 연결 문구: 그리고 (둘 다 있을 때만 노출) */}
                {groomShort && brideShort && (
                  <div className="my-3.5 sm:my-4.5 flex flex-col items-center space-y-1 select-none">
                    {'그리고'.split('').map((char, i) => (
                      <span key={i} className="font-korean-serif text-[10px] sm:text-[10.5px] text-stone-400 font-light leading-none">
                        {char}
                      </span>
                    ))}
                  </div>
                )}

                {/* 신부 이름 */}
                {brideShort && (
                  <div className="flex flex-col items-center space-y-2">
                    {brideShort.split('').map((char, i) => (
                      <span key={i} className="font-korean-serif text-[26px] sm:text-[28px] font-normal text-stone-900 leading-none">
                        {char}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : <div />}

            {/* 우측: 정갈한 잡지 화보 액자 사진 프레임 */}
            <div className="w-full">
              <div className="w-full aspect-[3/4] overflow-hidden bg-white p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-stone-200/80">
                <img
                  src={couplePhoto}
                  alt="Couple lookbook"
                  className="w-full h-full object-cover object-center grayscale-[10%] hover:grayscale-0 transition-all duration-700"
                  onError={(e) => {
                    if (e.currentTarget.src !== mainImage) {
                      e.currentTarget.src = mainImage;
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* 얇은 라인 구분선 */}
          <div className="w-full h-px bg-stone-200 my-8" />

          {/* 하단: 대형 날짜 타이포그래피 & 시적인 초대글 */}
          <div className="text-left space-y-7">
            {/* 대형 날짜 (05.14) & 요일 시간 */}
            {formattedDates.dateDot && (
              <div>
                <p className="font-editorial-serif text-[56px] sm:text-[62px] font-normal tracking-tight text-stone-900 leading-none">
                  {formattedDates.dateDot}
                </p>
                <p className="font-editorial-serif text-[12.5px] sm:text-[13px] tracking-[0.22em] text-stone-500 mt-2.5 uppercase font-medium">
                  {formattedDates.dowEn} · {formattedDates.timeStrEn}
                </p>
              </div>
            )}

            {/* 초대 문구 (동적 데이터만 노출) */}
            {invitation?.message && (
              <div className="font-korean-serif text-[14.5px] sm:text-[15px] text-stone-700 leading-[2.4] font-normal whitespace-pre-line break-keep pt-1">
                {invitation.message}
              </div>
            )}

            {/* 장소 요약 */}
            {venueFullName && (
              <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between text-stone-600 text-[12.5px] font-sans">
                <span>{venueFullName}</span>
                <span className="font-editorial-serif tracking-widest text-stone-400 text-xs">CEREMONY</span>
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* 3. 에디토리얼 인터뷰 칼럼 (Our Column & Parents) */}
      <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center border-b border-stone-200/80">
        <ScrollReveal>
          {/* 섹션 챕터 헤더 */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-5 h-px bg-stone-300" />
            <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
              CHAPTER 02 · COLUMN
            </span>
            <span className="w-5 h-px bg-stone-300" />
          </div>
          <h2 className="font-editorial-title text-[32px] sm:text-[36px] text-stone-900 leading-tight tracking-normal mb-8">
            Two Become One
          </h2>

          {/* 감성 인용구 (Quote - 매거진 북마크 스타일) */}
          {showQuoteSection && invitation?.quote_content && (
            <div className="max-w-[330px] mx-auto mb-14 p-6 sm:p-7 bg-stone-50/70 border border-stone-200/90 relative text-center">
              <span className="font-editorial-serif italic text-4xl text-stone-300 block leading-none mb-2">
                “
              </span>
              <p className="font-korean-serif text-[13.5px] sm:text-[14px] text-stone-700 leading-[2.3] font-normal whitespace-pre-line break-keep">
                {invitation.quote_content}
              </p>
              {invitation.quote_source && (
                <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-center gap-2">
                  <span className="w-3 h-px bg-stone-300" />
                  <p className="font-editorial-serif italic text-[12px] text-stone-400 tracking-wider">
                    {invitation.quote_source}
                  </p>
                  <span className="w-3 h-px bg-stone-300" />
                </div>
              )}
            </div>
          )}

          {/* 혼주 & 신랑 신부 소개 (에디토리얼 패밀리 카드) */}
          <div className="bg-stone-50/70 p-7 sm:p-8 max-w-[370px] mx-auto border border-stone-200/90 mb-10 text-left relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/70 mb-5">
              <span className="font-editorial-serif text-[11px] tracking-[0.25em] uppercase text-stone-400 font-semibold">
                FAMILY & COUPLE
              </span>
              <span className="text-[10px] font-editorial-serif text-stone-400 tracking-widest uppercase">
                HONORED PARENTS
              </span>
            </div>

            <div className="space-y-4 font-korean-serif text-[14.5px] sm:text-[15px]">
              {/* 신랑측 */}
              <div className="grid grid-cols-[54px_1fr_36px_auto] items-center gap-x-2 pb-3.5 border-b border-stone-200/50">
                <span className="text-stone-400 text-xs font-editorial-serif tracking-wider uppercase">GROOM</span>
                <span className="text-stone-800 font-light truncate">{groomParents || ''}</span>
                <span className="text-stone-400 text-xs font-sans font-light text-right">{groomRelation || ''}</span>
                <span className="text-stone-900 font-medium tracking-wide text-right pl-1 min-w-[52px]">{invitation?.groom_name || ''}</span>
              </div>

              {/* 신부측 */}
              <div className="grid grid-cols-[54px_1fr_36px_auto] items-center gap-x-2">
                <span className="text-stone-400 text-xs font-editorial-serif tracking-wider uppercase">BRIDE</span>
                <span className="text-stone-800 font-light truncate">{brideParents || ''}</span>
                <span className="text-stone-400 text-xs font-sans font-light text-right">{brideRelation || ''}</span>
                <span className="text-stone-900 font-medium tracking-wide text-right pl-1 min-w-[52px]">{invitation?.bride_name || ''}</span>
              </div>
            </div>
          </div>

          {/* 축하 연락처 모달 버튼 */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white text-[13px] tracking-[0.2em] uppercase font-editorial-serif transition-colors cursor-pointer shadow-sm"
          >
            <span>Contact & Blessing</span>
            <span className="text-xs">→</span>
          </button>
        </ScrollReveal>
      </section>

      {/* 4. 에디토리얼 룩북 캘린더 (Lookbook Calendar & Countdown) */}
      {hasWeddingDate && calendarData && (
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
                CHAPTER 03 · THE DATE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-editorial-title text-[32px] sm:text-[36px] text-stone-900 leading-tight tracking-normal mb-2">
              {formattedDates.monthName} {formattedDates.yearNumber}
            </h2>
            <p className="font-editorial-serif text-[13px] tracking-[0.2em] text-stone-500 mb-10">
              {formattedDates.dowEn} · {formattedDates.timeStrEn}
            </p>

            {/* 미니멀 에디토리얼 달력 그리드 */}
            <div className="max-w-[330px] mx-auto mb-10 border-t border-b border-stone-200 py-6">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center font-editorial-serif text-[11px] tracking-wider text-stone-400 uppercase mb-4">
                <span className="text-[#A24444]">SUN</span>
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-y-2 text-center font-editorial-serif text-[14px] sm:text-[15px] tabular-nums">
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

            {/* D-Day 카운트다운 타이머 (에디토리얼 4분할 바 & D-Day 뱃지) */}
            {showCountdownSection && (
              <div className="max-w-[330px] mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-stone-800 text-[11px] font-editorial-serif tracking-widest uppercase mb-4 font-semibold">
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
                  <div className="grid grid-cols-4 gap-2 font-editorial-serif text-center mb-5">
                    {[
                      { label: 'DAYS', val: timeLeft.days },
                      { label: 'HOURS', val: timeLeft.hours },
                      { label: 'MINUTES', val: timeLeft.minutes },
                      { label: 'SECONDS', val: timeLeft.seconds },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-stone-50 py-3 px-1 border border-stone-200/90">
                        <span className="text-[10px] tracking-widest text-stone-400 block mb-0.5 font-semibold">
                          {item.label}
                        </span>
                        <span className="text-[20px] sm:text-[22px] font-normal text-stone-900 tabular-nums">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-stone-50/80 py-4 px-4 border border-stone-200/90 mb-5 text-center">
                    <p className="font-editorial-serif text-[11px] tracking-[0.2em] text-stone-400 uppercase mb-1">
                      Our New Chapter Has Begun
                    </p>
                    <p className="font-editorial-serif text-[16px] text-stone-900">
                      결혼한 지 <span className="font-semibold">{timeLeft.totalDays}일</span>째 되는 날입니다
                    </p>
                  </div>
                )}

                <p className="font-korean-serif text-[13.5px] text-stone-600">
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
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-5 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
                CHAPTER 04 · VISUAL ARCHIVE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-editorial-title text-[32px] sm:text-[36px] text-stone-900 leading-tight tracking-normal mb-10">
              Gallery & Memories
            </h2>

            {/* 메인 화보 대형 컷 (매거진 프레임 & 캡션) */}
            <div className="max-w-[380px] mx-auto mb-6">
              <div 
                onClick={() => {
                  setGalleryModalIndex(activeGalleryIndex);
                  setGalleryModalOpen(true);
                }}
                className="relative w-full aspect-[4/5] bg-white p-2 border border-stone-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden cursor-pointer group"
              >
                <img
                  src={galleryImages[activeGalleryIndex] || galleryImages[0]}
                  alt="Selected wedding photo"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                
                {/* 상단 좌측: 룩북 태그 */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xs text-white text-[10px] font-editorial-serif tracking-widest uppercase px-2.5 py-1">
                  ARCHIVE NO. {String(activeGalleryIndex + 1).padStart(2, '0')}
                </div>

                {/* 하단 오버레이 줌인 안내 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-stone-900 text-xs px-3.5 py-2 uppercase tracking-widest font-editorial-serif transition-opacity duration-300 shadow-md">
                    Enlarge Spread ↗
                  </span>
                </div>
              </div>

              {/* 매거진 룩북 하단 캡션 */}
              <div className="pt-3 px-1 flex items-center justify-between text-stone-400 font-editorial-serif text-[11.5px] tracking-wider">
                <span className="italic font-light">Fig. {String(activeGalleryIndex + 1).padStart(2, '0')}{displayNamesEn ? ` / ${displayNamesEn}` : ''}</span>
                <span>{activeGalleryIndex + 1} OF {galleryImages.length}</span>
              </div>
            </div>

            {/* 썸네일 그리드 (에디토리얼 번호 뱃지 포함) */}
            <div className="grid grid-cols-4 gap-2 max-w-[380px] mx-auto">
              {galleryImages.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`aspect-square overflow-hidden bg-white p-0.5 border cursor-pointer transition-all relative ${
                    idx === activeGalleryIndex
                      ? 'border-stone-900 ring-1 ring-stone-900 opacity-100'
                      : 'border-stone-200 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`갤러리 사진 ${idx + 1}번 보기`}
                >
                  <img src={src} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
                className="py-2.5 px-6 border border-stone-300 hover:border-stone-900 text-stone-800 text-[11px] font-editorial-serif uppercase tracking-[0.2em] transition-colors cursor-pointer"
              >
                View Full Lookbook ({galleryImages.length})
              </button>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 6. 식장 위치 및 인포그래픽 길안내 (Location & Directions) */}
      {(invitation?.venue_name || invitation?.venue_address) && (
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
                CHAPTER 05 · VENUE GUIDE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-editorial-title text-[32px] sm:text-[36px] text-stone-900 leading-tight tracking-normal mb-2">
              {invitation?.venue_name}
            </h2>
            {invitation?.venue_hall && (
              <p className="font-korean-serif text-[14.5px] text-stone-600 mb-2 font-medium">
                {invitation.venue_hall}
              </p>
            )}
            <p className="font-sans text-[13px] text-stone-500 mb-8 font-light">
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
            <div className="grid grid-cols-2 gap-2.5 max-w-[340px] mx-auto mb-12 font-sans text-xs">
              <button
                type="button"
                onClick={() => {
                  const query = invitation?.venue_name || invitation?.venue_address;
                  window.open(`https://map.naver.com/p/search/${encodeURIComponent(query)}`, '_blank');
                }}
                className="py-3 px-3 border border-stone-300 hover:border-stone-900 text-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
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
                className="py-3 px-3 border border-stone-300 hover:border-stone-900 text-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                <span>카카오 맵</span>
                <span className="text-[10px] text-stone-400">↗</span>
              </button>
            </div>

            {/* 교통편 안내 (에디토리얼 인포그래픽 타임라인 리스트) */}
            {transportationList.length > 0 && (
              <div className="text-left space-y-4 max-w-[380px] mx-auto pt-8 border-t border-stone-200">
                <span className="font-editorial-serif text-[11px] tracking-[0.25em] uppercase text-stone-400 block mb-5 font-semibold text-center">
                  DIRECTIONS & TRANSIT
                </span>

                <div className="space-y-3.5">
                  {transportationList.map((item, idx) => (
                    <div key={idx} className="p-5 bg-stone-50/70 border border-stone-200/90 relative">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 font-semibold">
                          0{idx + 1} · {item.type?.toUpperCase() || 'TRANSIT'}
                        </span>
                      </div>
                      <h3 className="font-korean-serif text-[15.5px] font-medium text-stone-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="font-sans text-[12.5px] text-stone-600 leading-relaxed whitespace-pre-line">
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
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
                CHAPTER 06 · REGISTRY
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-editorial-title text-[32px] sm:text-[36px] text-stone-900 leading-tight tracking-normal mb-3">
              마음 전하실 곳
            </h2>
            <p className="font-korean-serif text-[13.5px] text-stone-600 mb-10">
              축복의 마음을 담아 축의금을 전달하실 수 있습니다.
            </p>

            <div className="max-w-[370px] mx-auto space-y-4 text-left">
              {/* 신랑측 계좌 (기본 펼쳐짐) */}
              {groomAccounts.length > 0 && (
                <div className="border border-stone-200 bg-stone-50/70 p-5 relative">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-stone-900" />
                      <span className="font-editorial-serif text-xs tracking-widest uppercase font-semibold text-stone-900">
                        GROOM&apos;S REGISTRY · 신랑측 계좌
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenGroomAccount(!openGroomAccount)}
                      className="text-xs font-mono text-stone-400 hover:text-stone-900 cursor-pointer"
                    >
                      {openGroomAccount ? 'HIDE —' : 'SHOW +'}
                    </button>
                  </div>

                  {openGroomAccount && (
                    <div className="space-y-3 font-sans">
                      {groomAccounts.map((acc, idx) => (
                        <div key={idx} className="p-3 bg-white border border-stone-200/80 flex items-center justify-between shadow-2xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-sans font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5">
                                {acc.bank}
                              </span>
                              <span className="text-[13.5px] text-stone-900 font-medium font-korean-serif">
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
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-editorial-serif tracking-wider uppercase transition-colors cursor-pointer"
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
                <div className="border border-stone-200 bg-stone-50/70 p-5 relative">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-stone-900" />
                      <span className="font-editorial-serif text-xs tracking-widest uppercase font-semibold text-stone-900">
                        BRIDE&apos;S REGISTRY · 신부측 계좌
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenBrideAccount(!openBrideAccount)}
                      className="text-xs font-mono text-stone-400 hover:text-stone-900 cursor-pointer"
                    >
                      {openBrideAccount ? 'HIDE —' : 'SHOW +'}
                    </button>
                  </div>

                  {openBrideAccount && (
                    <div className="space-y-3 font-sans">
                      {brideAccounts.map((acc, idx) => (
                        <div key={idx} className="p-3 bg-white border border-stone-200/80 flex items-center justify-between shadow-2xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-sans font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5">
                                {acc.bank}
                              </span>
                              <span className="text-[13.5px] text-stone-900 font-medium font-korean-serif">
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
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-editorial-serif tracking-wider uppercase transition-colors cursor-pointer"
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
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
                CHAPTER 07 · NOTICE
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-editorial-title text-[32px] sm:text-[36px] text-stone-900 leading-tight tracking-normal mb-10">
              안내 사항
            </h2>

            <div className="max-w-[370px] mx-auto space-y-4 text-left">
              {infoCards.map((card, idx) => (
                <div key={idx} className="p-6 sm:p-7 bg-stone-50/70 border border-stone-200/90 relative">
                  {/* 상단 라벨 헤더 */}
                  <div className="flex items-baseline justify-between mb-4 pb-2.5 border-b border-stone-200/60">
                    <span className="font-editorial-serif text-xs text-stone-400 tracking-widest font-semibold">
                      NOTICE NO. 0{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">GUIDE</span>
                  </div>

                  {/* 제목 */}
                  <h3 className="font-korean-serif text-[17px] sm:text-[18px] font-medium text-stone-900 mb-3 tracking-tight">
                    {card.title}
                  </h3>

                  {/* 부제목 (있을 경우 뱃지 스타일로 구분) */}
                  {card.subtitle && (
                    <div className="mb-3.5">
                      <span className="inline-block px-2.5 py-1 bg-stone-200/70 text-stone-700 text-[11.5px] font-sans font-medium tracking-tight">
                        {card.subtitle}
                      </span>
                    </div>
                  )}

                  {/* 본문 설명 */}
                  <p className="font-korean-serif text-[13.5px] sm:text-[14px] text-stone-600 leading-[2.1] whitespace-pre-line font-normal">
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
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
                CHAPTER 08 · R. S. V. P.
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>

            {/* 엽서 프레임 박스 */}
            <div className="max-w-[370px] mx-auto p-7 sm:p-8 bg-stone-50/70 border border-stone-200/90 relative shadow-2xs">
              {/* 우측 상단 스탬프 장식 */}
              <div className="absolute top-4 right-4 w-9 h-11 border border-dashed border-stone-300 flex items-center justify-center text-[9px] font-editorial-serif tracking-widest text-stone-400 uppercase rotate-6">
                POST
              </div>

              <h2 className="font-editorial-title text-[30px] sm:text-[34px] text-stone-900 leading-tight tracking-normal mb-2">
                Attendance Card
              </h2>
              <p className="font-korean-serif text-[13px] text-stone-600 mb-8 leading-relaxed break-keep">
                귀한 발걸음으로 두 사람의 첫 시작을 함께해 주실 분들을 정성껏 모시고자 하오니, 참석 여부를 알려주세요.
              </p>

              <button
                type="button"
                onClick={() => setShowRsvpModal(true)}
                className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white text-[12.5px] uppercase tracking-[0.2em] font-editorial-serif transition-colors cursor-pointer shadow-sm"
              >
                Respond to Invitation ✉
              </button>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* 10. 축하 메시지 (Guestbook - 에디토리얼 독자 기고란 스타일) */}
      {showGuestbookSection && (
        <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center border-b border-stone-200/80">
          <ScrollReveal>
            {/* 섹션 챕터 헤더 */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-5 h-px bg-stone-300" />
              <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 font-medium">
                CHAPTER 09 · GUESTBOOK
              </span>
              <span className="w-5 h-px bg-stone-300" />
            </div>
            <h2 className="font-editorial-title text-[32px] sm:text-[36px] text-stone-900 leading-tight tracking-normal mb-2">
              Warm Wishes
            </h2>
            <p className="font-korean-serif text-[13.5px] text-stone-600 mb-10">
              두 사람의 앞날을 축복하는 마음을 남겨주세요.
            </p>

            {/* 방명록 메시지 카드 (매거진 독자 카드 스타일) */}
            {guestbookList.length > 0 ? (
              <div className="max-w-[360px] mx-auto mb-8 p-6 sm:p-7 bg-stone-50/70 border border-stone-200/90 min-h-[140px] flex flex-col justify-between relative text-left">
                <span className="font-editorial-serif italic text-3xl text-stone-300 block leading-none mb-2">
                  “
                </span>
                <p className="font-korean-serif text-[14.5px] text-stone-800 leading-relaxed whitespace-pre-line mb-4 font-normal">
                  {guestbookList[guestbookIndex]?.content}
                </p>
                <div className="flex items-center justify-between text-xs text-stone-400 font-sans border-t border-stone-200/60 pt-3">
                  <span className="font-editorial-serif italic tracking-wide text-stone-600">
                    — From. {guestbookList[guestbookIndex]?.author}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-stone-400">
                      {guestbookIndex + 1} / {guestbookList.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetMsg(guestbookList[guestbookIndex])}
                      className="hover:text-stone-700 cursor-pointer text-[11px] underline underline-offset-2"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="font-korean-serif text-stone-400 text-sm mb-8">
                첫 번째 축하 메시지의 주인공이 되어주세요.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowGuestbookModal(true)}
              className="py-3 px-8 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors text-xs uppercase tracking-widest font-editorial-serif cursor-pointer"
            >
              Write Message · 글 남기기
            </button>
          </ScrollReveal>
        </section>
      )}

      {/* 11. 엔딩 사진 & 매거진 백커버 (Back Cover & Colophon) */}
      <section className="pt-24 sm:pt-32 pb-24 sm:pb-32 px-6 bg-white text-center">
        <ScrollReveal duration={1000}>
          {/* 매거진 백커버 사진 액자 */}
          {endingImage && (
            <div className="max-w-[340px] mx-auto mb-10 overflow-hidden bg-white p-2 border border-stone-200 shadow-sm">
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

          <h2 className="font-editorial-title italic text-[44px] sm:text-[48px] text-stone-900 leading-none mb-3">
            Thank you
          </h2>
          <p className="font-korean-serif text-[14px] text-stone-600 mb-2">
            소중한 발걸음으로 축복해 주셔서 진심으로 감사합니다.
          </p>

          {/* 에디토리얼 매거진 백커버 판권지 (Colophon & Barcode) */}
          <div className="max-w-[300px] mx-auto mt-12 pt-8 border-t border-stone-200 text-stone-400 font-editorial-serif">
            <p className="text-[11px] tracking-[0.25em] uppercase text-stone-500 font-semibold mb-1">
              THE WEDDING OF {displayNamesEn}
            </p>
            <p className="text-[10px] tracking-widest text-stone-400 mb-6 font-mono">
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
              <p className="font-mono text-[9px] tracking-widest text-stone-400 uppercase mt-4 select-none">
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
          className="flex-1 py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] text-xs font-medium rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.708 4.8 4.27 6.054-.187.698-.675 2.528-.773 2.915-.121.482.177.476.372.346.154-.102 2.45-1.666 3.442-2.344.56.082 1.127.129 1.689.129 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
          </svg>
          <span>카카오톡 공유하기</span>
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="py-3 px-5 border border-stone-300 hover:border-stone-900 text-stone-800 text-xs font-medium rounded-none transition-colors cursor-pointer"
        >
          링크 복사
        </button>
      </div>

      {/* 시안 2 전용 에디토리얼 팝업 모달 */}
      {showContactModal && (
        <EditorialContactModal invitation={invitation} onClose={() => setShowContactModal(false)} />
      )}
      {showRsvpModal && (
        <EditorialRsvpModal invitationId={invitation?.id} onClose={() => setShowRsvpModal(false)} />
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
