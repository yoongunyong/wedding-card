'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Script from 'next/script';
import KakaoMap from '@/components/KakaoMap';
import ScrollReveal from '@/components/ScrollReveal';
import TodayConciergeCard from '@/components/TodayConciergeCard';
import SceneInterviewModal from './SceneInterviewModal';
import SceneGalleryModal from './SceneGalleryModal';
import SceneGuestbookDeleteModal from './SceneGuestbookDeleteModal';
import { supabase } from '@/lib/supabase';

export default function SceneTemplate({ invitation }) {
  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  // 0. 오프닝 단계별 시퀀스 애니메이션 (영상 00:02 ~ 00:10 1:1 일치)
  // step 0: 시작 (모두 숨김)
  // step 1: 1행 "함께하는 오늘이" 페이드인 (0.5s)
  // step 2: 2행 "오래도록 기억될 아름다운 순간이 되기를 바라며" 페이드인 (1.5s)
  // step 3: 3행 "저희의 결혼식에 초대합니다" 페이드인 (2.5s)
  // step 4: 신랑신부 이름 및 링 아이콘 페이드인 (3.5s)
  // step 5: 사진이 중앙에서 쫘아악 펼쳐지며 소개글은 위로, 이름은 아래로 이동! (4.8s)
  const [heroStep, setHeroStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setHeroStep(1), 500),
      setTimeout(() => setHeroStep(2), 1500),
      setTimeout(() => setHeroStep(3), 2500),
      setTimeout(() => setHeroStep(4), 3500),
      setTimeout(() => setHeroStep(5), 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // 페이지 진입 시 스크롤을 무조건 최상단(오프닝 인트로)으로 초기화 (브라우저 스크롤 복원으로 중간부터 열리는 문제 방지)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    }
  }, []);



  // 1. 모달 상태
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 2. 갤러리 더보기 상태 (기본 9장 노출 ➔ 더보기 시 전체 노출)
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  // 3. 계좌 아코디언 토글 (영상 00:56 ~ 00:57과 같이 기본은 닫힘 상태)
  const [openGroomAccount, setOpenGroomAccount] = useState(false);
  const [openBrideAccount, setOpenBrideAccount] = useState(false);

  // 4. 정보 카드 캐러셀 인덱스
  const [infoCardIndex, setInfoCardIndex] = useState(0);

  // 5. 방명록 상태 & 페이징 & 삭제 모달
  const [guestbookList, setGuestbookList] = useState([]);
  const [guestbookPage, setGuestbookPage] = useState(1);
  const [guestbookName, setGuestbookName] = useState('');
  const [guestbookPassword, setGuestbookPassword] = useState('');
  const [guestbookMessage, setGuestbookMessage] = useState('');
  const [submittingGuestbook, setSubmittingGuestbook] = useState(false);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState(null);

  // 6. 인페이지 RSVP 폼 상태 (영상 1:1 일치)
  const [rsvpAttend, setRsvpAttend] = useState(true); // true: 참석 가능, false: 참석 불가
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpSide, setRsvpSide] = useState('groom'); // 'groom' | 'bride'
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpMeal, setRsvpMeal] = useState('식사 가능'); // '미정' | '식사 가능' | '식사 불가'
  const [rsvpBus, setRsvpBus] = useState('미탑승'); // '탑승' | '미탑승'
  const [rsvpConsent, setRsvpConsent] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  // 7. 캘린더 IntersectionObserver (영상 00:20~00:21 스크롤 진입 시 빨간 동그라미 드로잉 트리거)
  const calendarRef = useRef(null);
  const [isCalendarInView, setIsCalendarInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = calendarRef.current;
    if (!target) return;

    // 모달 안의 스크롤 컨테이너(#preview-scroll-container) 또는 윈도우 스크롤 탐색
    const scrollContainer = target.closest('#preview-scroll-container') || null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCalendarInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: scrollContainer,
        threshold: 0.35,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, []);

  // 샘플 미리보기 모드 여부 (관리자 샘플 페이지 또는 제작 시 실시간 미리보기)
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'scene');

  // 기본 정보 (실제 고객 정보 우선, 샘플 모드일 때만 기본값)
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

  const groomRelation = config.groom_relation || invitation?.groom_relation || '';
  const brideRelation = config.bride_relation || invitation?.bride_relation || '';

  // 이름만 추출: 한국 표준 3글자 성명(/^[가-힣]{3}$/)일 때만 성(첫 글자)을 떼어내고,
  // 외자, 영문 이름(Alex, David), 4글자 이상 성명 등은 고객이 입력한 이름 원본을 훼손 없이 그대로 유지
  const groomFirstNameOnly = /^[가-힣]{3}$/.test(groomName) ? groomName.slice(1) : groomName;
  const brideFirstNameOnly = /^[가-힣]{3}$/.test(brideName) ? brideName.slice(1) : brideName;

  // 대표 이미지
  const mainImage = images.main || images.cover || invitation?.main_image || '';
  const groomPhoto = images.groom_profile || extra.groom_profile_image || (isSample ? mainImage : '');
  const bridePhoto = images.bride_profile || extra.bride_profile_image || (isSample ? mainImage : '');

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

  // 신랑·신부 인터뷰 (Q&A) 목록 파싱 (실제 고객이 작성 안 했으면 숨김)
  const interviews = useMemo(() => {
    const raw = invitation?.interviews || config.interviews || extra.interviews;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    
    // 샘플 미리보기 모드일 때만 기본 질문-답변 노출 (실제 고객에게는 절대 노출 금지)
    if (isSample) {
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
  }, [invitation?.interviews, config.interviews, extra.interviews, isSample]);

  // 대중교통 및 주차 안내 목록 (실제 고객이 입력 안 했으면 비워두고, 샘플 모드일 때만 예시 노출)
  const transportationList = useMemo(() => {
    const raw = invitation?.transportation;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}

    if (isSample) {
      return [
        { title: '주차장', content: '더채플앳 청담 주차장(90분 무료)' },
        { title: '지하철', content: '강남구청역(7호선, 분당선) 3-1번 출구로 나와\n좌측 방향으로 570m 도보 후 좌측 건물' },
      ];
    }
    return [];
  }, [invitation?.transportation, isSample]);

  // 안내 정보 카드 목록 (포토부스, 전세버스 등 - 실제 고객이 없으면 빈 배열)
  const infoNotices = useMemo(() => {
    const raw = invitation?.info_notices;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}

    // 샘플 모드일 때만 기본 영상 속 안내 카드 제공 (실제 고객에겐 미입력 시 숨김)
    if (isSample) {
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
    }
    return [];
  }, [invitation?.info_notices, isSample]);

  // RSVP 전세버스 탑승 여부 질문 노출 조건 (전세버스를 운영하지 않는 일반 신랑신부에게 불필요한 버스 질문이 나가지 않도록 방지)
  const showBusOption = useMemo(() => {
    if (config.show_rsvp_bus === false) return false;
    if (config.show_rsvp_bus === true || extra.has_bus) return true;
    if (isSample) return true;
    // 일반 대중교통(시내버스)과 구분: 안내 카드에 명시적으로 '전세버스' 또는 '셔틀'이 기재된 경우에만 활성화
    const hasBusInNotice = infoNotices.some((n) => 
      n.title?.includes('전세버스') || n.title?.includes('셔틀') || 
      (n.title?.includes('버스') && (n.content?.includes('탑승') || n.content?.includes('대절') || n.content?.includes('출발')))
    );
    return hasBusInNotice;
  }, [config.show_rsvp_bus, extra.has_bus, isSample, infoNotices]);

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
    if (!guestbookPassword.trim()) return alert('삭제 시 사용할 비밀번호를 입력해 주세요.');
    if (!guestbookMessage.trim()) return alert('축하 메시지를 입력해 주세요.');

    setSubmittingGuestbook(true);
    const { data, error } = await supabase
      .from('guestbook')
      .insert([
        {
          invitation_id: invitation.id,
          author: guestbookName.trim(),
          content: guestbookMessage.trim(),
          password: guestbookPassword.trim(),
        },
      ])
      .select()
      .single();

    setSubmittingGuestbook(false);
    if (error) {
      console.error('방명록 등록 오류:', error);
      alert('방명록 등록 중 오류가 발생했습니다.');
    } else if (data) {
      setGuestbookList((prev) => [data, ...prev]);
      setGuestbookName('');
      setGuestbookPassword('');
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
    const cleanPhone = rsvpPhone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 4) {
      return alert('휴대전화 번호 뒤 4자리를 정확히 입력해 주세요.');
    }
    if (!rsvpConsent) {
      return alert('개인정보 수집 및 이용에 동의해 주세요.');
    }

    setSubmittingRsvp(true);
    const cleanName = rsvpName.trim();

    // 1. 기존 동일 하객(성함 + 휴대전화 번호 뒤 4자리) 등록 여부 조회
    const { data: existingRows } = await supabase
      .from('rsvp')
      .select('id, name, phone, side')
      .eq('invitation_id', invitation.id)
      .eq('name', cleanName);

    let matchedId = null;
    if (existingRows && existingRows.length > 0) {
      const match = existingRows.find((row) => {
        const rowDigits = (row.phone || '').replace(/\D/g, '');
        if (!rowDigits) return existingRows.length === 1;
        return rowDigits === cleanPhone || rowDigits.endsWith(cleanPhone) || cleanPhone.endsWith(rowDigits);
      });
      if (match) {
        matchedId = match.id;
      }
    }

    const payload = {
      invitation_id: invitation.id,
      name: cleanName,
      side: rsvpSide,
      attend: rsvpAttend,
      companion_count: rsvpAttend ? Math.max(0, rsvpCount - 1) : 0,
      meal: rsvpAttend ? rsvpMeal : null,
      bus: (rsvpAttend && showBusOption) ? rsvpBus : null,
      phone: cleanPhone,
    };

    let error = null;
    let isUpdated = false;

    if (matchedId) {
      // 기존 내역 최신 내용으로 덮어쓰기 (UPDATE)
      const res = await supabase
        .from('rsvp')
        .update(payload)
        .eq('id', matchedId);
      error = res.error;
      isUpdated = true;
    } else {
      // 신규 등록 (INSERT)
      const res = await supabase
        .from('rsvp')
        .insert([payload]);
      error = res.error;
    }

    setSubmittingRsvp(false);
    if (error) {
      console.error('RSVP 등록 에러:', error);
      alert('참석 정보 전달 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } else {
      if (isUpdated) {
        alert('이전에 제출하신 참석 정보가 최신 내용으로 안전하게 변경되었습니다. 진심으로 감사드립니다!');
      } else {
        alert('소중한 참석 의사가 전달되었습니다. 진심으로 감사드립니다!');
      }
      setRsvpName('');
      setRsvpPhone('');
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
          imageUrl: mainImage || (isSample ? '/samples/scene-cover.jpg' : ''),
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

      {/* 시안5 맞춤형 애니메이션 키프레임 (오프닝 언블러 페이드, 빨간 펜 드로잉 등) */}
      <style jsx global>{`
        @keyframes sceneFadeUp {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes sceneUnblur {
          0% {
            filter: blur(24px);
            transform: scale(1.05);
            opacity: 0.85;
          }
          100% {
            filter: blur(0px);
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes drawOval {
          0% {
            stroke-dashoffset: 380;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes drawDoubleLoop {
          0% {
            stroke-dashoffset: 780;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {/* ========================================================
          01. 상단 인트로 & 메인 풀스크린 커버 (영상 00:02 ~ 00:10 1:1 일치)
          - 소개글 3줄 한 줄씩 페이드인 ➔ 끝에 신랑신부 이름 등장
          - 2.8s: 사진이 중앙에서 쫘아악 펼쳐지며 소개글은 위로, 이름은 아래로 이동!
          ======================================================== */}
      {/* 예식 당일 안내 데스크 (당일 자동 전환) */}
      <TodayConciergeCard invitation={invitation} />

      <section className="min-h-[100dvh] sm:min-h-[820px] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden select-none bg-stone-100">
        
        {/* 뒷 배경: 영상(3번째 이미지) 1:1 일치 - 사진 전체가 가득 차게 블러되어 몽환적 실루엣과 명암이 확연히 드러남 */}
        {mainImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none filter blur-[20px] scale-105 opacity-85 transition-opacity duration-1000"
            style={{ 
              backgroundImage: `url(${mainImage})`,
            }}
          />
        )}
        {/* 텍스트 가독성을 위한 아주 얇은 소프트 틴트 (사진의 명암과 실루엣을 그대로 투과) */}
        <div className="absolute inset-0 bg-white/20 pointer-events-none" />

        {/* 1. 상단 소개글 (처음엔 화면 중앙 위치 ➔ 사진 펼쳐질 때 위로 부드럽게 쑥 이동) */}
        <div 
          className={`w-full max-w-[360px] mx-auto text-center text-[14px] sm:text-[15.5px] leading-[2.3] text-stone-700 font-light whitespace-pre-line tracking-normal transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            heroStep >= 5 ? 'mb-6 translate-y-0' : 'mb-2 translate-y-8 sm:translate-y-10'
          }`}
        >
          <p 
            className={`transition-all duration-700 ease-out ${
              heroStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            함께하는 오늘이
          </p>
          <p 
            className={`transition-all duration-700 ease-out ${
              heroStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            오래도록 기억될 아름다운 순간이 되기를 바라며
          </p>
          <p 
            className={`transition-all duration-700 ease-out ${
              heroStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            저희의 결혼식에 초대합니다
          </p>
        </div>

        {/* 2. 중앙 메인 사진 (0fr -> 1fr로 여유롭고 우아하게 서서히 펼쳐짐) */}
        {mainImage && (
          <div 
            className={`w-full max-w-[380px] mx-auto grid transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              heroStep >= 5 
                ? 'grid-rows-[1fr] my-4 opacity-100' 
                : 'grid-rows-[0fr] my-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="w-full aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-stone-100 shadow-[0_12px_36px_rgba(0,0,0,0.08)]">
                <img
                  src={mainImage}
                  alt="Main Wedding Couple"
                  fetchPriority="high"
                  className={`w-full h-full object-cover object-center transition-all duration-[2200ms] ease-out will-change-[filter,transform] ${
                    heroStep >= 5 ? 'filter-none scale-100' : 'filter blur-[24px] scale-105'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. 신랑신부 한글 성함 + 웨딩 링 아이콘 (처음엔 소개글 바로 밑 중앙에 페이드인 ➔ 사진 열릴 때 사진 아래로 부드럽게 쑥 이동!) */}
        <div 
          className={`w-full text-center transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            heroStep >= 5 ? 'mt-4 translate-y-0' : 'mt-2 translate-y-8 sm:translate-y-10'
          }`}
        >
          <h1 
            className={`font-serif text-[20px] sm:text-[23px] tracking-[0.12em] text-[#111111] font-normal transition-all duration-800 ease-out flex items-center justify-center ${
              heroStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <span>{groomName}</span>
            <span className="inline-flex items-center justify-center mx-2.5 text-stone-400">
              <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                <ellipse cx="8.5" cy="12.5" rx="5" ry="4.5" transform="rotate(-15 8.5 12.5)" />
                <ellipse cx="15.5" cy="11.5" rx="5" ry="4.5" transform="rotate(15 15.5 11.5)" />
                <path d="M15.5 6.5 L15.5 5" strokeLinecap="round" />
              </svg>
            </span>
            <span>{brideName}</span>
          </h1>
        </div>

      </section>

      {/* ========================================================
          02. INVITATION (모시는 글 & 2단 인물 사진 & 이름 강조)
          - 영상 00:13 ~ 00:18 1:1 일치
          ======================================================== */}
      <section className="py-20 px-6 text-center bg-white border-t border-stone-100">
        <ScrollReveal>
          <span className="font-cormorant italic text-3xl sm:text-4xl text-[#222222] block mb-6 font-light tracking-wide">
            Invitation
          </span>

          {/* 모시는 글 본문 */}
          <div className="text-xs sm:text-[13px] leading-[2.5] text-stone-600 font-light max-w-[310px] mx-auto mb-12 whitespace-pre-line break-keep">
            {invitation?.message || ''}
          </div>

          {/* 신랑 & 신부 2단 정사각 인물 스냅 사진 (개별 독사진이 등록되었을 때만 노출) */}
          {groomPhoto && bridePhoto && (
            <div className="grid grid-cols-2 gap-3 max-w-[330px] mx-auto mb-10">
              <div className="aspect-square overflow-hidden bg-stone-100 shadow-2xs group">
                <img
                  src={groomPhoto}
                  alt="Groom Portrait"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="aspect-square overflow-hidden bg-stone-100 shadow-2xs group">
                <img
                  src={bridePhoto}
                  alt="Bride Portrait"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          )}

          {/* 부모님 & 신랑신부 성함 (영상과 동일하게 '세희', '지호' 이름만 굵고 크게 강조, 미입력 시 방어 처리) */}
          {(groomParents || brideParents) ? (
            <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-5 gap-y-3.5 text-xs sm:text-[13px] text-stone-800 mx-auto select-none">
              {groomParents ? (
                <>
                  <div className="text-right text-stone-600 font-normal">
                    {groomParents}
                  </div>
                  <div className="text-center text-stone-400 font-light text-[11px] px-1">
                    {groomRelation}
                  </div>
                  <div className="text-left text-stone-900 font-medium text-sm sm:text-[15px] tracking-wide">
                    {groomFirstNameOnly || groomName}
                  </div>
                </>
              ) : (
                <>
                  <div />
                  <div />
                  <div className="text-center text-stone-900 font-medium text-sm sm:text-[15px] tracking-wide">
                    {groomFirstNameOnly || groomName}
                  </div>
                </>
              )}

              {brideParents ? (
                <>
                  <div className="text-right text-stone-600 font-normal">
                    {brideParents}
                  </div>
                  <div className="text-center text-stone-400 font-light text-[11px] px-1">
                    {brideRelation}
                  </div>
                  <div className="text-left text-stone-900 font-medium text-sm sm:text-[15px] tracking-wide">
                    {brideFirstNameOnly || brideName}
                  </div>
                </>
              ) : (
                <>
                  <div />
                  <div />
                  <div className="text-center text-stone-900 font-medium text-sm sm:text-[15px] tracking-wide">
                    {brideFirstNameOnly || brideName}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-sm font-medium text-stone-900 tracking-wider">
              {groomName} · {brideName}
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* ========================================================
          03. CALENDAR (투명 테이블 격자 + 블러 사진 투과 + 2바퀴 손그림 드로잉)
          - 사용자 전달 캡처 이미지 및 영상 1:1 일치
          - 둥근 흰색 카드 제거 -> 투명 그리드 테이블로 전면 변경
          ======================================================== */}
      <section 
        ref={calendarRef}
        className="relative py-20 px-4 sm:px-6 text-center overflow-hidden border-t border-stone-200/60"
      >
        {/* 캘린더 배경: 영상(frame_009, 010) 1:1 일치 - 웨딩 사진이 가득 차게 블러되어 신랑·신부의 따뜻한 살구/베이지톤 실루엣이 캘린더 투명 격자 뒤로 확연히 투과됨 */}
        {mainImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-85 pointer-events-none filter blur-[22px] scale-105"
            style={{ backgroundImage: `url(${mainImage})` }}
          />
        )}
        {/* 전체 부드러운 소프트 화이트 틴트 및 하단 다음 섹션으로 이어지는 자연스러운 페이드 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/15 to-white/90 pointer-events-none" />

        <div className="relative z-10">
          <ScrollReveal>
            {/* 상단 일시 (2035 / 10 / 20 / 12:00 PM) */}
            <div className="font-sans text-xs sm:text-[13px] tracking-[0.16em] text-stone-700 font-medium uppercase mb-7 sm:mb-8">
              {dateDetails.year} / {dateDetails.month} / {dateDetails.day} / {dateDetails.timeFull}
            </div>

            {/* 캘린더 테이블 (반투명 밀크 글래스 + 투명 격자 그리드 - 캡처 1:1 일치)
                - 완전히 투명하기만 한 것이 아니라, 반투명 화이트(bg-white/45)가 깔려 뒤의 사진 실루엣이 은은하게 비치면서도 글자가 선명함 */}
            <div className="w-full max-w-[370px] mx-auto bg-white/45 backdrop-blur-[3px] border-x border-stone-400/50 mb-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              
              {/* 요일 헤더 행 */}
              <div className="grid grid-cols-3 divide-x divide-stone-400/50 border-y border-stone-400/50 text-center py-2.5 bg-white/20">
                <span className="text-[11px] sm:text-xs font-sans tracking-[0.14em] text-stone-500 uppercase">
                  {dateDetails.prevDayEn}
                </span>
                <span className="text-[11px] sm:text-xs font-sans tracking-[0.14em] text-stone-800 font-semibold uppercase">
                  {dateDetails.dayEn}
                </span>
                <span className="text-[11px] sm:text-xs font-sans tracking-[0.14em] text-stone-500 uppercase">
                  {dateDetails.nextDayEn}
                </span>
              </div>

              {/* 날짜 행 (세로로 긴 직사각형 투명 셀) */}
              <div className="grid grid-cols-3 divide-x divide-stone-400/50 border-b border-stone-400/50 text-center">
                
                {/* 1. 어제 날짜 (19) */}
                <div className="min-h-[155px] sm:min-h-[170px] py-4 flex flex-col items-center justify-start">
                  <span className="font-sans text-4xl sm:text-[48px] font-extralight text-stone-400/70 leading-none mt-1 select-none">
                    {dateDetails.prevDayNum}
                  </span>
                </div>

                {/* 2. 당일 날짜 (20 + 세희♥지호 결혼식 + 빨간 2바퀴 손그림 스케치 드로잉) */}
                <div className="min-h-[155px] sm:min-h-[170px] py-4 relative flex flex-col items-center justify-start">
                  
                  {/* 숫자 20 */}
                  <span className="font-sans text-4xl sm:text-[48px] font-normal text-stone-900 leading-none mt-1 z-10 select-none">
                    {dateDetails.day}
                  </span>

                  {/* 세희 ♥ 지호 / 결혼식 */}
                  <div className="z-10 mt-3 text-center space-y-0.5 select-none">
                    <span className="block text-xs sm:text-[12.5px] font-medium text-stone-900 leading-tight">
                      {groomFirstNameOnly} ♥ {brideFirstNameOnly}
                    </span>
                    <span className="block text-[11px] sm:text-xs font-normal text-stone-700 leading-tight">
                      결혼식
                    </span>
                  </div>

                  {/* 날짜와 텍스트를 함께 감싸는 2바퀴 손그림 스케치 드로잉 SVG (영상 00:18 ~ 00:20 및 캡처 1:1 일치) */}
                  <svg
                    className="absolute -inset-2.5 sm:-inset-3 w-[calc(100%+20px)] sm:w-[calc(100%+24px)] h-[calc(100%+20px)] sm:h-[calc(100%+24px)] pointer-events-none z-20"
                    viewBox="0 0 130 160"
                  >
                    <path
                      d="M 46 142 C 18 126, 8 72, 34 32 C 60 -8, 108 2, 124 44 C 140 86, 118 138, 78 154 C 40 168, 10 134, 8 86 C 6 38, 48 4, 92 4 C 130 4, 142 54, 130 102 C 120 138, 92 158, 64 154 C 44 151, 34 140, 30 134"
                      fill="none"
                      stroke="#C5221F"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 840,
                        strokeDashoffset: isCalendarInView ? 0 : 840,
                        animation: isCalendarInView ? 'drawDoubleLoop 1.7s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none',
                        transform: 'rotate(-4deg)',
                        transformOrigin: '50% 50%',
                        opacity: isCalendarInView ? 1 : 0,
                        transition: 'opacity 0.2s ease-out',
                      }}
                    />
                  </svg>
                </div>

                {/* 3. 다음날 날짜 (21) */}
                <div className="min-h-[155px] sm:min-h-[170px] py-4 flex flex-col items-center justify-start">
                  <span className="font-sans text-4xl sm:text-[48px] font-extralight text-stone-400/70 leading-none mt-1 select-none">
                    {dateDetails.nextDayNum}
                  </span>
                </div>

              </div>
            </div>

            {/* 하단 예식 장소 명칭 (고객 정보 우선, 샘플 모드일 때만 기본값) */}
            {(invitation?.venue_address || invitation?.venue_name || isSample) && (
              <div className="space-y-1.5 text-center">
                <p className="text-xs sm:text-[13px] text-stone-600 font-light tracking-tight">
                  {invitation?.venue_address || ''}
                </p>
                <p className="text-base sm:text-[18px] text-stone-900 font-medium tracking-tight">
                  {[invitation?.venue_name, invitation?.venue_hall].filter(Boolean).join(' ')}
                </p>
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================
          04. INTERVIEW (신랑·신부 인터뷰 - 우리의 이야기)
          - 영상 00:23 ~ 00:36 1:1 일치
          - 버튼 탭 시 화면 하단에서 스르륵 올라오는 바텀시트 슬라이드업 애니메이션
          ======================================================== */}
      {interviews && interviews.length > 0 && (
        <section className="py-20 px-6 text-center bg-white border-t border-stone-100">
          <ScrollReveal>
            <span className="font-cormorant italic text-3xl sm:text-4xl text-[#222222] block mb-2 font-light tracking-wide">
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
          05. GALLERY (와이드 2장 전면 + 3열 빈틈없는 그리드 타일)
          - 영상 frame_018, frame_019 1:1 일치
          - 사진들 간의 간격/빈틈 0px(no-gap) 및 화면 가로폭 100% 밀착 룩
          - 더보기 클릭 시 숨겨진 사진들이 스르륵 아래로 펼쳐지는 확장 모션
          ======================================================== */}
      {galleryImages.length > 0 && (
        <section className="py-20 px-0 bg-white border-t border-stone-100">
          <ScrollReveal>
            {/* 상단 와이드 화보 2장 (영상 frame_018, frame_019: 간격 0px로 위아래 밀착) */}
            {widePhotos.length > 0 && (
              <div className="space-y-0 mb-0">
                {widePhotos.map((img, idx) => (
                  <div
                    key={`wide-${idx}`}
                    onClick={() => {
                      setGalleryModalIndex(idx);
                      setGalleryModalOpen(true);
                    }}
                    className="w-full aspect-[4/3] rounded-none overflow-hidden bg-stone-100 cursor-pointer group"
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

            {/* 3열 정사각 썸네일 그리드 (영상 frame_019: 빈틈/간격 0px로 타일처럼 딱 붙어 있는 룩) */}
            {gridPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-0">
                {visibleGridPhotos.map((img, idx) => {
                  const realIndex = idx + widePhotos.length;
                  return (
                    <div
                      key={`grid-${idx}`}
                      onClick={() => {
                        setGalleryModalIndex(realIndex);
                        setGalleryModalOpen(true);
                      }}
                      className="aspect-square overflow-hidden bg-stone-100 cursor-pointer group"
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

            {/* 더보기 버튼 (영상 00:46 및 frame_020과 1:1 일치하는 밑줄 텍스트 스타일) */}
            {gridPhotos.length > 9 && !galleryExpanded && (
              <div className="text-center pt-8 pb-2">
                <button
                  type="button"
                  onClick={() => setGalleryExpanded(true)}
                  className="text-xs text-stone-600 underline underline-offset-4 hover:text-stone-900 transition-colors cursor-pointer bg-transparent border-none py-1 select-none"
                >
                  더보기
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
      <section className="py-20 bg-white border-t border-stone-100">
        <ScrollReveal>
          {/* 상단 텍스트 정보 */}
          <div className="text-center mb-8 px-6">
            <span className="font-cormorant italic text-3xl sm:text-4xl text-[#222222] block mb-3 font-light tracking-wide">
              Location
            </span>
            <h2 className="font-serif text-base sm:text-lg text-stone-900 font-medium mb-1">
              {[invitation?.venue_name, invitation?.venue_hall].filter(Boolean).join(' ')}
            </h2>
            <p className="text-xs text-stone-500 font-light mb-2">
              {invitation?.venue_address} {invitation?.venue_detail || ''}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(invitation?.venue_address, '예식장 주소가')}
              className="text-xs text-stone-600 underline underline-offset-4 hover:text-stone-900 transition-colors cursor-pointer bg-transparent border-none py-1 select-none"
            >
              주소복사
            </button>
          </div>

          {/* 카카오 지도 (화면 좌우 꽉 찬 완벽한 풀위드 - 쏠림 0%) */}
          {(invitation?.venue_address || isSample) && (
            <div className="w-full overflow-hidden border-y border-stone-200 mb-6 shadow-2xs">
              <KakaoMap
                address={invitation?.venue_address || ''}
                venueName={invitation?.venue_name || ''}
              />
            </div>
          )}

          <div className="px-6">
            {/* 대중교통 및 주차 안내 목록 (실제 고객이 입력한 내용만 표시, 미입력 시 숨김) */}
            {transportationList.length > 0 && (
              <div className="py-4 border-b border-stone-100 text-xs text-left space-y-3">
                {transportationList.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-[56px_1fr] gap-3 items-start">
                    <span className="font-medium text-stone-800 shrink-0">
                      {t.title}
                    </span>
                    <p className="text-stone-600 font-light leading-relaxed whitespace-pre-line">
                      {t.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 내비게이션 길안내 버튼 (카카오, 네이버) */}
            <div className="pt-5">
              <div className="flex items-center justify-between text-xs text-stone-700">
                <span className="font-medium text-stone-600">내비게이션</span>
                <div className="flex items-center gap-2">
                  {[
                    { name: '카카오', url: `kakaonavi://search?q=${encodeURIComponent(invitation?.venue_name || '')}` },
                    { name: '네이버', url: `nmap://action/search?query=${encodeURIComponent(invitation?.venue_name || '')}` },
                  ].map((nav) => (
                    <a
                      key={nav.name}
                      href={nav.url}
                      className="px-3 py-1.5 bg-[#F9F9F9] hover:bg-stone-200/80 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 transition-colors active:scale-95"
                    >
                      {nav.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ========================================================
          07. ACCOUNT (마음 전하실 곳 - 부드러운 아코디언 애니메이션)
          - 순백 화이트 베이스 + 영상 00:56 ~ 01:00 1:1 일치
          - 기본은 접힘 상태이며 누르면 화살표 회전과 함께 부드럽게 펼쳐집니다.
          ======================================================== */}
      {(groomAccounts.length > 0 || brideAccounts.length > 0) && (
        <section className="py-20 px-6 bg-white border-t border-stone-100">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-cormorant italic text-3xl sm:text-4xl text-[#222222] block mb-2 font-light tracking-wide">
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
                <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setOpenGroomAccount(!openGroomAccount)}
                    className="w-full p-4 flex items-center justify-between text-xs font-semibold text-stone-800 cursor-pointer select-none"
                  >
                    <span>신랑측 계좌번호</span>
                    <svg 
                      className={`w-4 h-4 text-stone-400 transition-transform duration-300 transform ${openGroomAccount ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.6" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div 
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      openGroomAccount ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2 pt-1 border-t border-stone-100">
                        {groomAccounts.map((acc, idx) => (
                          <div key={idx} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-medium text-stone-900 block">
                                {acc.holder || acc.title}
                              </span>
                              <span className="font-mono text-stone-500 text-[11px] block">
                                {acc.bank} {acc.number || acc.account_number}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc.number || acc.account_number, `${acc.holder || acc.title} 계좌번호가`)}
                              className="px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-400 rounded-lg text-[11px] font-medium text-stone-700 hover:text-black cursor-pointer shadow-2xs active:scale-95 transition-all"
                            >
                              복사하기
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 신부측 계좌 아코디언 */}
              {brideAccounts.length > 0 && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setOpenBrideAccount(!openBrideAccount)}
                    className="w-full p-4 flex items-center justify-between text-xs font-semibold text-stone-800 cursor-pointer select-none"
                  >
                    <span>신부측 계좌번호</span>
                    <svg 
                      className={`w-4 h-4 text-stone-400 transition-transform duration-300 transform ${openBrideAccount ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.6" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div 
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      openBrideAccount ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-2 pt-1 border-t border-stone-100 divide-y divide-stone-100">
                        {brideAccounts.map((acc, idx) => (
                          <div key={idx} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-b-0 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-medium text-stone-900 block">
                                {acc.holder || acc.title}
                              </span>
                              <span className="font-mono text-stone-500 text-[11px] block">
                                {acc.bank} {acc.number || acc.account_number}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc.number || acc.account_number, `${acc.holder || acc.title} 계좌번호가`)}
                              className="px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-400 rounded-lg text-[11px] font-medium text-stone-700 hover:text-black cursor-pointer shadow-2xs active:scale-95 transition-all"
                            >
                              복사하기
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          08. RSVP (확장형 인페이지 참석 여부 - 영상 01:01 ~ 01:09 1:1)
          - 순백 화이트 배경 & 영상 속 라디오 체크 스타일
          - 참석 가능/불가 전환 시 부드러운 아코디언 확장 모션
          ======================================================== */}
      <section className="py-20 px-6 bg-white border-t border-stone-100">
        <ScrollReveal>
          <div className="text-center mb-8">
            <span className="font-cormorant italic text-3xl sm:text-4xl text-[#222222] block mb-2 font-light tracking-wide">
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
            {/* 1. 참석 여부 라디오 탭 (영상 frame_030 1:1 일치) */}
            <div>
              <span className="block text-xs font-semibold text-stone-800 mb-2 text-left">
                <span className="text-rose-500 mr-1">*</span>참석 여부
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { val: true, label: '참석 가능' },
                  { val: false, label: '참석 불가' },
                ].map((opt) => {
                  const selected = rsvpAttend === opt.val;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setRsvpAttend(opt.val)}
                      className={`py-3 px-4 rounded-xl text-xs font-medium border flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                        selected
                          ? 'border-stone-400 bg-white text-stone-900 shadow-2xs'
                          : 'border-stone-200 bg-[#FAFAFA] text-stone-600'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          selected ? 'border-stone-700' : 'border-stone-300 bg-white'
                        }`}
                      >
                        {selected && <span className="w-2 h-2 rounded-full bg-stone-700" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 성함 및 구분 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-800">
                  <span className="text-rose-500 mr-1">*</span>성함
                </span>
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
                className="w-full px-3.5 py-3 bg-[#FAFAFA] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
              />
            </div>

            {/* 2-1. 휴대전화 번호 뒤 4자리 */}
            <div>
              <span className="block text-xs font-semibold text-stone-800 mb-2 text-left">
                <span className="text-rose-500 mr-1">*</span>휴대전화 번호 뒤 4자리
              </span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={4}
                value={rsvpPhone}
                onChange={(e) => setRsvpPhone(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="동명이인 구분을 위한 번호 뒤 4자리 (예: 1234)"
                className="w-full px-3.5 py-3 bg-[#FAFAFA] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
              />
            </div>

            {/* 참석 가능 시 추가 옵션들 (부드러운 슬라이드다운 트랜지션) */}
            <div 
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                rsvpAttend ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden space-y-5">
                {/* 3. 참석 인원 수 카운터 */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-stone-800">
                    <span className="text-rose-500 mr-1">*</span>참석 인원
                  </span>
                  <div className="flex items-center gap-3 bg-[#FAFAFA] border border-stone-200 rounded-xl px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => setRsvpCount(Math.max(1, rsvpCount - 1))}
                      className="w-6 h-6 flex items-center justify-center text-stone-600 font-bold hover:bg-stone-200 rounded-lg cursor-pointer active:scale-90"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-semibold text-stone-900 min-w-5 text-center">
                      {rsvpCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRsvpCount(rsvpCount + 1)}
                      className="w-6 h-6 flex items-center justify-center text-stone-600 font-bold hover:bg-stone-200 rounded-lg cursor-pointer active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. 식사 여부 (영상 frame_034 3분할 라디오) */}
                <div>
                  <span className="block text-xs font-semibold text-stone-800 mb-2 text-left">
                    <span className="text-rose-500 mr-1">*</span>식사 여부
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['미정', '식사 가능', '식사 불가'].map((mealOpt) => {
                      const selected = rsvpMeal === mealOpt;
                      return (
                        <button
                          key={mealOpt}
                          type="button"
                          onClick={() => setRsvpMeal(mealOpt)}
                          className={`py-2.5 px-2.5 rounded-xl text-[11px] font-medium border flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                            selected
                              ? 'border-stone-400 bg-white text-stone-900 shadow-2xs'
                              : 'border-stone-200 bg-[#FAFAFA] text-stone-600'
                          }`}
                        >
                          <span className="truncate">{mealOpt}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${
                              selected ? 'border-stone-700' : 'border-stone-300 bg-white'
                            }`}
                          >
                            {selected && <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. 전세버스 탑승 여부 (버스 운행 시에만 노출) */}
                {showBusOption && (
                  <div>
                    <span className="block text-xs font-semibold text-stone-800 mb-2 text-left">
                      <span className="text-rose-500 mr-1">*</span>전세버스 탑승 여부
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {['탑승', '미탑승'].map((busOpt) => {
                        const selected = rsvpBus === busOpt;
                        return (
                          <button
                            key={busOpt}
                            type="button"
                            onClick={() => setRsvpBus(busOpt)}
                            className={`py-3 px-4 rounded-xl text-xs font-medium border flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                              selected
                                ? 'border-stone-400 bg-white text-stone-900 shadow-2xs'
                                : 'border-stone-200 bg-[#FAFAFA] text-stone-600'
                            }`}
                          >
                            <span>{busOpt}</span>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                selected ? 'border-stone-700' : 'border-stone-300 bg-white'
                              }`}
                            >
                              {selected && <span className="w-2 h-2 rounded-full bg-stone-700" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. 개인정보 수집 및 이용 동의 (영상 frame_034 1:1 일치) */}
            <div className="p-4 bg-[#FAFAFA] rounded-xl border border-stone-200/80 text-[11px] text-stone-500 space-y-2 text-left">
              <label className="flex items-start gap-2.5 cursor-pointer text-stone-800 font-medium">
                <input
                  type="checkbox"
                  required
                  checked={rsvpConsent}
                  onChange={(e) => setRsvpConsent(e.target.checked)}
                  className="mt-0.5 accent-stone-900 rounded"
                />
                <span>개인정보 수집 및 이용에 동의합니다.</span>
              </label>
              <div className="text-[10px] text-stone-400 font-light leading-relaxed pl-6 space-y-0.5">
                <p>수집 항목: 성함, 휴대전화 번호 뒤 4자리, 참석 여부, 신랑·신부 측 구분, 참석 인원, 식사 여부{showBusOption ? ', 전세버스 탑승 여부' : ''}</p>
                <p>이용 목적: 예식 참석 인원, 식사{showBusOption ? ' 및 전세버스 탑승 인원' : ''} 확인</p>
                <p>보관 기간: 예식 종료 후 즉시 파기</p>
              </div>
            </div>

            {/* 제출 버튼 (영상 frame_034 1:1 일치) */}
            <button
              type="submit"
              disabled={submittingRsvp}
              className="w-full py-3.5 bg-[#3F3F46] hover:bg-stone-900 text-white font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-98"
            >
              {submittingRsvp ? '참석 정보를 전달하고 있습니다...' : '제출'}
            </button>
          </form>
        </ScrollReveal>
      </section>

      {/* ========================================================
          09. INFORMATION (안내 카드 슬라이더)
          - 영상 01:10 ~ 01:13 및 frame_036 1:1 일치
          ======================================================== */}
      {infoNotices.length > 0 && (
        <section className="py-20 px-6 bg-white border-t border-stone-100">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-cormorant italic text-3xl sm:text-4xl text-[#222222] block mb-2 font-light tracking-wide">
                Information
              </span>
            </div>

            <div className="max-w-[360px] mx-auto relative bg-[#F9F9F9] rounded-none sm:rounded-xl p-8 text-center shadow-2xs">
              <div className="flex items-center justify-between mb-4 text-stone-400">
                <button
                  type="button"
                  onClick={() => setInfoCardIndex((prev) => (prev > 0 ? prev - 1 : infoNotices.length - 1))}
                  className="p-1 hover:text-stone-800 cursor-pointer text-sm font-mono active:scale-90 transition-transform"
                >
                  〈
                </button>
                <h3 className="text-sm font-bold text-stone-900 tracking-tight transition-opacity duration-300">
                  {infoNotices[infoCardIndex]?.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setInfoCardIndex((prev) => (prev < infoNotices.length - 1 ? prev + 1 : 0))}
                  className="p-1 hover:text-stone-800 cursor-pointer text-sm font-mono active:scale-90 transition-transform"
                >
                  〉
                </button>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-line break-keep min-h-[60px] flex items-center justify-center transition-opacity duration-300">
                {infoNotices[infoCardIndex]?.content}
              </p>

              {infoNotices.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-5">
                  {infoNotices.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
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
          10. GUESTBOOK (축하 방명록 - 영상 frame_038, frame_040 1:1 일치)
          ======================================================== */}
      {config.show_guestbook !== false && (
        <section className="py-20 px-6 bg-white border-t border-stone-100">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-cormorant italic text-3xl sm:text-4xl text-[#222222] block mb-2 font-light tracking-wide">
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
            <form onSubmit={handleGuestbookSubmit} className="max-w-[370px] mx-auto space-y-2 mb-10">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={guestbookName}
                  onChange={(e) => setGuestbookName(e.target.value)}
                  placeholder="이름 또는 닉네임"
                  className="w-full px-3.5 py-3 bg-[#FAFAFA] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
                />
                <input
                  type="password"
                  required
                  value={guestbookPassword}
                  onChange={(e) => setGuestbookPassword(e.target.value)}
                  placeholder="비밀번호(삭제용)"
                  className="w-full px-3.5 py-3 bg-[#FAFAFA] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400"
                />
              </div>
              <div className="relative">
                <textarea
                  rows={3}
                  required
                  maxLength={150}
                  value={guestbookMessage}
                  onChange={(e) => setGuestbookMessage(e.target.value)}
                  placeholder="축하 메시지를 남겨주세요."
                  className="w-full p-3.5 pb-6 bg-[#FAFAFA] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 leading-relaxed focus:outline-none focus:border-stone-400"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-stone-400 font-mono">
                  {guestbookMessage.length}/150
                </span>
              </div>
              <button
                type="submit"
                disabled={submittingGuestbook}
                className="w-full py-3 bg-white border border-stone-300 hover:border-black text-stone-800 hover:text-black font-medium text-xs rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50 active:scale-98"
              >
                {submittingGuestbook ? '등록 중...' : '메시지 남기기'}
              </button>
            </form>

            {/* 방명록 목록 (영상 frame_038, frame_040 1:1 일치: 흰색 바탕에 메시지 + 이름 + 삭제 버튼 + 구분선) */}
            <div className="max-w-[370px] mx-auto">
              {guestbookList.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  첫 번째 축하 메시지를 남겨주세요 ✨
                </div>
              ) : (
                (() => {
                  const itemsPerPage = 3;
                  const totalPages = Math.ceil(guestbookList.length / itemsPerPage);
                  const startIndex = (guestbookPage - 1) * itemsPerPage;
                  const currentItems = guestbookList.slice(startIndex, startIndex + itemsPerPage);

                  return (
                    <div className="space-y-4">
                      {currentItems.map((item) => (
                        <div key={item.id} className="text-left pb-4 border-b border-stone-100 last:border-b-0 space-y-1.5">
                          <p className="text-xs sm:text-[13px] text-stone-800 leading-relaxed font-light whitespace-pre-line break-keep">
                            {item.content || item.message}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-stone-400 font-light">
                            <span>{item.author || item.name}</span>
                            {item.id && (
                              <button
                                type="button"
                                onClick={() => setDeleteTargetMsg(item)}
                                className="text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors cursor-pointer select-none"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* 페이징 버튼 (영상 frame_040과 1:1 일치: 이전   1 / 2   다음) */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-stone-400 font-light select-none">
                          <button
                            type="button"
                            onClick={() => setGuestbookPage((p) => Math.max(1, p - 1))}
                            disabled={guestbookPage === 1}
                            className="hover:text-stone-800 disabled:opacity-30 cursor-pointer"
                          >
                            이전
                          </button>
                          <span className="font-mono text-[11px] text-stone-500">
                            {guestbookPage} / {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setGuestbookPage((p) => Math.min(totalPages, p + 1))}
                            disabled={guestbookPage === totalPages}
                            className="hover:text-stone-800 disabled:opacity-30 cursor-pointer"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          11. FOOTER & 공유 버튼 (영상 frame_040, frame_042 1:1 일치)
          ======================================================== */}
      <footer className="py-16 px-6 bg-white border-t border-stone-100 text-center select-none">
        <ScrollReveal>
          <div className="max-w-[370px] mx-auto space-y-3 mb-12">
            <button
              type="button"
              onClick={handleKakaoShare}
              className="w-full py-3.5 sm:py-4 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs sm:text-sm font-normal rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
            >
              카카오톡으로 공유하기
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  handleCopy(window.location.href, '청첩장 링크가');
                }
              }}
              className="w-full py-3.5 sm:py-4 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs sm:text-sm font-normal rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
            >
              청첩장 링크 복사하기
            </button>
          </div>

          <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase select-none">
            Designed by ATELIER DE MUKIRU
          </p>
        </ScrollReveal>
      </footer>

      {/* 신랑 & 신부 인터뷰 모달 (바텀시트 슬라이드업 애니메이션) */}
      {interviewModalOpen && (
        <SceneInterviewModal
          isOpen={interviewModalOpen}
          onClose={() => setInterviewModalOpen(false)}
          interviews={interviews}
          groomName={groomName}
          brideName={brideName}
        />
      )}

      {/* 사진 라이트박스 뷰어 모달 */}
      {galleryModalOpen && (
        <SceneGalleryModal
          isOpen={galleryModalOpen}
          onClose={() => setGalleryModalOpen(false)}
          images={galleryImages}
          initialIndex={galleryModalIndex}
        />
      )}

      {/* 방명록 삭제 확인 모달 */}
      {deleteTargetMsg && (
        <SceneGuestbookDeleteModal
          targetMsg={deleteTargetMsg}
          onClose={() => setDeleteTargetMsg(null)}
          onDeleteSuccess={(deletedId) => {
            setGuestbookList((prev) => prev.filter((msg) => msg.id !== deletedId));
          }}
        />
      )}

    </div>
  );
}
