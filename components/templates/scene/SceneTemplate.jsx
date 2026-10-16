'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Script from 'next/script';
import KakaoMap from '@/components/KakaoMap';
import ScrollReveal from '@/components/ScrollReveal';
import SceneInterviewModal from './SceneInterviewModal';
import SceneGalleryModal from './SceneGalleryModal';
import { supabase } from '@/lib/supabase';

export default function SceneTemplate({ invitation }) {
  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  // 1. 모달 상태
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 2. 갤러리 더보기 상태 (기본 9장 노출 ➔ 더보기 시 전체 노출)
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  // 3. 계좌 아코디언 토글 (기본 펼침)
  const [openGroomAccount, setOpenGroomAccount] = useState(true);
  const [openBrideAccount, setOpenBrideAccount] = useState(true);

  // 4. 정보 카드 캐러셀 인덱스
  const [infoCardIndex, setInfoCardIndex] = useState(0);

  // 5. 방명록 상태 & 페이징
  const [guestbookList, setGuestbookList] = useState([]);
  const [guestbookPage, setGuestbookPage] = useState(1);
  const [guestbookName, setGuestbookName] = useState('');
  const [guestbookMessage, setGuestbookMessage] = useState('');
  const [submittingGuestbook, setSubmittingGuestbook] = useState(false);

  // 6. 인페이지 RSVP 폼 상태 (영상 1:1 일치)
  const [rsvpAttend, setRsvpAttend] = useState(true); // true: 참석 가능, false: 참석 불가
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpSide, setRsvpSide] = useState('groom'); // 'groom' | 'bride'
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpMeal, setRsvpMeal] = useState('식사 가능'); // '미정' | '식사 가능' | '식사 불가'
  const [rsvpBus, setRsvpBus] = useState('미탑승'); // '탑승' | '미탑승'
  const [rsvpConsent, setRsvpConsent] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  // 기본 정보
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const coupleTitle = [groomName, brideName].filter(Boolean).join(' & ');

  // 부모님 정보
  const groomFather = invitation?.groom_father || '';
  const groomMother = invitation?.groom_mother || '';
  const brideFather = invitation?.bride_father || '';
  const brideMother = invitation?.bride_mother || '';

  const groomParents = [
    invitation?.groom_father_deceased ? `故 ${groomFather}` : groomFather,
    invitation?.groom_mother_deceased ? `故 ${groomMother}` : groomMother,
  ].filter(Boolean).join(' · ');

  const brideParents = [
    invitation?.bride_father_deceased ? `故 ${brideFather}` : brideFather,
    invitation?.bride_mother_deceased ? `故 ${brideMother}` : brideMother,
  ].filter(Boolean).join(' · ');

  const groomRelation = config.groom_relation || invitation?.groom_relation || '의 아들';
  const brideRelation = config.bride_relation || invitation?.bride_relation || '의 딸';

  // 이름만 추출 (성 제외, 영상 속 '세희', '지호'처럼 큰 글씨로 강조)
  const groomFirstNameOnly = groomName.length > 2 ? groomName.slice(1) : groomName;
  const brideFirstNameOnly = brideName.length > 2 ? brideName.slice(1) : brideName;

  // 대표 이미지
  const mainImage = images.main || images.cover || invitation?.main_image || '';
  const groomPhoto = images.groom_profile || extra.groom_profile_image || mainImage;
  const bridePhoto = images.bride_profile || extra.bride_profile_image || mainImage;

  // 갤러리 이미지 파싱
  const galleryImages = useMemo(() => {
    const raw = invitation?.gallery_images;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [invitation?.gallery_images]);

  // 상단 와이드 2장 & 하단 그리드 분리
  const widePhotos = galleryImages.slice(0, 2);
  const gridPhotos = galleryImages.slice(2);
  const visibleGridPhotos = galleryExpanded ? gridPhotos : gridPhotos.slice(0, 9);

  // 날짜 계산 (3열 캘린더용: 전날, 당일, 다음날)
  const weddingDateStr = invitation?.wedding_date ? invitation.wedding_date.replace(' ', 'T') : '';
  const targetDate = useMemo(() => {
    if (!weddingDateStr) return new Date();
    const d = new Date(weddingDateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [weddingDateStr]);

  const dateDetails = useMemo(() => {
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth() + 1;
    const d = targetDate.getDate();
    const hours = targetDate.getHours();
    const minutes = targetDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = String(minutes).padStart(2, '0');

    // 전날 & 다음날
    const prevDate = new Date(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const DOW_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const DOW_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    return {
      year: y,
      month: String(m).padStart(2, '0'),
      day: String(d).padStart(2, '0'),
      timeFull: `${displayHours}:${displayMinutes} ${ampm}`,
      dayEn: DOW_EN[targetDate.getDay()],
      dayKo: DOW_KO[targetDate.getDay()],
      prevDayNum: prevDate.getDate(),
      prevDayEn: DOW_EN[prevDate.getDay()],
      nextDayNum: nextDate.getDate(),
      nextDayEn: DOW_EN[nextDate.getDay()],
    };
  }, [targetDate]);

  // 신랑·신부 인터뷰 (Q&A) 목록 파싱
  const interviews = useMemo(() => {
    const raw = invitation?.interviews || config.interviews || extra.interviews;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    
    // 샘플 미리보기 모드용 기본값 (영상 속 내용)
    if (invitation?.is_sample_preview || invitation?.slug === 'scene') {
      return [
        {
          id: 1,
          question: '신랑 신부를 소개해 주세요',
          groom_answer: '차분하고 다정하지만 은근히 장난기가 많은 사람입니다. 표현이 화려한 편은 아니지만 필요한 순간에는 늘 먼저 손을 내밀어줘요. 제가 좋아한다고 한 음식이나 가고 싶다고 했던 곳도 조용히 기억해두는 든든한 사람입니다.',
          groom_label: '신랑 남세희(ISFJ)',
          bride_answer: '맛있는 음식과 예쁜 공간, 새로운 경험을 좋아하는 사람입니다. 좋으면 좋다고 바로 말하고, 웃음도 눈물도 많은 솔직한 성격이에요. 주말마다 어디 갈지 찾아보는 게 취미라 늘 유쾌한 에너지를 주는 사람입니다.',
          bride_label: '신부 윤지호(ESFP)',
        },
        {
          id: 2,
          question: '두 분은 어떻게 만나게 되었나요?',
          answer: '저희는 회사 동료의 소개로 처음 만났어요. 사실 첫 만남 전에는 둘 다 큰 기대가 없었습니다. 가볍게 저녁이나 먹자는 마음으로 나갔는데, 이야기를 하다 보니 어느새 식당 마감 시간이 다 되었더라고요. 그날 이후 자연스럽게 서로의 일상을 가장 먼저 나누는 사이가 되었습니다.',
        },
        {
          id: 3,
          question: '결혼을 결심하게 된 계기는요?',
          answer: '연애를 하면서 좋은 순간도 많았지만, 오히려 힘든 일이 있을 때마다 서로가 어떤 사람인지 더 잘 알게 되었어요. 제가 지쳐 있을 때 묵묵히 곁을 지켜주는 모습을 보며 앞으로의 삶도 서로가 함께라면 참 좋겠다고 생각했습니다.',
        },
      ];
    }
    return [];
  }, [invitation?.interviews, config.interviews, extra.interviews, invitation?.is_sample_preview, invitation?.slug]);

  // 안내 정보 카드 목록
  const infoNotices = useMemo(() => {
    const raw = invitation?.info_notices;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}

    // 기본 영상 속 안내 카드
    return [
      {
        title: '포토부스',
        content: '행복한 날을 기록할 수 있도록 본식 당일 로비에 포토부스가 설치됩니다.\n따뜻한 미소와 함께 축복의 메시지를 남겨주시면 소중히 간직하도록 하겠습니다.',
      },
      {
        title: '전세버스',
        content: '귀한 발걸음을 해주시는 하객분들의 편의를 위해 전세버스를 준비하였습니다.\n출발 시간: 오전 8시\n탑승 장소: 목포역 광장 앞\n연락처: 010-1234-5678',
      },
    ];
  }, [invitation?.info_notices]);

  // 계좌 목록
  const groomAccounts = (invitation?.accounts || []).filter((a) => a.group === '신랑측' || a.side === 'groom');
  const brideAccounts = (invitation?.accounts || []).filter((a) => a.group === '신부측' || a.side === 'bride');

  // 방명록 로드
  useEffect(() => {
    if (!invitation?.id) return;
    async function loadGuestbook() {
      const { data } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_id', invitation.id)
        .order('created_at', { ascending: false });
      if (data) setGuestbookList(data);
    }
    loadGuestbook();
  }, [invitation?.id]);

  // 방명록 등록
  const handleGuestbookSubmit = async (e) => {
    e.preventDefault();
    if (!invitation?.id) {
      return alert('미리보기 모드에서는 작성이 제한됩니다.');
    }
    if (!guestbookName.trim()) return alert('이름 또는 닉네임을 입력해 주세요.');
    if (!guestbookMessage.trim()) return alert('축하 메시지를 입력해 주세요.');

    setSubmittingGuestbook(true);
    const { data, error } = await supabase
      .from('guestbook')
      .insert([
        {
          invitation_id: invitation.id,
          name: guestbookName.trim(),
          message: guestbookMessage.trim(),
        },
      ])
      .select()
      .single();

    setSubmittingGuestbook(false);
    if (error) {
      alert('방명록 등록 중 오류가 발생했습니다.');
    } else if (data) {
      setGuestbookList((prev) => [data, ...prev]);
      setGuestbookName('');
      setGuestbookMessage('');
      alert('따뜻한 축하 말씀이 등록되었습니다. 감사합니다!');
    }
  };

  // 인페이지 RSVP 제출
  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!invitation?.id) {
      return alert('미리보기 모드에서는 참석 정보 등록이 제한됩니다.');
    }
    if (!rsvpName.trim()) {
      return alert('성함을 입력해 주세요.');
    }
    if (!rsvpConsent) {
      return alert('개인정보 수집 및 이용에 동의해 주세요.');
    }

    setSubmittingRsvp(true);
    const { error } = await supabase.from('rsvp').insert([
      {
        invitation_id: invitation.id,
        name: rsvpName.trim(),
        side: rsvpSide,
        attend: rsvpAttend,
        companion_count: rsvpAttend ? Math.max(0, rsvpCount - 1) : 0,
        meal: rsvpAttend ? rsvpMeal : null,
        bus: rsvpAttend ? rsvpBus : null,
        phone: '',
      },
    ]);

    setSubmittingRsvp(false);
    if (error) {
      console.error('RSVP 등록 에러:', error);
      alert('참석 정보 전달 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } else {
      alert('소중한 참석 의사가 전달되었습니다. 진심으로 감사드립니다!');
      setRsvpName('');
      setRsvpConsent(false);
    }
  };

  // 클립보드 복사 헬퍼
  const handleCopy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} 복사되었습니다.`);
    } catch {
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
  const handleKakaoShare = () => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.href;
    const shareTitle = `${coupleTitle} 결혼합니다`;
    const shareDesc = [
      invitation?.wedding_date,
      [invitation?.venue_name, invitation?.venue_hall].filter(Boolean).join(' '),
    ].filter(Boolean).join(' | ');

    if (window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: shareDesc,
          imageUrl: mainImage || 'https://images.unsplash.com/photo-1519741497674-611481863552',
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
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
        ],
      });
      return;
    }

    handleCopy(currentUrl, '청첩장 링크가');
  };

  return (
    <div className="w-full max-w-[430px] bg-white text-[#222222] min-h-screen flex flex-col font-sans antialiased selection:bg-stone-200 relative mx-auto shadow-2xl overflow-x-hidden">
      
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

      {/* 캘린더 날짜 + 텍스트 전체를 감싸는 빨간 타원형 손그림 드로잉 애니메이션 */}
      <style jsx global>{`
        @keyframes drawOval {
          0% {
            stroke-dashoffset: 420;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {/* ========================================================
          01. 상단 인트로 & 메인 풀스크린 커버 (영상 00:03 ~ 00:12 1:1 일치)
          - 감성 문구 ➔ 한글 성함 ➔ 전면 메인 웨딩 사진
          ======================================================== */}
      <section className="pt-20 pb-10 px-6 text-center select-none bg-white">
        <ScrollReveal>
          {/* 상단 감성 오프닝 문구 */}
          <div className="text-xs sm:text-[13px] leading-[2.3] text-stone-600 font-light max-w-[310px] mx-auto mb-9 whitespace-pre-line tracking-tight">
            함께하는 오늘이<br />
            오래도록 기억될 아름다운 순간이 되기를 바라며<br />
            저희의 결혼식에 초대합니다
          </div>

          {/* 신랑 & 신부 한글 성함 */}
          <h1 className="font-serif text-xl sm:text-[22px] tracking-[0.1em] text-[#111111] font-normal mb-8">
            {groomName} <span className="font-light text-stone-300 text-base mx-1.5">&</span> {brideName}
          </h1>

          {/* 중앙 전면 메인 웨딩 사진 (여백 최소화 와이드 커버) */}
          {mainImage && (
            <div className="w-full aspect-[4/5] sm:aspect-[3/4] mx-auto overflow-hidden bg-stone-100 shadow-xs mb-3">
              <img
                src={mainImage}
                alt="Main Wedding Couple"
                className="w-full h-full object-cover object-center"
              />
            </div>
          )}

          {/* 사진 아래 영문/한글 이름 재노출 */}
          <div className="text-center pt-2">
            <span className="font-serif text-sm tracking-[0.08em] text-stone-800 font-light">
              {groomName} <span className="font-light text-stone-300 mx-1">&</span> {brideName}
            </span>
          </div>
        </ScrollReveal>
      </section>

      {/* ========================================================
          02. INVITATION (모시는 글 & 2단 인물 사진 & 이름 강조)
          - 영상 00:13 ~ 00:18 1:1 일치
          ======================================================== */}
      <section className="py-20 px-6 text-center bg-white border-t border-stone-100">
        <ScrollReveal>
          <span className="font-serif italic text-2xl sm:text-3xl text-[#222222] block mb-6 font-light">
            Invitation
          </span>

          {/* 모시는 글 본문 */}
          <div className="text-xs sm:text-[13px] leading-[2.5] text-stone-600 font-light max-w-[310px] mx-auto mb-12 whitespace-pre-line break-keep">
            {invitation?.message || `매일이 비슷해 보여도,\n결국은 다시 돌아올 수 없는 하루들 속에서\n우리, 서로의 계절이 되어 함께 살아가려 합니다.\n\n서로의 하루를 채워갈,\n평범하고도 눈부신 날들을\n귀한 걸음으로 참석하여 축하해주세요.`}
          </div>

          {/* 신랑 & 신부 2단 정사각 인물 스냅 사진 */}
          <div className="grid grid-cols-2 gap-3 max-w-[330px] mx-auto mb-10">
            <div className="aspect-square overflow-hidden bg-stone-100 shadow-2xs">
              <img
                src={groomPhoto}
                alt="Groom Portrait"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square overflow-hidden bg-stone-100 shadow-2xs">
              <img
                src={bridePhoto}
                alt="Bride Portrait"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 부모님 & 신랑신부 성함 (영상과 동일하게 '세희', '지호' 이름만 굵고 크게 강조) */}
          <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-5 gap-y-3.5 text-xs sm:text-[13px] text-stone-800 mx-auto select-none">
            <div className="text-right text-stone-600 font-normal">
              {groomParents}
            </div>
            <div className="text-center text-stone-400 font-light text-[11px] px-1">
              {groomParents ? groomRelation : ''}
            </div>
            <div className="text-left text-stone-900 font-medium text-sm sm:text-[15px] tracking-wide">
              {groomFirstNameOnly || groomName}
            </div>

            <div className="text-right text-stone-600 font-normal">
              {brideParents}
            </div>
            <div className="text-center text-stone-400 font-light text-[11px] px-1">
              {brideParents ? brideRelation : ''}
            </div>
            <div className="text-left text-stone-900 font-medium text-sm sm:text-[15px] tracking-wide">
              {brideFirstNameOnly || brideName}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ========================================================
          03. CALENDAR (순백 화이트 베이스 + 은은한 사진 페이드 + 타원 손그림 드로잉)
          - 영상 00:19 ~ 00:22 1:1 일치
          ======================================================== */}
      <section className="relative py-20 px-6 text-center overflow-hidden bg-white border-t border-stone-100">
        {/* 은은한 배경 사진 페이드 */}
        {mainImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-[0.07] pointer-events-none filter blur-[1px]"
            style={{ backgroundImage: `url(${mainImage})` }}
          />
        )}

        <div className="relative z-10">
          <ScrollReveal>
            {/* 상단 일시 (2035 / 10 / 20 / 12:00 PM) */}
            <div className="font-mono text-xs sm:text-[13px] tracking-[0.2em] text-stone-500 uppercase mb-8">
              {dateDetails.year} / {dateDetails.month} / {dateDetails.day} / {dateDetails.timeFull}
            </div>

            {/* 3열 캘린더 (FRIDAY 19 | SATURDAY 20 | SUNDAY 21) */}
            <div className="max-w-[340px] mx-auto bg-white/95 rounded-xl shadow-xs border border-stone-200/80 p-5 mb-8 backdrop-blur-xs">
              <div className="grid grid-cols-3 divide-x divide-stone-100 text-center items-center">
                
                {/* 1. 어제 */}
                <div className="py-2 opacity-35">
                  <span className="block font-mono text-[10px] tracking-wider text-stone-500 uppercase mb-1">
                    {dateDetails.prevDayEn}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl text-stone-700 font-light">
                    {dateDetails.prevDayNum}
                  </span>
                </div>

                {/* 2. 예식 당일 (날짜 + 텍스트 전체를 감싸는 빨간 타원형 손그림 애니메이션) */}
                <div className="py-2 relative flex flex-col items-center justify-center">
                  <span className="block font-mono text-[10px] tracking-wider text-stone-700 uppercase font-semibold mb-1">
                    {dateDetails.dayEn}
                  </span>
                  
                  {/* 날짜 숫자 & 세희♥지호 결혼식 텍스트 묶음 */}
                  <div className="relative flex flex-col items-center justify-center px-4 py-1.5 my-0.5">
                    <span className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal z-10 leading-none mb-1">
                      {dateDetails.day}
                    </span>

                    <div className="z-10 space-y-0.5 text-center">
                      <span className="block text-[11px] font-medium text-stone-800 leading-tight">
                        {groomFirstNameOnly} ♥ {brideFirstNameOnly}
                      </span>
                      <span className="block text-[10px] text-stone-500 font-light leading-tight">
                        결혼식
                      </span>
                    </div>

                    {/* 날짜와 텍스트를 함께 감싸는 큼직한 타원형 빨간색 손그림 드로잉 SVG */}
                    <svg
                      className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none"
                      viewBox="0 0 120 140"
                    >
                      <ellipse
                        cx="60"
                        cy="70"
                        rx="52"
                        ry="62"
                        fill="none"
                        stroke="#C5221F"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: 380,
                          strokeDashoffset: 0,
                          animation: 'drawOval 1.5s ease-out forwards',
                          transform: 'rotate(-10deg)',
                          transformOrigin: '50% 50%',
                        }}
                      />
                    </svg>
                  </div>
                </div>

                {/* 3. 다음날 */}
                <div className="py-2 opacity-35">
                  <span className="block font-mono text-[10px] tracking-wider text-stone-500 uppercase mb-1">
                    {dateDetails.nextDayEn}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl text-stone-700 font-light">
                    {dateDetails.nextDayNum}
                  </span>
                </div>

              </div>
            </div>

            {/* 예식 장소 명칭 */}
            <div className="space-y-1 text-xs text-stone-600 font-light">
              <p>{invitation?.venue_address || ''}</p>
              <p className="font-medium text-stone-900">
                {[invitation?.venue_name, invitation?.venue_hall].filter(Boolean).join(' ')}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================
          04. INTERVIEW (신랑·신부 인터뷰 - 우리의 이야기)
          - 영상 00:23 ~ 00:36 1:1 일치
          ======================================================== */}
      {interviews && interviews.length > 0 && (
        <section className="py-20 px-6 text-center bg-white border-t border-stone-100">
          <ScrollReveal>
            <span className="font-serif italic text-2xl sm:text-3xl text-[#222222] block mb-2 font-light">
              Interview
            </span>
            <h2 className="font-serif text-base sm:text-lg text-stone-900 font-medium mb-1">
              우리의 이야기
            </h2>
            <p className="text-[11px] text-stone-500 font-light mb-6">
              {groomName} ♥ {brideName}<br />
              두 사람의 이야기를 담았습니다.
            </p>

            <button
              type="button"
              onClick={() => setInterviewModalOpen(true)}
              className="px-6 py-2.5 rounded-full border border-stone-300 hover:border-black text-stone-800 hover:text-black text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95 bg-white"
            >
              <span>인터뷰 읽어보기</span>
              <span className="text-stone-400 text-[10px]">↗</span>
            </button>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          05. GALLERY (와이드 2장 전면 + 3열 촘촘한 정사각 그리드)
          - 영상 00:37 ~ 00:49 1:1 일치
          ======================================================== */}
      {galleryImages.length > 0 && (
        <section className="py-20 px-6 bg-white border-t border-stone-100">
          <ScrollReveal>
            {/* 상단 와이드 화보 2장 (영상 속 신부 선글라스 컷 + 신랑 선글라스 컷) */}
            {widePhotos.length > 0 && (
              <div className="space-y-2 mb-2">
                {widePhotos.map((img, idx) => (
                  <div
                    key={`wide-${idx}`}
                    onClick={() => {
                      setGalleryModalIndex(idx);
                      setGalleryModalOpen(true);
                    }}
                    className="w-full aspect-[4/3] rounded-none overflow-hidden bg-stone-100 cursor-pointer shadow-2xs group"
                  >
                    <img
                      src={img}
                      alt={`Wedding Wide ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 3열 정사각 썸네일 그리드 (간격 2px로 촘촘하고 세련된 매거진 룩) */}
            {gridPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {visibleGridPhotos.map((img, idx) => {
                  const realIndex = idx + widePhotos.length;
                  return (
                    <div
                      key={`grid-${idx}`}
                      onClick={() => {
                        setGalleryModalIndex(realIndex);
                        setGalleryModalOpen(true);
                      }}
                      className="aspect-square overflow-hidden bg-stone-100 cursor-pointer group shadow-2xs"
                    >
                      <img
                        src={img}
                        alt={`Wedding Thumb ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* 더보기 버튼 */}
            {gridPhotos.length > 9 && !galleryExpanded && (
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setGalleryExpanded(true)}
                  className="px-6 py-2 rounded-full border border-stone-200 hover:border-stone-400 text-stone-600 text-xs font-light transition-colors cursor-pointer bg-white"
                >
                  더보기 ({gridPhotos.length - 9}장) ↓
                </button>
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          06. LOCATION (오시는 길 & 카카오 지도 & 교통편 & 내비)
          - 영상 00:50 ~ 00:55 1:1 일치
          ======================================================== */}
      <section className="py-20 px-6 bg-white border-t border-stone-100">
        <ScrollReveal>
          <div className="text-center mb-8">
            <span className="font-serif italic text-2xl sm:text-3xl text-[#222222] block mb-3 font-light">
              Location
            </span>
            <h2 className="font-serif text-base sm:text-lg text-stone-900 font-medium mb-1">
              {[invitation?.venue_name, invitation?.venue_hall].filter(Boolean).join(' ')}
            </h2>
            <p className="text-xs text-stone-500 font-light mb-3">
              {invitation?.venue_address} {invitation?.venue_detail || ''}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(invitation?.venue_address, '예식장 주소가')}
              className="text-[11px] text-stone-500 hover:text-stone-900 border border-stone-200 px-3 py-1 rounded-full cursor-pointer inline-flex items-center gap-1 bg-white"
            >
              <span>주소복사</span>
            </button>
          </div>

          {/* 카카오 지도 */}
          <div className="w-full rounded-xl overflow-hidden border border-stone-200 mb-6 shadow-2xs">
            <KakaoMap
              address={invitation?.venue_address || '서울시 서초구 반포대로 235'}
              venueName={invitation?.venue_name || '웨딩홀'}
            />
          </div>

          {/* 대중교통 및 주차 안내 목록 (화이트 & 연회색 모던 박스) */}
          {invitation?.transportation && invitation.transportation.length > 0 && (
            <div className="space-y-2.5 pt-2 pb-6 border-b border-stone-100 text-xs">
              {invitation.transportation.map((t, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-[#F9F9F9] rounded-xl border border-stone-100">
                  <span className="w-16 shrink-0 font-semibold text-stone-800">
                    {t.title}
                  </span>
                  <p className="flex-1 text-stone-600 leading-relaxed font-light whitespace-pre-line">
                    {t.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 내비게이션 길안내 버튼 3개 */}
          <div className="pt-5">
            <div className="flex items-center justify-between text-xs text-stone-700">
              <span className="font-medium text-stone-600">내비게이션</span>
              <div className="flex items-center gap-2">
                {[
                  { name: '티맵', url: `tmap://search?name=${encodeURIComponent(invitation?.venue_name || '')}` },
                  { name: '카카오', url: `kakaonavi://search?q=${encodeURIComponent(invitation?.venue_name || '')}` },
                  { name: '네이버', url: `nmap://action/search?query=${encodeURIComponent(invitation?.venue_name || '')}` },
                ].map((nav) => (
                  <a
                    key={nav.name}
                    href={nav.url}
                    className="px-3 py-1.5 bg-[#F9F9F9] hover:bg-stone-200/80 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 transition-colors"
                  >
                    {nav.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ========================================================
          07. ACCOUNT (마음 전하실 곳 - 아코디언)
          - 순백 화이트 베이스 + 영상 00:56 ~ 01:00 1:1 일치
          ======================================================== */}
      {(groomAccounts.length > 0 || brideAccounts.length > 0) && (
        <section className="py-20 px-6 bg-white border-t border-stone-100">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-serif italic text-2xl sm:text-3xl text-[#222222] block mb-2 font-light">
                Account
              </span>
              <h2 className="font-serif text-base sm:text-lg text-stone-900 font-medium mb-1">
                마음 전하실 곳
              </h2>
              <p className="text-xs text-stone-500 font-light max-w-xs mx-auto leading-relaxed">
                참석이 어려운 분들을 위해 계좌번호를 기재하였습니다.<br />
                너그러운 마음으로 양해 부탁드립니다.
              </p>
            </div>

            <div className="space-y-3 max-w-[370px] mx-auto">
              {/* 신랑측 계좌 아코디언 */}
              {groomAccounts.length > 0 && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenGroomAccount(!openGroomAccount)}
                    className="w-full p-4 flex items-center justify-between text-xs font-semibold text-stone-800 cursor-pointer select-none"
                  >
                    <span>신랑측 계좌번호</span>
                    <span className={`text-stone-400 transition-transform ${openGroomAccount ? 'rotate-180' : ''}`}>
                      ∨
                    </span>
                  </button>

                  {openGroomAccount && (
                    <div className="px-4 pb-4 space-y-2 pt-1 border-t border-stone-100">
                      {groomAccounts.map((acc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-xl text-xs border border-stone-100">
                          <div>
                            <span className="font-semibold text-stone-800 block">
                              {acc.holder || acc.title} ({acc.bank})
                            </span>
                            <span className="font-mono text-stone-500 text-[11px]">
                              {acc.number || acc.account_number}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.number || acc.account_number, `${acc.holder || acc.title} 계좌번호가`)}
                            className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-[11px] font-medium text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                          >
                            복사하기
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 신부측 계좌 아코디언 */}
              {brideAccounts.length > 0 && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenBrideAccount(!openBrideAccount)}
                    className="w-full p-4 flex items-center justify-between text-xs font-semibold text-stone-800 cursor-pointer select-none"
                  >
                    <span>신부측 계좌번호</span>
                    <span className={`text-stone-400 transition-transform ${openBrideAccount ? 'rotate-180' : ''}`}>
                      ∨
                    </span>
                  </button>

                  {openBrideAccount && (
                    <div className="px-4 pb-4 space-y-2 pt-1 border-t border-stone-100">
                      {brideAccounts.map((acc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-xl text-xs border border-stone-100">
                          <div>
                            <span className="font-semibold text-stone-800 block">
                              {acc.holder || acc.title} ({acc.bank})
                            </span>
                            <span className="font-mono text-stone-500 text-[11px]">
                              {acc.number || acc.account_number}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.number || acc.account_number, `${acc.holder || acc.title} 계좌번호가`)}
                            className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-[11px] font-medium text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                          >
                            복사하기
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

      {/* ========================================================
          08. RSVP (확장형 인페이지 참석 여부 - 영상 01:01 ~ 01:09 1:1)
          - 순백 화이트 배경 & 영상 속 라디오 체크 스타일
          ======================================================== */}
      <section className="py-20 px-6 bg-white border-t border-stone-100">
        <ScrollReveal>
          <div className="text-center mb-8">
            <span className="font-serif italic text-2xl sm:text-3xl text-[#222222] block mb-2 font-light">
              RSVP
            </span>
            <h2 className="font-serif text-base sm:text-lg text-stone-900 font-medium mb-1">
              참석 여부
            </h2>
            <p className="text-xs text-stone-500 font-light">
              결혼식 참석 여부를 체크해주세요.
            </p>
          </div>

          <form onSubmit={handleRsvpSubmit} className="max-w-[370px] mx-auto space-y-5">
            {/* 1. 참석 여부 라디오 탭 */}
            <div>
              <span className="block text-xs font-semibold text-stone-800 mb-2">
                * 참석 여부
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRsvpAttend(true)}
                  className={`py-3 px-4 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    rsvpAttend
                      ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                      : 'border-stone-200 bg-[#F9F9F9] text-stone-600'
                  }`}
                >
                  <span>✓</span>
                  <span>참석 가능</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpAttend(false)}
                  className={`py-3 px-4 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !rsvpAttend
                      ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                      : 'border-stone-200 bg-[#F9F9F9] text-stone-600'
                  }`}
                >
                  <span>✕</span>
                  <span>참석 불가</span>
                </button>
              </div>
            </div>

            {/* 2. 성함 및 구분 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-800">* 성함</span>
                <div className="flex items-center gap-3 text-xs text-stone-600">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="rsvp_side"
                      value="groom"
                      checked={rsvpSide === 'groom'}
                      onChange={() => setRsvpSide('groom')}
                      className="accent-stone-900"
                    />
                    <span>신랑측</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="rsvp_side"
                      value="bride"
                      checked={rsvpSide === 'bride'}
                      onChange={() => setRsvpSide('bride')}
                      className="accent-stone-900"
                    />
                    <span>신부측</span>
                  </label>
                </div>
              </div>
              <input
                type="text"
                required
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                placeholder="성함을 입력해 주세요."
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
              />
            </div>

            {/* 참석 가능 시 추가 옵션들 */}
            {rsvpAttend && (
              <>
                {/* 3. 참석 인원 수 카운터 */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-stone-800">* 참석 인원</span>
                  <div className="flex items-center gap-3 bg-[#F9F9F9] border border-stone-200 rounded-xl px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => setRsvpCount(Math.max(1, rsvpCount - 1))}
                      className="w-6 h-6 flex items-center justify-center text-stone-600 font-bold hover:bg-stone-200 rounded-lg cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-semibold text-stone-900 min-w-5 text-center">
                      {rsvpCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRsvpCount(rsvpCount + 1)}
                      className="w-6 h-6 flex items-center justify-center text-stone-600 font-bold hover:bg-stone-200 rounded-lg cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. 식사 여부 (영상 3분할) */}
                <div>
                  <span className="block text-xs font-semibold text-stone-800 mb-2">
                    * 식사 여부
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['미정', '식사 가능', '식사 불가'].map((mealOpt) => (
                      <button
                        key={mealOpt}
                        type="button"
                        onClick={() => setRsvpMeal(mealOpt)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition-all cursor-pointer ${
                          rsvpMeal === mealOpt
                            ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                            : 'border-stone-200 bg-[#F9F9F9] text-stone-600'
                        }`}
                      >
                        {mealOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 전세버스 탑승 여부 (영상 2분할) */}
                <div>
                  <span className="block text-xs font-semibold text-stone-800 mb-2">
                    * 전세버스 탑승 여부
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {['탑승', '미탑승'].map((busOpt) => (
                      <button
                        key={busOpt}
                        type="button"
                        onClick={() => setRsvpBus(busOpt)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          rsvpBus === busOpt
                            ? 'border-stone-900 bg-stone-900 text-white shadow-2xs'
                            : 'border-stone-200 bg-[#F9F9F9] text-stone-600'
                        }`}
                      >
                        {busOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 6. 개인정보 수집 및 이용 동의 */}
            <div className="p-3.5 bg-[#F9F9F9] rounded-xl border border-stone-200/70 text-[11px] text-stone-500 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer text-stone-800 font-medium">
                <input
                  type="checkbox"
                  required
                  checked={rsvpConsent}
                  onChange={(e) => setRsvpConsent(e.target.checked)}
                  className="mt-0.5 accent-stone-900 rounded"
                />
                <span>개인정보 수집 및 이용에 동의합니다.</span>
              </label>
              <p className="text-[10px] text-stone-400 font-light leading-relaxed pl-5">
                수집 항목: 성함, 참석 여부, 신랑·신부 측 구분, 참석 인원, 식사 여부, 전세버스 탑승 여부<br />
                이용 목적: 예식 참석 인원, 식사 및 전세버스 탑승 인원 확인<br />
                보관 기간: 예식 종료 후 즉시 파기
              </p>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={submittingRsvp}
              className="w-full py-3.5 bg-[#222222] hover:bg-black text-white font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-98"
            >
              {submittingRsvp ? '참석 정보를 전달하고 있습니다...' : '제출'}
            </button>
          </form>
        </ScrollReveal>
      </section>

      {/* ========================================================
          09. INFORMATION (안내 카드 슬라이더)
          - 영상 01:10 ~ 01:13 1:1 일치
          ======================================================== */}
      {infoNotices.length > 0 && (
        <section className="py-20 px-6 bg-white border-t border-stone-100">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-serif italic text-2xl sm:text-3xl text-[#222222] block mb-2 font-light">
                Information
              </span>
            </div>

            <div className="max-w-[360px] mx-auto relative bg-[#F9F9F9] rounded-2xl border border-stone-200/80 p-7 text-center shadow-2xs">
              <div className="flex items-center justify-between mb-4 text-stone-400">
                <button
                  type="button"
                  onClick={() => setInfoCardIndex((prev) => (prev > 0 ? prev - 1 : infoNotices.length - 1))}
                  className="p-1 hover:text-stone-800 cursor-pointer text-sm font-mono"
                >
                  〈
                </button>
                <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                  {infoNotices[infoCardIndex]?.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setInfoCardIndex((prev) => (prev < infoNotices.length - 1 ? prev + 1 : 0))}
                  className="p-1 hover:text-stone-800 cursor-pointer text-sm font-mono"
                >
                  〉
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-line break-keep min-h-[60px] flex items-center justify-center">
                {infoNotices[infoCardIndex]?.content}
              </p>

              {infoNotices.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {infoNotices.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        infoCardIndex === i ? 'bg-stone-800 w-3' : 'bg-stone-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          10. GUESTBOOK (축하 방명록)
          - 영상 01:14 ~ 01:21 1:1 일치
          ======================================================== */}
      {config.show_guestbook !== false && (
        <section className="py-20 px-6 bg-white border-t border-stone-100">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-serif italic text-2xl sm:text-3xl text-[#222222] block mb-2 font-light">
                Guestbook
              </span>
              <h2 className="font-serif text-base sm:text-lg text-stone-900 font-medium mb-1">
                방명록
              </h2>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                남겨주신 축하의 글은 감사히 읽어보겠습니다.<br />
                축하해주셔서 감사합니다.
              </p>
            </div>

            {/* 방명록 입력 폼 */}
            <form onSubmit={handleGuestbookSubmit} className="max-w-[370px] mx-auto space-y-2.5 mb-8">
              <input
                type="text"
                required
                value={guestbookName}
                onChange={(e) => setGuestbookName(e.target.value)}
                placeholder="이름 또는 닉네임"
                className="w-full px-3.5 py-2.5 bg-[#F9F9F9] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
              />
              <div className="relative">
                <textarea
                  rows={3}
                  required
                  maxLength={150}
                  value={guestbookMessage}
                  onChange={(e) => setGuestbookMessage(e.target.value)}
                  placeholder="축하 메시지를 남겨주세요."
                  className="w-full p-3.5 pb-6 bg-[#F9F9F9] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 leading-relaxed focus:outline-none focus:border-stone-900"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-stone-400 font-mono">
                  {guestbookMessage.length}/150
                </span>
              </div>
              <button
                type="submit"
                disabled={submittingGuestbook}
                className="w-full py-2.5 bg-white border border-stone-300 hover:border-black text-stone-800 hover:text-black font-medium text-xs rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-98"
              >
                {submittingGuestbook ? '등록 중...' : '메시지 남기기'}
              </button>
            </form>

            {/* 방명록 목록 (페이징: 한 페이지당 3건) */}
            <div className="max-w-[370px] mx-auto space-y-2.5">
              {guestbookList.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400 bg-[#F9F9F9] rounded-xl border border-stone-100">
                  첫 번째 축하 메시지를 남겨주세요 ✨
                </div>
              ) : (
                (() => {
                  const itemsPerPage = 3;
                  const totalPages = Math.ceil(guestbookList.length / itemsPerPage);
                  const startIndex = (guestbookPage - 1) * itemsPerPage;
                  const currentItems = guestbookList.slice(startIndex, startIndex + itemsPerPage);

                  return (
                    <>
                      {currentItems.map((item) => (
                        <div key={item.id} className="p-4 bg-[#F9F9F9] rounded-xl border border-stone-100 text-left space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-stone-900">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-xs text-stone-700 leading-relaxed font-light whitespace-pre-line break-keep">
                            {item.message}
                          </p>
                        </div>
                      ))}

                      {/* 페이징 버튼 */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-3 text-xs text-stone-500 font-light">
                          <button
                            type="button"
                            onClick={() => setGuestbookPage((p) => Math.max(1, p - 1))}
                            disabled={guestbookPage === 1}
                            className="hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            이전
                          </button>
                          <span className="font-mono text-[11px]">
                            {guestbookPage} / {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setGuestbookPage((p) => Math.min(totalPages, p + 1))}
                            disabled={guestbookPage === totalPages}
                            className="hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          11. FOOTER & 공유 버튼 (영상 01:22 ~ 01:25 1:1 일치)
          ======================================================== */}
      <footer className="py-16 px-6 bg-white border-t border-stone-100 text-center select-none">
        <ScrollReveal>
          <div className="max-w-[370px] mx-auto space-y-2.5 mb-10">
            <button
              type="button"
              onClick={handleKakaoShare}
              className="w-full py-3 bg-[#F9F9F9] hover:bg-[#F2F2F2] border border-stone-200 text-stone-800 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2"
            >
              <span>카카오톡으로 공유하기</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  handleCopy(window.location.href, '청첩장 링크가');
                }
              }}
              className="w-full py-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              청첩장 링크 복사하기
            </button>
          </div>

          <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase font-light">
            ayre studio. All rights reserved.
          </p>
        </ScrollReveal>
      </footer>

      {/* 신랑 & 신부 인터뷰 모달 */}
      <SceneInterviewModal
        isOpen={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        interviews={interviews}
        groomName={groomName}
        brideName={brideName}
      />

      {/* 사진 라이트박스 뷰어 모달 */}
      <SceneGalleryModal
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        images={galleryImages}
        initialIndex={galleryModalIndex}
      />

    </div>
  );
}
