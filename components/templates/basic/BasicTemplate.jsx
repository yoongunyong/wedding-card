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
import ScrollReveal from '@/components/ScrollReveal';

export default function BasicTemplate({ invitation }) {
  const extra = invitation?.extra_data || {};

  // 0. 인트로 편지 봉투 커버 상태
  const [showIntro, setShowIntro] = useState(true);

  // 모달 제어 상태
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);

  // 갤러리 더보기 상태
  const [showMorePhotos, setShowMorePhotos] = useState(false);

  // 계좌 아코디언 상태
  const [openGroomAccount, setOpenGroomAccount] = useState(true);
  const [openBrideAccount, setOpenBrideAccount] = useState(true);

  // 고객 커스텀 타이틀 색상 (DB extra_data.title_color 우선, 기본값은 #E5A866)
  const titleColor = extra.title_color || '#E5A866';

  // 본문 메인 풀스크린 사진 (extra.main_image 최우선 사용)
  const mainImage = extra.main_image || invitation?.main_image || invitation?.cover_image || '/cover.jpg';
  const hasBakedInText = typeof mainImage === 'string' && mainImage.includes('cover.jpg');

  // 신랑/신부 프로필 사진 (extra_data.groom_profile_image / bride_profile_image 최우선 매핑)
  const groomPhoto = extra.groom_profile_image || invitation?.groom_photo || extra.groom_photo || '/groom.jpg';
  const bridePhoto = extra.bride_profile_image || invitation?.bride_photo || extra.bride_photo || '/bride.jpg';

  // 엔딩 사진 (extra_data.ending_image 최우선 매핑)
  const endingImage = extra.ending_image || invitation?.ending_image || '/ending.jpg';

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

  // 갤러리 기본 이미지 목록 (사용자 Supabase Storage 등록 경로)
  const defaultGalleryImages = [
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_01.png',
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_02.png',
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_03.png',
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_04.png',
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_05.png',
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_06.png',
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_07.png',
    'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/wedding-images/kkeomuk/photo_08.png',
  ];

  const parsedGallery = parseGalleryImages(invitation?.gallery_images);
  const initialGalleryImages = parsedGallery || defaultGalleryImages;

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
  }, [targetDate]);

  const formattedEnglishDate = useMemo(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = targetDate.toLocaleDateString('en-US', options);
    const hours = targetDate.getHours();
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHour = String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, '0');
    const minutes = String(targetDate.getMinutes()).padStart(2, '0');
    return `${dateStr} | ${period} ${displayHour}:${minutes}`;
  }, [targetDate]);

  // 2. 정보(식사/셔틀) 자동 롤링 슬라이더
  const infoCards = [
    {
      title: '식사안내',
      subtitle: 'PM 14:00~ 16:00 뷔페 이용 가능',
      content: extra.meal_info || '교환권을 스테이크 코너에 제시해주시면 안심 스테이크가 제공됩니다.',
    },
    {
      title: '셔틀버스 안내',
      subtitle: '운행 시간 11:00~ 16:00',
      content: extra.shuttle_info || '셔틀버스 15분-20분 간격으로 운행하오니 이용시 참고해 주시기 바랍니다.',
    },
  ];
  const [infoIndex, setInfoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setInfoIndex((prev) => (prev + 1) % infoCards.length);
    }, 4500); // 4.5초마다 자동 롤링
    return () => clearInterval(timer);
  }, [infoCards.length]);

  // 3. 방명록 데이터 & 자동 롤링 슬라이더
  const defaultGuestbook = [
    { id: '1', author: '장성경', content: '두 사람 꽃길 결혼 생활 예약🌹\n행복과 축복으로 가득하길 바래🤍', created_at: '2027.10.21' },
    { id: '2', author: '윤건용', content: '두 분의 새로운 시작을\n진심으로 축하드려요.', created_at: '2027.10.21' },
    { id: '3', author: '떡만이', content: '드디어 결혼이라니 너무 축하해!\n예쁜 추억 많이 만들면서 행복하게 살아~', created_at: '2027.10.21' },
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
  const defaultAccounts = [
    { bank: '하나은행', number: '504-910579-89707', name: invitation?.groom_name || '권기득' },
    { bank: '신한은행', number: '504-910579-89707', name: invitation?.groom_name || '권기득' },
    { bank: '우리은행', number: '504-910579-89707', name: invitation?.groom_name || '권기득' },
  ];

  // 클립보드 복사 함수
  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} 복사되었습니다.`);
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `${invitation?.groom_name || '권기득'} ♥ ${invitation?.bride_name || '장민기'} 결혼식에 초대합니다`;
    const shareDesc = `${formattedKoreanDate} | ${invitation?.venue_name || '호텔금오산 컨벤션센터'}`;
    const shareImg = extra.share_image || mainImage;
    const mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(invitation?.venue_name || '호텔금오산')}`;

    if (typeof window !== 'undefined' && window.Kakao && window.Kakao.isInitialized()) {
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
          { title: '위치 보기', link: { mobileWebUrl: mapUrl, webUrl: mapUrl } },
        ],
      });
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: shareTitle, text: shareDesc, url: currentUrl }).catch(() => {});
      return;
    }
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
      {showIntro && (
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
              <p className="mt-2 text-xs sm:text-sm text-white/90 font-sans tracking-[0.25em] drop-shadow-sm">
                {extra.main_date_en || `${calendarData.year}.${String(calendarData.month).padStart(2, '0')}.${String(calendarData.weddingDay).padStart(2, '0')} SAT`}
              </p>
            </div>

            {/* 하단: Welcome to & 신랑 신부 영문 이름 */}
            <div className="relative z-10 pb-[calc(env(safe-area-inset-bottom,0px)+3rem)] px-6 text-center">
              <p 
                className="font-script text-2xl drop-shadow"
                style={{ color: titleColor }}
              >
                Welcome to
              </p>
              <p className="font-cormorant italic text-2xl sm:text-3xl text-white font-medium tracking-wide drop-shadow-md mt-1">
                {invitation?.bride_name_en || ' '} &amp; {invitation?.groom_name_en || ' '}
              </p>
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
              <span className="text-stone-500">{invitation?.groom_father || '신랑아버지'} · {invitation?.groom_mother || '신랑 어머니'}의 아들</span>{' '}
              <strong className="font-medium text-stone-900">{invitation?.groom_name || '권기득'}</strong>
            </p>
            <p>
              <span className="text-stone-500">{invitation?.bride_father || '장철규'} · {invitation?.bride_mother || '이정자'}의 딸</span>{' '}
              <strong className="font-medium text-stone-900">{invitation?.bride_name || '장민기'}</strong>
            </p>
          </div>

          {/* 축하 연락하기 버튼 */}
          <button
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm font-medium rounded-full font-sans transition-colors mb-16 shadow-2xs"
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
                <p className="text-sm font-sans font-medium text-stone-800">{invitation?.groom_name || '권기득'}</p>
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
                <p className="text-sm font-sans font-medium text-stone-800">{invitation?.bride_name || '장민기'}</p>
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
            {calendarData.year}년 {calendarData.month}월 {calendarData.weddingDay}일 토요일 | 오전 11시
          </p>
          <p className="text-xs text-stone-400 font-sans tracking-wide mb-8">
            {formattedEnglishDate}
          </p>

          {/* 달력 컨테이너 */}
          <div className="max-w-[320px] mx-auto mb-10 pt-4 border-t border-[#EDE7DD]">
            <div className="grid grid-cols-7 gap-y-3.5 text-center text-xs text-stone-600 font-sans">
              <span className="text-[#E0645A] font-medium">일</span>
              <span className="text-stone-400 font-medium">월</span>
              <span className="text-stone-400 font-medium">화</span>
              <span className="text-stone-400 font-medium">수</span>
              <span className="text-stone-400 font-medium">목</span>
              <span className="text-stone-400 font-medium">금</span>
              <span className="text-stone-400 font-medium">토</span>

              {/* 시작 요일 빈 칸 */}
              {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}

              {/* 일자 */}
              {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                const day = i + 1;
                const isSunday = (calendarData.firstDayIndex + i) % 7 === 0;
                const isWeddingDay = day === calendarData.weddingDay;

                return (
                  <div key={day} className="flex items-center justify-center">
                    {isWeddingDay ? (
                      <span className="w-7 h-7 rounded-full bg-[#FCE8A6] text-stone-800 font-semibold flex items-center justify-center shadow-xs">
                        {day}
                      </span>
                    ) : (
                      <span className={isSunday ? 'text-[#E0645A]' : 'text-stone-600'}>
                        {day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

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
                <span className="font-cormorant text-2xl font-semibold text-stone-800 mt-1">{item.val}</span>
              </div>
            ))}
          </div>

          {/* D-Day 남은 일수 강조 문구 */}
          <p className="text-xs text-stone-600 font-sans">
            {invitation?.groom_name || '기득'} ♥ {invitation?.bride_name || '민기'}님의 결혼식이{' '}
            <strong className="text-[#E0645A] font-semibold">{timeLeft.totalDays}일</strong> 남았습니다.
          </p>
        </ScrollReveal>
      </section>

      {/* 4. 웨딩 갤러리 (Image 4) */}
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
            <p className="text-base font-sans font-medium text-stone-800 mb-1">
              {invitation?.venue_name || '호텔금오산 컨벤션센터'}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-stone-500 mb-8 font-sans">
              <span>{invitation?.venue_address || '경북 구미시 금오산로 400'}</span>
              <button 
                onClick={() => handleCopy(invitation?.venue_address || '경북 구미시 금오산로 400', '식장 주소가')}
                className="hover:opacity-75 transition-opacity"
                title="주소 복사"
              >
                📋
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* 카카오 지도 */}
        <ScrollReveal delay={200}>
          <div className="w-full max-w-[380px] mx-auto px-4 mb-6">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-stone-200">
              <KakaoMap 
                address={invitation?.venue_address || '경북 구미시 금오산로 400'} 
                venueName={invitation?.venue_name || '호텔금오산 컨벤션센터'} 
              />
            </div>
          </div>

          {/* 네이버 지도 / 카카오내비 버튼 2종 (시안 디자인 1:1 반영) */}
          <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto px-4 font-sans">
            <button
              onClick={() => window.open(`https://map.naver.com/p/search/${encodeURIComponent(invitation?.venue_name || '호텔금오산')}`, '_blank')}
              className="py-3 px-4 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl shadow-2xs border border-stone-200/60 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <span>네이버 지도</span>
              <img src="/templates/basic/naver-map.svg" alt="네이버 지도" className="w-[18px] h-[18px] object-contain" />
            </button>
            <button
              onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(invitation?.venue_name || '호텔금오산')}`, '_blank')}
              className="py-3 px-4 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl shadow-2xs border border-stone-200/60 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <span>카카오네비</span>
              <img src="/templates/basic/kakao-navi.svg" alt="카카오내비" className="w-[18px] h-[18px] object-contain" />
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* 6. 교통편 상세 안내 (Image 6) */}
      <section className="py-16 px-6 bg-[#F7F7F7] space-y-4 font-sans">
        {/* 1. 주차안내 */}
        <ScrollReveal delay={0}>
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-100">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-semibold text-sm text-stone-800">주차안내</span>
              <img src="/templates/basic/transportation-parking.svg" alt="주차" className="w-4 h-4 object-contain opacity-75" />
            </div>
            <div className="w-full h-px bg-stone-100 mb-3.5" />
            <p className="text-xs text-stone-500 leading-relaxed break-keep">
              {extra.transport_parking || '주차공간이 협소하오니, 되도록 대중교통을 이용해 주시기 바랍니다. 특히, 주말은 오전 시간대에 만차가 되니 부득이하게 주차가 필요하신 분들은 예식장에 전화 부탁드립니다.'}
            </p>
          </div>
        </ScrollReveal>

        {/* 2. 자차 */}
        <ScrollReveal delay={100}>
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-100">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-semibold text-sm text-stone-800">자차</span>
              <img src="/templates/basic/transportation-of-car.svg" alt="자차" className="w-4 h-4 object-contain opacity-75" />
            </div>
            <div className="w-full h-px bg-stone-100 mb-3.5" />
            <p className="text-xs text-stone-500 leading-relaxed break-keep">
              {extra.transport_car || '네비게이션 : \'금오산 호텔\' 검색\n경북 구미시 금오산로 400 호텔금오산 컨벤션센터'}
            </p>
          </div>
        </ScrollReveal>

        {/* 3. 버스 */}
        <ScrollReveal delay={200}>
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-100">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-semibold text-sm text-stone-800">버스</span>
              <img src="/templates/basic/transportation-of-bus.svg" alt="버스" className="w-4 h-4 object-contain opacity-75" />
            </div>
            <div className="w-full h-px bg-stone-100 mb-3.5" />
            <p className="text-xs text-stone-500 leading-relaxed break-keep whitespace-pre-line">
              {extra.transport_bus || '172(우리은행종로지점 방면)\n서울광장역 하차 → 데미타스커피 왼쪽 방면 → 도보 5분\n\n405(롯데백화점 방면)\n서울광장역 하차 → 데미타스커피 왼쪽 방면 → 도보 5분'}
            </p>
          </div>
        </ScrollReveal>

        {/* 4. 지하철 */}
        <ScrollReveal delay={300}>
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-100">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-semibold text-sm text-stone-800">지하철</span>
              <img src="/templates/basic/transportation-of-subway.svg" alt="지하철" className="w-4 h-4 object-contain opacity-75" />
            </div>
            <div className="w-full h-px bg-stone-100 mb-3.5" />
            <p className="text-xs text-stone-500 leading-relaxed break-keep whitespace-pre-line">
              {extra.transport_subway || '[1호선] 시청역 4번 출구\n[2호선] 시청역 4번 출구\n[2호선] 을지로입구역 하차 후 서울시청 방면 지하 연결출구'}
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* 7. 마음 전하실 곳 (Image 7) */}
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
              className="w-full py-4 px-5 flex items-center justify-between text-sm font-medium text-stone-700 bg-stone-100/70 hover:bg-stone-100 transition-colors"
            >
              <span>신랑측 계좌번호</span>
              <span className="text-stone-400 text-xs">{openGroomAccount ? '∧' : '∨'}</span>
            </button>

            {openGroomAccount && (
              <div className="p-4 space-y-3 bg-white">
                {(groomAccounts.length > 0 ? groomAccounts : defaultAccounts).map((acc, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div>
                      <p className="text-xs text-stone-500">{acc.name || '신랑 예금주'}</p>
                      <p className="text-xs font-medium text-stone-800 mt-0.5">{acc.bank} {acc.number}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name} 계좌번호가`)}
                      className="px-3.5 py-1.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-xs font-medium text-stone-600 rounded-full transition-colors font-sans"
                    >
                      복사하기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 신부측 아코디언 */}
          <div className="bg-[#FAF9F6] rounded-2xl overflow-hidden shadow-2xs border border-stone-200 text-left max-w-[340px] mx-auto font-sans">
            <button
              onClick={() => setOpenBrideAccount(!openBrideAccount)}
              className="w-full py-4 px-5 flex items-center justify-between text-sm font-medium text-stone-700 bg-stone-100/70 hover:bg-stone-100 transition-colors"
            >
              <span>신부측 계좌번호</span>
              <span className="text-stone-400 text-xs">{openBrideAccount ? '∧' : '∨'}</span>
            </button>

            {openBrideAccount && (
              <div className="p-4 space-y-3 bg-white">
                {(brideAccounts.length > 0 ? brideAccounts : defaultAccounts).map((acc, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div>
                      <p className="text-xs text-stone-500">{acc.name || '신부 예금주'}</p>
                      <p className="text-xs font-medium text-stone-800 mt-0.5">{acc.bank} {acc.number}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name} 계좌번호가`)}
                      className="px-3.5 py-1.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-xs font-medium text-stone-600 rounded-full transition-colors font-sans"
                    >
                      복사하기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* 8. 정보 (식사/셔틀 롤링 슬라이더) (Image 8) */}
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
          <div className="relative max-w-[320px] mx-auto flex items-center justify-center font-sans">
            
            {/* 이전 버튼 */}
            <button
              onClick={() => setInfoIndex((prev) => (prev > 0 ? prev - 1 : infoCards.length - 1))}
              className="absolute -left-6 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xl font-light"
              aria-label="이전 정보"
            >
              ‹
            </button>

            {/* 정보 카드 */}
            <div className="w-full bg-white rounded-2xl p-7 text-center border border-stone-200/80 shadow-xs transition-all duration-300 min-h-[170px] flex flex-col justify-center">
              <h3 className="text-sm font-semibold text-stone-800 mb-1">
                {infoCards[infoIndex].title}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {infoCards[infoIndex].subtitle}
              </p>
              <div className="w-full h-px bg-stone-100 mb-4" />
              <p className="text-xs text-stone-600 leading-relaxed break-keep">
                {infoCards[infoIndex].content}
              </p>
            </div>

            {/* 다음 버튼 */}
            <button
              onClick={() => setInfoIndex((prev) => (prev < infoCards.length - 1 ? prev + 1 : 0))}
              className="absolute -right-6 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xl font-light"
              aria-label="다음 정보"
            >
              ›
            </button>
          </div>

          {/* 하단 인디케이터 도트 */}
          <div className="flex justify-center gap-1.5 mt-4">
            {infoCards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setInfoIndex(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === infoIndex ? 'w-2 h-2 bg-stone-700' : 'w-1.5 h-1.5 bg-stone-300'
                }`}
              />
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* 9. 참석 의사 (RSVP) (Image 9) */}
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
              신랑 {invitation?.groom_name || '권기득'} ♥ 신부 {invitation?.bride_name || '장민기'}
            </p>
            <div className="w-full h-px bg-stone-200 mb-3" />
            <p className="text-xs text-stone-600 mb-1">
              {calendarData.year}년 {calendarData.month}월 {calendarData.weddingDay}일 토요일 오전 11시
            </p>
            <p className="text-xs text-stone-500">
              {invitation?.venue_name || '호텔금오산 컨벤션센터'}
            </p>
          </div>

          <button
            onClick={() => setShowRsvpModal(true)}
            className="w-full max-w-[320px] py-4 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded-xl text-sm font-medium tracking-wide transition-colors shadow-sm font-sans"
          >
            참석 정보 전달하기
          </button>
        </ScrollReveal>
      </section>

      {/* 10. 방명록 (Image 10) */}
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
          <div className="relative max-w-[320px] mx-auto flex items-center justify-center font-sans">
            {/* 이전 화살표 */}
            <button
              onClick={() => setGuestbookIndex((prev) => (prev > 0 ? prev - 1 : guestbookList.length - 1))}
              className="absolute -left-6 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xl font-light"
              aria-label="이전 방명록"
            >
              ‹
            </button>

            {/* 방명록 카드 */}
            <div className="w-full bg-white rounded-2xl p-6 text-center border border-stone-200 shadow-xs transition-all duration-300 min-h-[160px] flex flex-col justify-between">
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center px-3 py-1 border border-stone-200 rounded-full text-xs text-stone-600 font-serif">
                  <em className="text-[10px] text-stone-400 not-italic mr-1.5">From</em>
                  <strong className="font-medium">{guestbookList[guestbookIndex]?.author}</strong>
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line my-auto break-keep">
                {guestbookList[guestbookIndex]?.content}
              </p>
              <p className="text-[10px] text-stone-400 mt-3 font-sans">
                {guestbookList[guestbookIndex]?.created_at?.slice(0, 10).replace(/-/g, '.') || '2027.10.21'}
              </p>
            </div>

            {/* 다음 화살표 */}
            <button
              onClick={() => setGuestbookIndex((prev) => (prev < guestbookList.length - 1 ? prev + 1 : 0))}
              className="absolute -right-6 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 text-xl font-light"
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
              className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-[#F4F4F4] hover:bg-[#EAEAEA] text-stone-700 text-sm rounded-xl transition-colors shadow-2xs font-medium"
            >
              <span>작성하기</span>
              <span>✏️</span>
            </button>
          </div>
        </ScrollReveal>
      </section>

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

      {selectedGalleryIndex !== null && (
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
            setGuestbookList((prev) => [newMsg, ...prev]);
            setGuestbookIndex(0);
          }}
        />
      )}

    </div>
  );
}