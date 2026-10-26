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

export default function PlaylistTemplate({ invitation }) {
  // 1. 모달 상태 (조건부 렌더링 철저 유지)
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showGuestbookModal, setShowGuestbookModal] = useState(false);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);

  // 2. 뮤직 플레이어 위젯 & 바이닐 LP 애니메이션 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState('0:00');
  const [audioTotalDuration, setAudioTotalDuration] = useState('3:19');


  // 4. 계좌 아코디언 토글
  const [openGroomAccount, setOpenGroomAccount] = useState(true);
  const [openBrideAccount, setOpenBrideAccount] = useState(true);

  // 6. 방명록 상태
  const [guestbookList, setGuestbookList] = useState([]);
  const [guestbookIndex, setGuestbookIndex] = useState(0);

  // 7. 갤러리 메인 뷰어 인덱스
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  // 8. 데이터 언패킹 & fallback
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'playlist');
  const config = invitation?.template_config || {};
  const images = invitation?.images || {};
  const extra = invitation?.extra_data || {};

  const showCountdownSection = config.show_countdown !== false;
  const showGallerySection = config.show_gallery !== false;
  const showAccountsSection = config.show_accounts !== false;
  const showRsvpSection = config.show_rsvp !== false;
  const showGuestbookSection = config.show_guestbook !== false;
  const showQuoteSection = config.show_quote_section !== false;

  // 대표 이미지 매핑 (원본 보존)
  const mainImage = images.main || images.cover || invitation?.main_image || '';
  const couplePhoto = images.couple_profile || images.couple || extra.couple_profile_image || mainImage;
  const endingImage = images.ending || extra.ending_image || invitation?.ending_image || mainImage;

  // 갤러리 이미지 안전 파싱
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

  // 성함 데이터 (하드코딩 제거: 미입력 시 빈 문자열)
  const groomName = invitation?.groom_name || '';
  const brideName = invitation?.bride_name || '';
  const groomFirstEn = invitation?.groom_first_name_en || (invitation?.groom_name_en || '').split(' ')[0] || '';
  const brideFirstEn = invitation?.bride_first_name_en || (invitation?.bride_name_en || '').split(' ')[0] || '';
  const coupleNamesEn = invitation?.main_names_en || [groomFirstEn, brideFirstEn].filter(Boolean).join(' & ');

  // 날짜 파싱
  const weddingDateStr = invitation?.wedding_date ? invitation.wedding_date.replace(' ', 'T') : '';
  const dateObj = weddingDateStr ? new Date(weddingDateStr) : new Date();
  const year = isNaN(dateObj.getFullYear()) ? 2026 : dateObj.getFullYear();
  const month = isNaN(dateObj.getMonth()) ? 10 : dateObj.getMonth() + 1;
  const date = isNaN(dateObj.getDate()) ? 24 : dateObj.getDate();
  const hours = isNaN(dateObj.getHours()) ? 12 : dateObj.getHours();
  const minutes = isNaN(dateObj.getMinutes()) ? 0 : dateObj.getMinutes();
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, '0');

  const DAYS_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayKo = DAYS_KO[dateObj.getDay()] || '토요일';
  const dayEn = DAYS_EN[dateObj.getDay()] || 'Saturday';
  const monthEn = MONTHS_EN[month - 1] || 'October';

  // D-Day 계산
  const [dDay, setDDay] = useState(0);
  useEffect(() => {
    if (!weddingDateStr) return;
    const now = new Date();
    const target = new Date(weddingDateStr);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    setDDay(diff);
  }, [weddingDateStr]);

  // 전역 오디오 상태 동기화 및 제어 (상단 BgmPlayer와 100% 실시간 양방향 이벤트 동기화)
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
    // DOM 마운트 타이밍 대응 및 폴백 체크
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
      const { data } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_id', invitation.id)
        .order('created_at', { ascending: false });
      if (data) setGuestbookList(data);
    }
    loadGuestbook();
  }, [invitation?.id]);

  // 계좌번호 파싱
  const groomAccounts = useMemo(() => {
    if (!Array.isArray(invitation?.accounts)) return [];
    return invitation.accounts.filter((a) => a.group === '신랑측');
  }, [invitation?.accounts]);

  const brideAccounts = useMemo(() => {
    if (!Array.isArray(invitation?.accounts)) return [];
    return invitation.accounts.filter((a) => a.group === '신부측');
  }, [invitation?.accounts]);

  // 클립보드 복사
  const handleCopy = (text, label) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`${label}이(가) 복사되었습니다.`);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert(`${label}이(가) 복사되었습니다.`);
    }
  };

  return (
    <div className="w-full max-w-[440px] min-h-screen bg-[#FBF9F5] text-[#222E26] font-sans mx-auto shadow-2xl relative overflow-hidden select-none">
      
      {/* 예식 당일 안내 데스크 (당일 자동 전환) */}
      <TodayConciergeCard invitation={invitation} />
      
      {/* ========================================================
          01. HERO SECTION: PREMIUM WEDDING PLAYLIST CARD (레퍼런스 100% 픽셀 매칭)
              (화이트/크림 카드 + 정갈한 명조체 + 1줄 고정 카피 + 정밀 컨트롤러)
          ======================================================== */}
      <section className="relative px-4 pt-7 pb-10 bg-linear-to-b from-[#F7F5EE] via-[#FAF8F5] to-[#FAF8F5]">
        
        {/* 감성 뮤직 플레이어 카드 (기준 이미지 100% 일치 규격 & 디자인) */}
        <div className="w-full max-w-[370px] sm:max-w-[390px] mx-auto bg-[#FAF8F5] rounded-[40px] p-3.5 sm:p-4.5 pb-6 sm:pb-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-stone-200/70 select-none">
          
          {/* 1. 상단 둥근 웨딩 화보 사진 (기준 이미지 aspect-[537/525] 1:1 완벽 일치) */}
          <div className="relative w-full aspect-[537/525] rounded-[32px] overflow-hidden bg-stone-200 shadow-xs">
            {mainImage ? (
              <img
                src={mainImage}
                alt="Wedding Album Cover"
                className="w-full h-full object-cover grayscale contrast-105"
              />
            ) : isSample ? (
              <img
                src="/playlist-couple.png"
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

              {/* 좋아요 하트 버튼 (기준 이미지 원본 얇은 미니멀 라인 하트 ♡ 1:1 일치) */}
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

            {/* 1줄 고정 하드코딩 서브카피: '저희  결혼합니다.' (자간 0.18em Noto Serif KR) */}
            <p 
              style={{ fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', serif" }}
              className="text-[12.5px] text-[#8E8E93] tracking-[0.18em] font-normal mt-1.5"
            >
              저희  결혼합니다.
            </p>
          </div>

          {/* 3. 프로그레스 바 (트랙 높이 3px, 정밀 핸들, 시간 텍스트) */}
          <div className="mt-5 px-1.5">
            {/* 트랙 바 */}
            <div 
              onClick={togglePlayAudio}
              className="relative w-full h-[3px] bg-[#E5E5EA] rounded-full cursor-pointer flex items-center"
            >
              <div 
                className="h-full bg-[#1C1C1E] rounded-full transition-all duration-300 relative flex items-center justify-end"
                style={{ width: `${isPlaying ? trackProgress : 38}%` }}
              >
                {/* 둥근 핸들 점 (기준 이미지 100% 매칭) */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#1C1C1E] shadow-sm shrink-0 -mr-1" />
              </div>
            </div>

            {/* 시간 표시 (3:19 / - 4:26) */}
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#8E8E93]">
              <span>{isPlaying ? audioCurrentTime : '3:19'}</span>
              <span>- {isPlaying ? audioTotalDuration : '4:26'}</span>
            </div>
          </div>

          {/* 4. 하단 미디어 컨트롤러 (기준 이미지 1:1 시원한 간격 & 정밀 비트맵 일치) */}
          <div className="mt-6 mb-2 px-1 w-full flex items-center justify-between">
            {/* 1. 셔플 (Shuffle: 원작 픽셀 매칭) */}
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

            {/* 2. 이전 곡 (Previous: 원작 Solid 매칭) */}
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

            {/* 3. 중앙 대형 재생/일시정지 원형 버튼 (기준 이미지 1:1 직경 54px, ❚❚ / ▶ 전환) */}
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-[52px] h-[52px] rounded-full bg-[#1C1C1E] hover:bg-black text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? (
                /* 재생 중: 기준 이미지 1:1 일치 일시정지 막대 2개 */
                <svg className="w-[17px] h-[19px] fill-white" viewBox="0 0 20 24">
                  <rect x="2.5" y="3" width="5" height="18" rx="1.5" />
                  <rect x="12.5" y="3" width="5" height="18" rx="1.5" />
                </svg>
              ) : (
                /* 미재생: 정통 재생 삼각형 (가운데 정렬) */
                <svg className="w-[18px] h-[19px] fill-white translate-x-0.5" viewBox="0 0 20 24">
                  <path d="M4 3.5v17a1 1 0 0 0 1.54.85l13-8.5a1 1 0 0 0 0-1.7l-13-8.5A1 1 0 0 0 4 3.5z" />
                </svg>
              )}
            </button>

            {/* 4. 다음 곡 (Next: 원작 Solid 매칭) */}
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

            {/* 5. 반복 (Repeat: 원작 픽셀 매칭 루프 화살표) */}
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
          02. LINER NOTES: INVITATION STORY (모시는 글 / 앨범 속지)
          ======================================================== */}
      <section className="py-16 px-7 bg-white border-t border-stone-200/60 relative">
        <ScrollReveal>
          <div className="text-center max-w-xs mx-auto">
            <span className="font-mono text-[11px] tracking-[0.25em] text-emerald-700 uppercase block mb-2 font-semibold">
              LINER NOTES &middot; INVITATION
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-stone-900 tracking-tight font-normal mb-8">
              소중한 분들을 초대합니다
            </h2>

            {/* 명대사 / 인용구 섹션 */}
            {showQuoteSection && invitation?.quote_content && (
              <div className="mb-8 p-5 bg-[#FAF8F5] border border-stone-200/80 rounded-2xl relative shadow-2xs">
                <p className="text-xs sm:text-[13px] text-stone-800 leading-relaxed font-serif italic whitespace-pre-line">
                  &ldquo;{invitation.quote_content}&rdquo;
                </p>
                {invitation?.quote_source && (
                  <span className="block text-[11px] text-emerald-700 font-mono mt-3 text-right font-medium">
                    — {invitation.quote_source}
                  </span>
                )}
              </div>
            )}

            {/* 모시는 글 본문 (동적 데이터만 노출, 하드코딩 제거) */}
            {invitation?.message && (
              <p className="text-xs sm:text-[13px] text-stone-600 leading-loose font-light whitespace-pre-line break-keep">
                {invitation.message}
              </p>
            )}

            {/* 감성 커플 화보 (빈티지 폴라로이드 프레임 & 손글씨) */}
            {couplePhoto && (
              <div className="my-8 max-w-[280px] mx-auto p-3.5 pb-4 bg-white rounded-2xl border border-stone-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.06)] text-center">
                <p className="font-handwriting text-lg text-stone-500 mb-2 select-none tracking-wide">
                  we are getting married -
                </p>
                <div className="w-full aspect-3/4 rounded-xl overflow-hidden bg-stone-100 mb-2.5">
                  <img
                    src={couplePhoto}
                    alt="Couple Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-handwriting text-base text-stone-400 select-none">
                  on {monthEn} {date}, {year}
                </p>
              </div>
            )}

            {/* 양가 혼주 & 신랑 신부 정보 (음반 크레딧 스타일) */}
            {(groomName || brideName || invitation?.groom_father || invitation?.bride_father) && (
              <div className="mt-10 pt-8 border-t border-stone-200/60 space-y-3 text-xs sm:text-[13px]">
                {(invitation?.groom_father || invitation?.groom_mother || groomName) && (
                  <div className="flex items-center justify-center gap-2 text-stone-700">
                    <span className="text-stone-500">
                      {invitation?.groom_father && `${invitation.groom_father}${config.groom_father_deceased ? ' 故' : ''}`}
                      {invitation?.groom_father && invitation?.groom_mother && ' · '}
                      {invitation?.groom_mother && `${invitation.groom_mother}${config.groom_mother_deceased ? ' 故' : ''}`}
                    </span>
                    {(config.groom_relation || invitation?.groom_relation) && (
                      <span className="text-emerald-700 text-[11px] font-medium">의 {config.groom_relation || invitation?.groom_relation}</span>
                    )}
                    {groomName && <span className="font-semibold text-stone-900 ml-1">{groomName}</span>}
                  </div>
                )}

                {(invitation?.bride_father || invitation?.bride_mother || brideName) && (
                  <div className="flex items-center justify-center gap-2 text-stone-700">
                    <span className="text-stone-500">
                      {invitation?.bride_father && `${invitation.bride_father}${config.bride_father_deceased ? ' 故' : ''}`}
                      {invitation?.bride_father && invitation?.bride_mother && ' · '}
                      {invitation?.bride_mother && `${invitation.bride_mother}${config.bride_mother_deceased ? ' 故' : ''}`}
                    </span>
                    {(config.bride_relation || invitation?.bride_relation) && (
                      <span className="text-emerald-700 text-[11px] font-medium">의 {config.bride_relation || invitation?.bride_relation}</span>
                    )}
                    {brideName && <span className="font-semibold text-stone-900 ml-1">{brideName}</span>}
                  </div>
                )}
              </div>
            )}


            {/* 축하 연락하기 버튼 */}
            <div className="mt-8">
              <button
                onClick={() => setShowContactModal(true)}
                className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium border border-stone-200 transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
              >
                <span>📞</span>
                <span>신랑 &middot; 신부에게 축하 연락하기</span>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>


      {/* ========================================================
          03. PHOTO COLLECTION: FULL-RATIO LOOKBOOK (원본 비율 100% 보존 갤러리)
          ======================================================== */}
      {showGallerySection && galleryImages.length > 0 && (
        <section className="py-16 px-6 bg-[#FAF9F6] border-t border-stone-200/60">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-mono text-[11px] tracking-[0.25em] text-emerald-700 uppercase block mb-2 font-semibold">
                PHOTO COLLECTION &middot; GALLERY
              </span>
              <h2 className="font-serif text-2xl text-stone-900 font-normal tracking-tight">
                Our Moments
              </h2>
              <p className="text-xs text-stone-500 font-light mt-1">
                서로를 마주 본 찬란한 순간들
              </p>
            </div>

            {/* 대형 직사각형 메인 뷰어 (타원형 크롭 완전 폐기! 원본 화보 비율 100% 보존 + 슬라이드 인터랙션) */}
            <div 
              className="relative mx-auto max-w-[340px] aspect-3/4 rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-stone-200/80 mb-6 group bg-stone-100 transition-all select-none"
            >
              <img
                src={galleryImages[selectedGalleryIdx] || couplePhoto}
                alt={`Gallery View ${selectedGalleryIdx + 1}`}
                onClick={() => { setGalleryModalIndex(selectedGalleryIdx); setGalleryModalOpen(true); }}
                className="w-full h-full object-cover transition-all duration-500 cursor-pointer group-hover:scale-102"
              />

              {/* 트랙 번호 배지 */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] tracking-wider pointer-events-none">
                TRACK {String(selectedGalleryIdx + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}
              </div>

              {/* 이전 사진 터치 버튼 */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGalleryIdx((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md backdrop-blur-md flex items-center justify-center text-lg font-bold transition-all active:scale-90 cursor-pointer"
                  aria-label="이전 사진"
                >
                  &#8249;
                </button>
              )}

              {/* 다음 사진 터치 버튼 */}
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGalleryIdx((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone-800 shadow-md backdrop-blur-md flex items-center justify-center text-lg font-bold transition-all active:scale-90 cursor-pointer"
                  aria-label="다음 사진"
                >
                  &#8250;
                </button>
              )}

              {/* 하단 확대 안내 배너 오버레이 */}
              <div 
                onClick={() => { setGalleryModalIndex(selectedGalleryIdx); setGalleryModalOpen(true); }}
                className="absolute inset-x-0 bottom-0 pt-10 pb-4 bg-linear-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center cursor-pointer"
              >
                <span className="text-white text-xs font-serif italic tracking-wider drop-shadow-md flex items-center gap-1.5">
                  <span>터치하여 크게 보기</span>
                  <span className="text-[10px]">&#8599;</span>
                </span>
              </div>
            </div>

            {/* 사진 리스트 카운터 안내 */}
            <div className="flex items-center justify-between max-w-[340px] mx-auto mb-3 px-1">
              <span className="text-[11px] font-mono text-emerald-800 font-semibold uppercase tracking-wider">
                THUMBNAIL SELECTOR
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                {selectedGalleryIdx + 1} / {galleryImages.length}
              </span>
            </div>

            {/* 정갈한 3열 썸네일 그리드 (터치 시 상단 대형 뷰어 사진 즉시 전환) */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[340px] mx-auto">
              {galleryImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedGalleryIdx(idx)}
                  className={`aspect-square rounded-2xl overflow-hidden bg-stone-100 border transition-all duration-300 relative group cursor-pointer ${
                    selectedGalleryIdx === idx
                      ? 'border-emerald-700 ring-2 ring-emerald-700/30 shadow-md scale-102'
                      : 'border-stone-200/80 opacity-75 hover:opacity-100 shadow-2xs'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {selectedGalleryIdx === idx && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 shadow-xs" />
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          04. WEDDING SCHEDULE & COUNTDOWN (예식 일시 & D-Day)
          ======================================================== */}
      {showCountdownSection && (
        <section className="py-14 px-6 bg-white border-t border-stone-200/60 text-center">
          <ScrollReveal>
            <span className="font-mono text-[11px] tracking-[0.25em] text-emerald-700 uppercase block mb-2 font-semibold">
              RELEASE DATE &middot; SCHEDULE
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-stone-900 font-normal mb-2">
              {year}년 {month}월 {date}일 {dayKo}
            </h2>
            <p className="text-sm text-stone-600 font-medium mb-6">
              {ampm} {displayHours}시 {displayMinutes !== '00' ? `${displayMinutes}분` : ''}
            </p>

            {/* 디데이 카운트다운 카드 */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#FAF9F6] border border-stone-200/80 shadow-2xs">
              <span className="text-xs text-stone-600 font-normal">두 사람의 예식일까지</span>
              <span className="text-lg font-mono font-bold text-emerald-700">
                {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-DAY' : `D+${Math.abs(dDay)}`}
              </span>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          05. LOCATION & MAP (오시는 길)
          ======================================================== */}
      <section className="py-16 px-6 bg-[#FAF9F6] border-t border-stone-200/60">
        <ScrollReveal>
          <div className="text-center mb-8">
            <span className="font-mono text-[11px] tracking-[0.25em] text-emerald-700 uppercase block mb-2 font-semibold">
              VENUE &middot; LOCATION
            </span>
            {invitation?.venue_name && (
              <h2 className="font-serif text-2xl text-stone-900 font-normal">
                {invitation.venue_name}
              </h2>
            )}
            {config?.venue_hall && (
              <p className="text-xs text-emerald-700 mt-1 font-medium">{config.venue_hall}</p>
            )}
            {invitation?.venue_address && (
              <p className="text-xs text-stone-600 mt-2 font-light">
                {invitation.venue_address}
              </p>
            )}

          </div>

          {/* 카카오맵 지도 */}
          <div className="rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm mb-4">
            <KakaoMap
              address={invitation?.venue_address}
              venueName={invitation?.venue_name}
            />
          </div>

          {/* 길찾기 내비게이션 바로가기 버튼 (카카오맵, 네이버지도) */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(invitation?.venue_name || '')}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/80 text-xs text-center text-stone-800 font-medium transition-colors shadow-2xs"
            >
              카카오맵
            </a>
            <a
              href={`nmap://search?query=${encodeURIComponent(invitation?.venue_name || '')}&appname=wedding`}
              className="py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/80 text-xs text-center text-stone-800 font-medium transition-colors shadow-2xs"
            >
              네이버지도
            </a>
          </div>

          {/* 교통편 안내 카드 */}
          {Array.isArray(invitation?.transportation) && invitation.transportation.length > 0 && (
            <div className="mt-8 space-y-3">
              {invitation.transportation.map((trans, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
                  <h4 className="text-xs font-semibold text-emerald-800 mb-1">{trans.title}</h4>
                  <p className="text-xs text-stone-600 font-light leading-relaxed whitespace-pre-line">{trans.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>
      </section>

      {/* ========================================================
          06. ACCOUNTS: 마음 전하실 곳 (축의금 계좌)
          ======================================================== */}
      {showAccountsSection && (groomAccounts.length > 0 || brideAccounts.length > 0) && (
        <section className="py-16 px-6 bg-white border-t border-stone-200/60">
          <ScrollReveal>
            <div className="text-center mb-8">
              <span className="font-mono text-[11px] tracking-[0.25em] text-emerald-700 uppercase block mb-2 font-semibold">
                SUPPORT &middot; REGISTRY
              </span>
              <h2 className="font-serif text-2xl text-stone-900 font-normal">
                마음 전하실 곳
              </h2>
              <p className="text-xs text-stone-500 font-light mt-1">
                축복의 마음을 담아 전해주실 곳을 안내해 드립니다.
              </p>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              {/* 신랑측 계좌 */}
              {groomAccounts.length > 0 && (
                <div className="rounded-2xl bg-[#FAF9F6] border border-stone-200/80 overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setOpenGroomAccount(!openGroomAccount)}
                    className="w-full p-4 flex items-center justify-between text-left text-sm font-medium text-stone-900 hover:bg-stone-100/60 transition-colors cursor-pointer"
                  >
                    <span>신랑측 계좌번호</span>
                    <span className="text-xs text-emerald-700 font-mono font-medium">
                      {openGroomAccount ? '접기 ▲' : '열기 ▼'}
                    </span>
                  </button>
                  {openGroomAccount && (
                    <div className="px-4 pb-4 space-y-2.5 border-t border-stone-200/60 pt-3">
                      {groomAccounts.map((acc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                          <div>
                            <span className="text-stone-900 font-medium block">
                              {acc.bank} {acc.number || acc.account_number}
                            </span>
                            <span className="text-stone-500 text-[11px] mt-0.5 block">
                              예금주: {acc.holder || acc.name || ''}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(acc.number || acc.account_number, `${acc.bank} 계좌`)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-lg text-[11px] transition-colors shrink-0"
                          >
                            복사
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 신부측 계좌 */}
              {brideAccounts.length > 0 && (
                <div className="rounded-2xl bg-[#FAF9F6] border border-stone-200/80 overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setOpenBrideAccount(!openBrideAccount)}
                    className="w-full p-4 flex items-center justify-between text-left text-sm font-medium text-stone-900 hover:bg-stone-100/60 transition-colors cursor-pointer"
                  >
                    <span>신부측 계좌번호</span>
                    <span className="text-xs text-emerald-700 font-mono font-medium">
                      {openBrideAccount ? '접기 ▲' : '열기 ▼'}
                    </span>
                  </button>
                  {openBrideAccount && (
                    <div className="px-4 pb-4 space-y-2.5 border-t border-stone-200/60 pt-3">
                      {brideAccounts.map((acc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
                          <div>
                            <span className="text-stone-900 font-medium block">
                              {acc.bank} {acc.number || acc.account_number}
                            </span>
                            <span className="text-stone-500 text-[11px] mt-0.5 block">
                              예금주: {acc.holder || acc.name || ''}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(acc.number || acc.account_number, `${acc.bank} 계좌`)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-lg text-[11px] transition-colors shrink-0"
                          >
                            복사
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
          07. RSVP & GUESTBOOK (참석 여부 & 방명록)
          ======================================================== */}
      {/* 06-2. 하객 현장 사진 선물 섹션 */}
      <GuestPhotoSnapSection invitation={invitation} />

      {(showRsvpSection || showGuestbookSection) && (
        <section className="py-16 px-6 bg-[#FAF9F6] border-t border-stone-200/60 text-center">
          <ScrollReveal>
            <span className="font-mono text-[11px] tracking-[0.25em] text-emerald-700 uppercase block mb-2 font-semibold">
              RSVP &middot; GUESTBOOK
            </span>
            <h2 className="font-serif text-2xl text-stone-900 font-normal mb-3">
              참석 의사 & 축하 메시지
            </h2>
            <p className="text-xs text-stone-500 font-light mb-8">
              원활한 예식 준비를 위해 참석 여부와 따뜻한 마음을 남겨주세요.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs mx-auto">
              {showRsvpSection && (
                <button
                  onClick={() => setShowRsvpModal(true)}
                  className="w-full py-3 px-5 rounded-2xl bg-stone-900 hover:bg-black text-white font-medium text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  참석 의사 전달하기
                </button>
              )}
              {showGuestbookSection && (
                <button
                  onClick={() => setShowGuestbookModal(true)}
                  className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-medium text-xs border border-stone-200/80 transition-transform active:scale-95 cursor-pointer shadow-2xs"
                >
                  축하 방명록 남기기
                </button>
              )}
            </div>

            {/* 방명록 카드 슬라이더 */}
            {showGuestbookSection && guestbookList.length > 0 && (
              <div className="mt-10 max-w-sm mx-auto">
                <div className="p-5 rounded-2xl bg-white border border-stone-200/80 text-left relative shadow-2xs">
                  <p className="text-xs text-stone-700 leading-relaxed font-light whitespace-pre-line mb-3">
                    &ldquo;{guestbookList[guestbookIndex]?.content || guestbookList[guestbookIndex]?.message}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-mono font-medium">
                    <span>— {guestbookList[guestbookIndex]?.author || guestbookList[guestbookIndex]?.name}</span>
                    <button
                      onClick={() => setDeleteTargetMsg(guestbookList[guestbookIndex])}
                      className="text-stone-400 hover:text-rose-600 transition-colors text-[10px]"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {guestbookList.length > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-4 text-xs font-mono text-stone-500">
                    <button
                      onClick={() => setGuestbookIndex((prev) => (prev > 0 ? prev - 1 : guestbookList.length - 1))}
                      className="px-2 py-1 hover:text-stone-900"
                    >
                      ◀ PREV
                    </button>
                    <span>{guestbookIndex + 1} / {guestbookList.length}</span>
                    <button
                      onClick={() => setGuestbookIndex((prev) => (prev < guestbookList.length - 1 ? prev + 1 : 0))}
                      className="px-2 py-1 hover:text-stone-900"
                    >
                      NEXT ▶
                    </button>
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        </section>
      )}

      {/* ========================================================
          08. ✨ OUTRO: WARM CHAMPAGNE FINALE & CELEBRATION CONFETTI
              (화사하고 따뜻한 샴페인 피날레 & 축하 꽃가루)
          ======================================================== */}
      <section className="relative py-20 px-6 bg-linear-to-b from-[#FAF7F2] via-[#F5EFE6] to-[#ECE4D8] text-center overflow-hidden text-stone-800 border-t border-stone-200/60">
        <ScrollReveal>
          {/* 상단 무드 뱃지 */}
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.28em] text-emerald-850 uppercase font-semibold px-3 py-1 bg-white/70 backdrop-blur-md rounded-full shadow-2xs mb-3">
            BONUS TRACK &middot; FOREVER
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-tight mb-2">
            {coupleNamesEn}
          </h2>
          <p className="text-xs text-stone-600 font-light max-w-xs mx-auto leading-relaxed mb-8">
            저희의 새로운 멜로디에 함께해 주신 모든 분들께<br />
            마음 깊이 진심으로 감사드립니다.
          </p>

          {/* 따뜻한 감성 엔딩 사진 프레임 */}
          {endingImage && (
            <div className="w-full max-w-[280px] aspect-3/4 mx-auto rounded-3xl overflow-hidden border-4 border-white shadow-[0_20px_45px_rgba(40,55,45,0.12)] relative mb-8 group bg-white">
              <img
                src={endingImage}
                alt="Bonus Track Moment"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
              />
              {/* 햇살 라이트 오버레이 */}
              <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-0 right-0 text-white font-serif italic text-xs drop-shadow-md">
                Forever and Always
              </div>
            </div>
          )}

          <p className="font-mono text-[10px] tracking-widest text-stone-400 uppercase">
            &copy; {year} {coupleNamesEn}. ALL RIGHTS RESERVED.
          </p>
          <p className="font-mono text-[9px] tracking-widest text-stone-400/80 uppercase mt-1 select-none">
            Designed by ATELIER DE MUKIRU
          </p>
        </ScrollReveal>
      </section>

      {/* 모달 연동 (상태가 true일 때만 조건부 렌더링) */}
      {showContactModal && (
        <EditorialContactModal
          onClose={() => setShowContactModal(false)}
          invitation={invitation}
        />
      )}
      {showRsvpModal && (
        <EditorialRsvpModal
          onClose={() => setShowRsvpModal(false)}
          invitationId={invitation?.id}
        />
      )}
      {showGuestbookModal && (
        <EditorialGuestbookModal
          onClose={() => {
            setShowGuestbookModal(false);
            if (invitation?.id) {
              supabase
                .from('guestbook')
                .select('*')
                .eq('invitation_id', invitation.id)
                .order('created_at', { ascending: false })
                .then(({ data }) => { if (data) setGuestbookList(data); });
            }
          }}
          invitationId={invitation?.id}
          onSuccess={(newMsg) => setGuestbookList((prev) => [newMsg, ...prev])}
        />
      )}
      {deleteTargetMsg && (
        <EditorialGuestbookDeleteModal
          onClose={() => setDeleteTargetMsg(null)}
          targetMsg={deleteTargetMsg}
          onDeleteSuccess={(id) => {
            setGuestbookList((prev) => prev.filter((i) => i.id !== id));
            setDeleteTargetMsg(null);
          }}
        />
      )}
      {galleryModalOpen && (
        <EditorialGalleryModal
          onClose={() => setGalleryModalOpen(false)}
          images={galleryImages}
          initialIndex={galleryModalIndex}
        />
      )}
    </div>
  );
}
