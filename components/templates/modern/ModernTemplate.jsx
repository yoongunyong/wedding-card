'use client';

import { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import RsvpModal from '@/components/RsvpModal';
import KakaoMap from '@/components/KakaoMap';

export default function ModernTemplate({ invitation }) {
  const extra = invitation?.extra_data || {};

  // 본문 메인 풀스크린 사진 (extra_data.main_image 우선 사용)
  const mainImage = extra.main_image || invitation?.cover_image || '/temp/cover.jpg';

  // 고객 커스텀 타이틀 색상 (DB extra_data.title_color 우선, 기본값은 골드톤)
  const titleColor = extra.title_color || '#E5A866';

  // 계좌 아코디언 상태
  const [openGroom, setOpenGroom] = useState(true);
  const [openBride, setOpenBride] = useState(true);

  // 실시간 카운트다운 타이머
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 });

  useEffect(() => {
    const targetDate = new Date(invitation?.wedding_date_iso || '2027-03-27T11:00:00');

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
  }, [invitation?.wedding_date_iso]);

  // 동적 달력 생성 로직
  const calendarData = useMemo(() => {
    const targetDate = new Date(invitation?.wedding_date_iso || '2027-03-27T11:00:00');
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const weddingDay = targetDate.getDate();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    return {
      year,
      month: month + 1,
      weddingDay,
      firstDayIndex,
      totalDays,
    };
  }, [invitation?.wedding_date_iso]);

  // 클립보드 복사 함수
  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} 복사되었습니다.`);
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  // 카카오톡 공식 메시지 카드 공유 핸들러 (버튼 2개: 청첩장 보기 + 위치 보기)
  const handleKakaoShare = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = `${invitation?.groom_name || '윤건용'} ♥ ${invitation?.bride_name || '장성경'} 결혼식에 초대합니다`;
    const shareDesc = `${invitation?.wedding_date || '2026년 11월 14일 토요일 오후 2시'} | ${invitation?.venue_name || ' '}`;
    const shareImg = extra.share_image || mainImage;
    
    // 카카오맵 검색/길찾기 링크 (식장 위치보기용)
    const mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(invitation?.venue_name || ' ')}`;

    // 1. Kakao SDK 초기화 상태 확인 및 메시지 카드 발송
    if (typeof window !== 'undefined' && window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: shareDesc,
          imageUrl: shareImg,
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl, // PC 카톡에서 '모바일에서 확인하세요'가 뜨지 않게 필수 지정
          },
        },
        buttons: [
          {
            title: '청첩장 보기',
            link: {
              mobileWebUrl: currentUrl,
              webUrl: currentUrl,
            },
          },
          {
            title: '위치 보기',
            link: {
              mobileWebUrl: mapUrl,
              webUrl: mapUrl,
            },
          },
        ],
      });
      return;
    }

    // 2. 모바일 브라우저 네이티브 공유 API 지원 시
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareDesc,
        url: currentUrl,
      }).catch((err) => {
        if (err.name !== 'AbortError') handleCopy(currentUrl, '청첩장 주소가');
      });
      return;
    }

    // 3. Fallback: 주소 복사
    handleCopy(currentUrl, '청첩장 주소가');
  };

  // 계좌 데이터
  const groomAccounts = (invitation?.accounts || []).filter((a) => a.group === '신랑측' || a.side === 'groom');
  const brideAccounts = (invitation?.accounts || []).filter((a) => a.group === '신부측' || a.side === 'bride');

  // 모달 제어용 (RSVP)
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  // 갤러리 이미지 데이터
  const galleryImages = invitation?.gallery_images && invitation.gallery_images.length > 0
    ? invitation.gallery_images
    : ['/temp/1.jpg', '/temp/2.jpg', '/temp/3.jpg', '/temp/4.jpg', '/temp/5.jpg', '/temp/6.jpg', '/temp/7.jpg', '/temp/8.jpg'];

  return (
    <div className="w-full max-w-[430px] bg-[#FCFBF7] text-[#333333] min-h-screen flex flex-col font-serif shadow-2xl antialiased selection:bg-stone-200">
      
      {/* 카카오 SDK 로드 및 초기화 */}
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Kakao && !window.Kakao.isInitialized()) {
            const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
            if (kakaoKey) {
              window.Kakao.init(kakaoKey);
            }
          }
        }}
      />

      {/* 캘리그라피 웹폰트 직접 로드 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Pinyon+Script&display=swap');
        .calligraphy-title {
          font-family: 'Pinyon Script', 'Alex Brush', cursive !important;
        }
      `}</style>

      {/* 1. 메인 커버 (본문 최상단 전체화면 100dvh - main.png) */}
      <section className="relative w-full h-[100dvh] min-h-[100vh] overflow-hidden flex flex-col justify-between">
        <img
          src={mainImage}
          alt="Wedding Main Cover"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40" />

        {/* 상단 캘리그라피 문구 (we are getting married!) & 날짜 - Safe Area 대응 패딩 */}
        <div className="relative z-10 pt-[calc(env(safe-area-inset-top,0px)+3rem)] px-6 text-center select-none">
          <p
            className="calligraphy-title text-5xl sm:text-6xl tracking-normal leading-[1.15] drop-shadow-md"
            style={{ color: titleColor }}
          >
            we are<br />getting married!
          </p>
          <p
            className="mt-3 text-sm sm:text-base tracking-[0.25em] uppercase font-serif font-light drop-shadow-sm"
            style={{ color: titleColor }}
          >
            {extra.main_date_en || '2027.03.27 SAT'}
          </p>
        </div>

        {/* 하단 좌우 신부/신랑 이름 & 스크롤 유도 화살표 - Safe Area 대응 패딩 */}
        <div className="relative z-10 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] px-8 space-y-4">
          <div className="flex justify-between text-white/95 text-base tracking-wider font-light drop-shadow">
            <span>{invitation?.bride_name || '장성경'}</span>
            <span>{invitation?.groom_name || '윤건용'}</span>
          </div>
          <div className="flex justify-center text-white/70 text-xs animate-bounce">
            <span>▼</span>
          </div>
        </div>
      </section>

      {/* 2. 초대합니다 (모시는 글) */}
      <section className="py-20 px-6 text-center bg-[#FCFBF7]">
        <h2 className="text-xl font-medium text-[#222222] tracking-wider mb-8">초대합니다</h2>
        <div className="text-[15px] leading-[2.6] text-[#4A4541] font-light space-y-6 break-keep">
          <p>
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
        </div>

        <div className="w-[1px] h-12 bg-[#E2DED6] mx-auto my-12" />

        {/* 혼주 관계 표기 */}
        <div className="text-[14px] text-[#555555] space-y-2.5 mb-10 font-light tracking-wide">
          <p>
            {invitation?.groom_father || '신랑아버지'} · {invitation?.groom_mother || '신랑 어머니'}의 아들{' '}
            <span className="font-medium text-[#222]">{invitation?.groom_name || '윤건용'}</span>
          </p>
          <p>
            {invitation?.bride_father || '장철규'} · {invitation?.bride_mother || '이정자'}의 딸{' '}
            <span className="font-medium text-[#222]">{invitation?.bride_name || '장성경'}</span>
          </p>
        </div>

        {/* 축하 연락하기 버튼 */}
        <button
          onClick={() => alert(`신랑: ${invitation?.groom_phone || '010-0000-0000'}\n신부: ${invitation?.bride_phone || '010-0000-0000'}`)}
          className="inline-flex items-center gap-2 px-7 py-3 bg-[#F4F1EA] hover:bg-[#ECE7DC] text-[#333] rounded-full text-[13px] font-medium transition-colors shadow-sm"
        >
          <span>축하 연락하기</span>
          <span className="text-[12px]">📞</span>
        </button>

        {/* 신랑 신부 프로필 사진 (원형 w-32 h-32) */}
        <div className="mt-16">
          <p className="font-serif italic text-sm text-[#8C8479] mb-8">we are getting married</p>
          <div className="flex justify-center items-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden mx-auto mb-3.5 border-2 border-[#E8E2D8] shadow-md bg-stone-100">
                <img
                  src={extra.groom_profile_image || mainImage}
                  alt="신랑"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-[#888]">신랑</p>
              <p className="text-base font-medium text-[#222] mt-0.5">{invitation?.groom_name || '윤건용'}</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden mx-auto mb-3.5 border-2 border-[#E8E2D8] shadow-md bg-stone-100">
                <img
                  src={extra.bride_profile_image || mainImage}
                  alt="신부"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-[#888]">신부</p>
              <p className="text-base font-medium text-[#222] mt-0.5">{invitation?.bride_name || '장성경'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Wedding Day (동적 캘린더 생성) */}
      <section className="py-20 px-6 bg-[#FAF8F2] text-center border-t border-[#F0EAE0]">
        <h2 className="text-3xl font-serif text-[#2C2928] tracking-wider mb-4">Wedding Day</h2>
        <p className="text-sm text-[#333] font-medium tracking-wide">
          {invitation?.wedding_date || '2027년 3월 27일 토요일 | 오후 11시'}
        </p>
        <p className="text-xs text-[#8C857B] mt-1 mb-8">
          {extra.main_date_en || 'Saturday, March 27, 2027 | AM 11:00'}
        </p>

        {/* 동적 캘린더 */}
        <div className="max-w-[320px] mx-auto pt-6 border-t border-[#EAE3D5]">
          <div className="grid grid-cols-7 text-center text-xs text-[#8C857B] mb-5 font-sans font-medium">
            <span className="text-[#E76C53]">일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span>토</span>
          </div>

          <div className="grid grid-cols-7 text-center text-xs gap-y-4 text-[#333] font-sans">
            {Array.from({ length: calendarData.firstDayIndex }).map((_, idx) => (
              <span key={`empty-${idx}`} />
            ))}

            {Array.from({ length: calendarData.totalDays }).map((_, idx) => {
              const day = idx + 1;
              const isWeddingDay = day === calendarData.weddingDay;
              const dayOfWeek = (calendarData.firstDayIndex + idx) % 7;
              const isSunday = dayOfWeek === 0;

              return (
                <div key={`day-${day}`} className="relative flex items-center justify-center">
                  {isWeddingDay ? (
                    <span className="w-8 h-8 rounded-full bg-[#F7EBB7] text-[#333] flex items-center justify-center font-bold z-10 shadow-sm">
                      {day}
                    </span>
                  ) : (
                    <span className={isSunday ? 'text-[#E76C53]' : ''}>{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 카운트다운 */}
        <div className="grid grid-cols-4 gap-2.5 max-w-[320px] mx-auto mt-12 mb-8">
          {[
            { label: 'DAYS', val: timeLeft.days },
            { label: 'HOURS', val: timeLeft.hours },
            { label: 'MINUTES', val: timeLeft.minutes },
            { label: 'SECONDS', val: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="bg-white py-3.5 px-1 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#EAE3D5] text-center">
              <span className="text-[10px] text-[#A39C93] block font-sans tracking-wider">{item.label}</span>
              <span className="text-2xl font-medium text-[#222] font-sans mt-0.5 block">{item.val}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-[#444] tracking-wide">
          {invitation?.groom_name || '윤건용'} ♥ {invitation?.bride_name || '장성경'}님의 결혼식이{' '}
          <span className="text-[#E76C53] font-semibold">{timeLeft.totalDays}일</span> 남았습니다.
        </p>
      </section>

      {/* 4. 웨딩 갤러리 (2열 비대칭 매거진 앨범 레이아웃) */}
      <section className="py-20 px-4 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 1.svg" alt="" className="w-7 h-7 mx-auto mb-2 opacity-80" />
        <h2 className="text-lg text-[#222] tracking-wider mb-8">웨딩 갤러리</h2>

        <div className="grid grid-cols-2 gap-2 max-w-[380px] mx-auto items-start">
          <div className="flex flex-col gap-2">
            {galleryImages[0] && (
              <div className="w-full h-[320px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[0]}
                  alt="Wedding Photo 1"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            {galleryImages[2] && (
              <div className="w-full h-[190px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[2]}
                  alt="Wedding Photo 3"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            {galleryImages[4] && (
              <div className="w-full h-[170px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[4]}
                  alt="Wedding Photo 5"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            {galleryImages[6] && (
              <div className="w-full h-[240px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[6]}
                  alt="Wedding Photo 7"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {galleryImages[1] && (
              <div className="w-full h-[160px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[1]}
                  alt="Wedding Photo 2"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            {galleryImages[3] && (
              <div className="w-full h-[210px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[3]}
                  alt="Wedding Photo 4"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            {galleryImages[5] && (
              <div className="w-full h-[250px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[5]}
                  alt="Wedding Photo 6"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            {galleryImages[7] && (
              <div className="w-full h-[160px] overflow-hidden bg-[#EFECE6]">
                <img
                  src={galleryImages[7]}
                  alt="Wedding Photo 8"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        <button className="mt-10 px-14 py-3.5 bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs font-medium text-[#444] rounded-xl transition-colors shadow-sm">
          더보기
        </button>
      </section>

      {/* 5. 식장 위치 & 지도 & 교통 안내 */}
      <section className="py-20 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <div className="px-6">
          <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 2.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-80" />
          <h2 className="text-lg text-[#222] tracking-wider mb-4">식장 위치</h2>
          <p className="text-base font-medium text-[#222] mb-1">{invitation?.venue_name || '호텔금오산 컨벤션센터'}</p>
          <div className="inline-flex items-center gap-1.5 text-[13px] text-[#666] mb-8">
            <span>{invitation?.venue_address || '경북 구미시 금오산로 400'}</span>
            <button
              onClick={() => handleCopy(invitation?.venue_address || '경북 구미시 금오산로 400', '주소가')}
              className="text-[#999] hover:text-[#333] text-sm"
            >
              📋
            </button>
          </div>

          <div className="mb-5">
            <KakaoMap
              address={invitation?.venue_address}
              venueName={invitation?.venue_name}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-12">
            <button
              onClick={() =>
                window.open(
                  `https://map.naver.com/v5/search/${encodeURIComponent(
                    invitation?.venue_name || '호텔금오산'
                  )}`
                )
              }
              className="py-3 px-4 rounded-xl bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs text-[#333] font-sans flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
            >
              <span>네이버 지도</span>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="#03C75A"
                />
                <circle cx="12" cy="9" r="2.8" fill="#FFFFFF" />
              </svg>
            </button>

            <button
              onClick={() =>
                window.open(
                  `https://map.kakao.com/link/search/${encodeURIComponent(
                    invitation?.venue_name || '호텔금오산'
                  )}`
                )
              }
              className="py-3 px-4 rounded-xl bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs text-[#333] font-sans flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
            >
              <span>카카오 내비</span>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <rect width="24" height="24" rx="5" fill="#FEE500" />
                <path
                  d="M12 5.5l5.5 12-5.5-2.8-5.5 2.8L12 5.5z"
                  fill="#1E1E1E"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 교통편 상세 카드 목록 */}
        <div className="bg-[#F8F7F4] py-10 px-6 space-y-4 text-left font-sans">
          <div className="bg-white p-5 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] border border-stone-100">
            <p className="font-semibold text-[13px] text-[#222] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1.5">
              주차안내 <span className="text-xs text-stone-400">🅿</span>
            </p>
            <p className="text-xs text-[#555] leading-relaxed break-keep">
              {extra.parking_info || '주차공간이 협소하오니, 되도록 대중교통을 이용해 주시기 바랍니다.\n특히, 주말은 오전 시간대에 만차가 되니 부득이하게 주차가 필요하신 분들은 예식장에 전화 부탁드립니다.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] border border-stone-100">
            <p className="font-semibold text-[13px] text-[#222] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1.5">
              자차 <span className="text-xs text-stone-400">🚗</span>
            </p>
            <p className="text-xs text-[#555] leading-relaxed break-keep">
              {extra.car_info || `네비게이션 : '${invitation?.venue_name || '금오산 호텔'}' 검색\n${invitation?.venue_address || '경북 구미시 금오산로 400 호텔금오산 컨벤션센터'}`}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] border border-stone-100">
            <p className="font-semibold text-[13px] text-[#222] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1.5">
              버스 <span className="text-xs text-stone-400">🚌</span>
            </p>
            <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line break-keep">
              {extra.bus_info || '172 (우리은행종로지점 방면)\n서울광장역 하차 → 도보 5분\n\n405 (롯데백화점 방면)\n서울광장역 하차 → 도보 5분'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] border border-stone-100">
            <p className="font-semibold text-[13px] text-[#222] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1.5">
              지하철 <span className="text-xs text-stone-400">🚇</span>
            </p>
            <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line break-keep">
              {extra.subway_info || '[1호선] 시청역 4번 출구\n[2호선] 을지로입구역 하차 후 시청 방면'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. 마음 전하실 곳 */}
      <section className="py-20 px-6 bg-[#EFECE4] text-center">
        <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 3.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-80" />
        <h2 className="text-lg text-[#222] tracking-wider mb-8">마음 전하실 곳</h2>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm text-left mb-4 border border-[#E6E1D6]">
          <button
            onClick={() => setOpenGroom(!openGroom)}
            className="w-full py-4 px-5 flex items-center justify-between text-xs text-[#333] font-sans font-medium"
          >
            <span>신랑측 계좌번호</span>
            <svg
              className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${openGroom ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openGroom && (
            <div className="px-5 pb-5 pt-1 divide-y divide-stone-100">
              {(groomAccounts.length > 0 ? groomAccounts : [
                { name: '신랑 윤건용', bank: '하나은행', number: '504-910579-89707' },
                { name: '신랑 윤건용', bank: '신한은행', number: '504-910579-89707' },
              ]).map((acc, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs font-sans">
                  <div>
                    <p className="text-xs text-[#888]">{acc.name}</p>
                    <p className="text-xs text-[#222] font-medium mt-0.5">{acc.bank} {acc.number}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name} 계좌번호가`)}
                    className="px-3.5 py-1.5 bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs text-[#444] rounded-full transition-colors"
                  >
                    복사하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm text-left border border-[#E6E1D6]">
          <button
            onClick={() => setOpenBride(!openBride)}
            className="w-full py-4 px-5 flex items-center justify-between text-xs text-[#333] font-sans font-medium"
          >
            <span>신부측 계좌번호</span>
            <svg
              className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${openBride ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openBride && (
            <div className="px-5 pb-5 pt-1 divide-y divide-stone-100">
              {(brideAccounts.length > 0 ? brideAccounts : [
                { name: '신부 장성경', bank: '하나은행', number: '504-910579-89707' },
                { name: '신부 장성경', bank: '신한은행', number: '504-910579-89707' },
              ]).map((acc, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs font-sans">
                  <div>
                    <p className="text-xs text-[#888]">{acc.name}</p>
                    <p className="text-xs text-[#222] font-medium mt-0.5">{acc.bank} {acc.number}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name} 계좌번호가`)}
                    className="px-3.5 py-1.5 bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs text-[#444] rounded-full transition-colors"
                  >
                    복사하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. 정보 (식사안내) */}
      <section className="py-20 px-6 bg-white text-center border-t border-[#F2ECE1]">
        <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 4.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-80" />
        <h2 className="text-lg text-[#222] tracking-wider mb-6">정보</h2>

        <div className="relative max-w-[320px] mx-auto">
          <div className="bg-[#FAF8F5] rounded-2xl p-7 text-center border border-[#ECE7DE] shadow-sm">
            <h3 className="text-sm font-medium text-[#222] mb-1">식사안내</h3>
            <p className="text-xs text-[#777] mb-4">PM 14:00~ 16:00 뷔페 이용 가능</p>
            <div className="w-full h-[1px] bg-[#EAE4D9] mb-4" />
            <p className="text-xs text-[#555] leading-relaxed break-keep">
              {extra.meal_info || '교환권을 스테이크 코너에 제시해주시면 안심 스테이크가 제공됩니다.'}
            </p>
          </div>
          <div className="flex justify-center gap-1.5 mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#555]" />
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          </div>
        </div>
      </section>

      {/* 8. 참석 의사 (RSVP) */}
      <section className="py-24 px-6 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 5.svg" alt="" className="w-10 h-10 mx-auto mb-3 opacity-80" />
        <h2 className="text-lg text-[#222] tracking-wider mb-1">참석 의사</h2>
        <p className="text-xs text-[#777] font-light mb-8">모든 분들을 소중하게 모실 수 있도록 전해주세요</p>

        <div className="bg-white rounded-2xl p-7 max-w-[320px] mx-auto shadow-sm border border-[#EAE5DA] mb-6">
          <p className="text-base font-medium text-[#222] mb-4">
            신랑 {invitation?.groom_name || '윤건용'} ♥ 신부 {invitation?.bride_name || '장성경'}
          </p>
          <div className="w-full h-[1px] bg-stone-100 mb-4" />
          <p className="text-xs text-[#555] mb-1">{invitation?.wedding_date || '2027년 3월 27일 토요일 오전 11시'}</p>
          <p className="text-xs text-[#777]">{invitation?.venue_name || '호텔금오산 컨벤션센터'}</p>
        </div>

        <button
          onClick={() => setShowRsvpModal(true)}
          className="w-full max-w-[320px] py-4 bg-[#333333] hover:bg-[#222] text-white rounded-xl text-xs tracking-wider transition-colors shadow-sm font-medium"
        >
          참석 정보 전달하기
        </button>

        {showRsvpModal && (
          <RsvpModal
            invitationId={invitation?.id}
            groomName={invitation?.groom_name}
            brideName={invitation?.bride_name}
            onClose={() => setShowRsvpModal(false)}
          />
        )}
      </section>

      {/* 9. 방명록 */}
      <section className="py-20 px-6 bg-[#EFECE4] text-center">
        <div className="text-2xl mb-1">📖</div>
        <h2 className="text-lg text-[#222] tracking-wider mb-1">방명록</h2>
        <p className="text-xs text-[#777] font-light mb-8">저희 둘에게 따뜻한 메시지를 남겨주세요.</p>

        <div className="space-y-3 max-w-[320px] mx-auto mb-6 text-left">
          {[
            { name: '장성경', msg: '두 사람 꽃길 결혼 생활 예약🌷\n행복과 축복으로 가득하길 바래🤍' },
            { name: '윤건용', msg: '두 분의 새로운 시작을 진심으로 축하드립니다.\n행복한 가정 이루시길 바라요' },
            { name: '떡만이', msg: '드디어 결혼이라니 너무 축하해!\n예쁜 추억 많이 만들면서 행복하게 살아~' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-[#E4DFD5]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] italic px-2 py-0.5 border border-stone-200 rounded-full text-stone-500 font-serif">From</span>
                  <span className="text-xs font-medium text-[#222]">{item.name}</span>
                </div>
                <span className="text-stone-300 text-xs cursor-pointer">×</span>
              </div>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">{item.msg}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-[320px] mx-auto">
          <button className="py-3 bg-[#F4F1EA] hover:bg-[#EAE5DA] rounded-xl text-xs text-[#555] transition-colors flex items-center justify-center gap-1">
            <span>전체보기</span> <span>≡</span>
          </button>
          <button className="py-3 bg-[#F4F1EA] hover:bg-[#EAE5DA] rounded-xl text-xs text-[#555] transition-colors flex items-center justify-center gap-1">
            <span>작성하기</span> <span>✎</span>
          </button>
        </div>
      </section>

      {/* 10. 엔딩 커버 사진 */}
      <section className="relative w-full h-[460px] overflow-hidden">
        <img
          src={extra.ending_image || mainImage}
          alt="Ending Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-6">
          <p className="text-white text-base font-light tracking-widest drop-shadow-md">
            축하해주셔서 감사합니다.
          </p>
        </div>
      </section>

      {/* 11. 하단 공유 바 */}
      <footer className="py-8 px-6 bg-white space-y-2.5">
        <button
          onClick={handleKakaoShare}
          className="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-medium text-xs rounded-xl flex items-center justify-between font-sans transition-colors shadow-sm"
        >
          <span>카카오톡으로 공유하기</span>
          <img src="/templates/modern/카카오톡 공유하기 아이콘.svg" alt="" className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleCopy(window.location.href, '청첩장 주소가')}
          className="w-full py-3.5 px-4 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#333] text-xs rounded-xl flex items-center justify-between font-sans transition-colors"
        >
          <span>청첩장 주소 복사하기</span>
          <span className="text-xs text-stone-500">🔗</span>
        </button>
      </footer>

    </div>
  );
}