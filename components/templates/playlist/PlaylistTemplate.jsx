'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
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
  const [trackProgress, setTrackProgress] = useState(35);
  const [isLiked, setIsLiked] = useState(true);
  const [heartAnim, setHeartAnim] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState('0:48');
  const [audioTotalDuration, setAudioTotalDuration] = useState('3:15');


  // 4. ✨ 축하 꽃잎/컨페티 팡팡 인터랙션 상태
  const [celebrateCount, setCelebrateCount] = useState(128); // 기본 축하 수
  const [confettiParticles, setConfettiParticles] = useState([]);

  // 5. 계좌 아코디언 토글
  const [openGroomAccount, setOpenGroomAccount] = useState(true);
  const [openBrideAccount, setOpenBrideAccount] = useState(true);

  // 6. 방명록 상태
  const [guestbookList, setGuestbookList] = useState([]);
  const [guestbookIndex, setGuestbookIndex] = useState(0);

  // 7. 갤러리 메인 뷰어 인덱스
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  // 8. 데이터 언패킹 & fallback
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
  const mainImage = images.main || images.cover || invitation?.main_image || '/cover.jpg';
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

  // 성함 데이터
  const groomName = invitation?.groom_name || '신랑';
  const brideName = invitation?.bride_name || '신부';
  const groomFirstEn = invitation?.groom_first_name_en || (invitation?.groom_name_en || '').split(' ')[0] || 'Groom';
  const brideFirstEn = invitation?.bride_first_name_en || (invitation?.bride_name_en || '').split(' ')[0] || 'Bride';
  const coupleNamesEn = invitation?.main_names_en || `${groomFirstEn} & ${brideFirstEn}`;

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

  // 전역 오디오 상태 동기화 및 제어
  useEffect(() => {
    const handleAudioSync = () => {
      const audioEl = document.querySelector('audio');
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

    const interval = setInterval(handleAudioSync, 500);
    return () => clearInterval(interval);
  }, []);

  const togglePlayAudio = () => {
    const audioEl = document.querySelector('audio');
    if (audioEl) {
      if (audioEl.paused) {
        audioEl.play().catch(() => {});
        setIsPlaying(true);
      } else {
        audioEl.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
  };

  // 축하하기 클릭 시 화사한 꽃가루/하트 팡팡 인터랙션
  const handleCelebrate = () => {
    setCelebrateCount((prev) => prev + 1);

    // 24개의 랜덤 파티클 생성
    const items = ['🌸', '✨', '💖', '🎉', '🥂', '💐', '🤍'];
    const newParticles = Array.from({ length: 24 }).map((_, i) => ({
      id: Date.now() + i,
      char: items[Math.floor(Math.random() * items.length)],
      left: Math.random() * 85 + 5, // 5% ~ 90%
      animDelay: Math.random() * 0.3,
      animDuration: 1.5 + Math.random() * 1.0,
      scale: 0.8 + Math.random() * 0.8,
    }));

    setConfettiParticles((prev) => [...prev, ...newParticles]);

    // 2.5초 후 파티클 정리
    setTimeout(() => {
      setConfettiParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 2500);
  };

  // 방명록 로드
  useEffect(() => {
    if (!invitation?.slug) return;
    async function loadGuestbook() {
      const { data } = await supabase
        .from('guestbook')
        .select('*')
        .eq('slug', invitation.slug)
        .order('created_at', { ascending: false });
      if (data) setGuestbookList(data);
    }
    loadGuestbook();
  }, [invitation?.slug]);

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
      
      {/* 화면 전체를 수놓는 축하 꽃가루 파티클 컨테이너 */}
      {confettiParticles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className="absolute text-xl animate-[floatUp_2s_ease-out_forwards]"
              style={{
                left: `${p.left}%`,
                bottom: '15%',
                animationDelay: `${p.animDelay}s`,
                animationDuration: `${p.animDuration}s`,
                transform: `scale(${p.scale})`,
              }}
            >
              {p.char}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          01. HERO SECTION: CINEMATIC FULL ALBUM JACKET & MUSIC BAR
              (시원한 3:4 풀 프레임 웨딩 화보 + 플로팅 글래스 플레이어)
          ======================================================== */}
      <section className="relative px-5 pt-8 pb-10 bg-linear-to-b from-[#F4F1EA] via-[#FBF9F5] to-[#FBF9F5]">
        
        {/* 상단 무드 헤더 */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/80 backdrop-blur-md rounded-full border border-stone-200/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-stone-600 uppercase font-semibold">
              OUR WEDDING SOUNDTRACK
            </span>
          </div>
          <h2 className="font-serif text-xs tracking-widest text-stone-500 uppercase mt-2">
            {dayEn}, {date} {monthEn}, {year}
          </h2>
        </div>

        {/* 메인 풀 프레임 웨딩 화보 (비율 손실 0%, 원본 비율 그대로 시원하게 노출) */}
        <div className="relative w-full aspect-3/4 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-stone-200/70 bg-stone-100 group">
          <img
            src={mainImage}
            alt="Main Wedding Album"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-103"
          />

          {/* 상단 은은한 섀도우 그라데이션 */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

          {/* 화보 위 감성 영문 레터링 */}
          <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-white/90 drop-shadow-md">
            <span className="font-serif italic text-xs tracking-wider">
              A Moment of Love
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
              SIDE A &middot; 33 RPM
            </span>
          </div>

          {/* 화보 중앙 하단 타이포그래피 */}
          <div className="absolute bottom-20 left-5 right-5 text-white drop-shadow-lg text-center">
            <p className="font-serif italic text-sm tracking-wide text-white/90 mb-1">
              we are getting married
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight">
              {groomName} &middot; {brideName}
            </h1>
          </div>

          {/* 하단 플로팅 글래스모피즘 뮤직 플레이어 바 (화보 하단에 세련되게 얹힘) */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center gap-3">
              
              {/* 회전하는 미니 바이닐 디스크 썸네일 (터치 시 재생/일시정지 토글) */}
              <div 
                onClick={togglePlayAudio}
                className={`relative w-11 h-11 rounded-full bg-[#181818] shadow-md border-2 border-stone-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
                  isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''
                }`}
                title="LP판을 터치하여 음악 재생/정지"
              >
                {/* LP 라벨 */}
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-800 border border-white/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              {/* 트랙 정보 & 음파 이퀄라이저 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-serif text-xs font-semibold text-stone-900 truncate tracking-tight">
                    {invitation?.quote_source ? invitation.quote_source : 'This is our song'}
                  </h4>
                  {/* 4밴드 음파 이퀄라이저 */}
                  <div className="flex items-end gap-[2px] h-3 ml-2 shrink-0">
                    <span className={`w-[2px] bg-emerald-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} />
                    <span className={`w-[2px] bg-emerald-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-2 animate-bounce' : 'h-1.5'}`} />
                    <span className={`w-[2px] bg-emerald-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} />
                    <span className={`w-[2px] bg-emerald-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-2.5 animate-bounce' : 'h-1.5'}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span className="truncate">{coupleNamesEn}</span>
                  <span>{audioCurrentTime} / {audioTotalDuration}</span>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                    style={{ width: `${trackProgress}%` }}
                  />
                </div>
              </div>

              {/* 플레이/일시정지 버튼 & 하트 */}
              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                <button
                  onClick={handleHeartClick}
                  className={`p-1.5 transition-transform duration-300 cursor-pointer ${heartAnim ? 'scale-125' : 'scale-100 hover:scale-110'}`}
                  aria-label="좋아요"
                >
                  <svg
                    className={`w-4 h-4 transition-colors ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-stone-300'}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill={isLiked ? 'currentColor' : 'none'}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                <button
                  onClick={togglePlayAudio}
                  className="w-8 h-8 rounded-full bg-stone-900 hover:bg-black text-white flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer"
                  aria-label={isPlaying ? '일시정지' : '재생'}
                >
                  {isPlaying ? (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>

            </div>
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

            {/* 모시는 글 본문 */}
            <p className="text-xs sm:text-[13px] text-stone-600 leading-loose font-light whitespace-pre-line break-keep">
              {invitation?.message ||
                `서로를 만나 평범했던 하루가\n조금 더 따뜻하고 특별해졌습니다.\n\n우리가 함께 듣던 멜로디처럼\n잔잔하고 다정하게 서로의 곁을 지키겠습니다.\n\n새로운 계절을 시작하는 날,\n귀한 걸음으로 축복해 주시면 감사하겠습니다.`}
            </p>

            {/* 감성 커플 화보 (속지 인화 사진 프레임) */}
            {couplePhoto && (
              <div className="my-8 max-w-[280px] mx-auto aspect-3/4 rounded-2xl overflow-hidden border border-stone-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.06)] bg-stone-100">
                <img
                  src={couplePhoto}
                  alt="Couple Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 양가 혼주 & 신랑 신부 정보 (음반 크레딧 스타일) */}
            <div className="mt-10 pt-8 border-t border-stone-200/60 space-y-3 text-xs sm:text-[13px]">
              <div className="flex items-center justify-center gap-2 text-stone-700">
                <span className="text-stone-500">
                  {invitation?.groom_father && `${invitation.groom_father}${config.groom_father_deceased ? ' 故' : ''}`}
                  {invitation?.groom_father && invitation?.groom_mother && ' · '}
                  {invitation?.groom_mother && `${invitation.groom_mother}${config.groom_mother_deceased ? ' 故' : ''}`}
                </span>
                <span className="text-emerald-700 text-[11px] font-medium">의 {config.groom_relation || '장남'}</span>
                <span className="font-semibold text-stone-900 ml-1">{groomName}</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-stone-700">
                <span className="text-stone-500">
                  {invitation?.bride_father && `${invitation.bride_father}${config.bride_father_deceased ? ' 故' : ''}`}
                  {invitation?.bride_father && invitation?.bride_mother && ' · '}
                  {invitation?.bride_mother && `${invitation.bride_mother}${config.bride_mother_deceased ? ' 故' : ''}`}
                </span>
                <span className="text-emerald-700 text-[11px] font-medium">의 {config.bride_relation || '장녀'}</span>
                <span className="font-semibold text-stone-900 ml-1">{brideName}</span>
              </div>
            </div>

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
            <h2 className="font-serif text-2xl text-stone-900 font-normal">
              {invitation?.venue_name || '웨딩홀 이름'}
            </h2>
            {config?.venue_hall && (
              <p className="text-xs text-emerald-700 mt-1 font-medium">{config.venue_hall}</p>
            )}
            <p className="text-xs text-stone-600 mt-2 font-light">
              {invitation?.venue_address || '서울시 예식장 상세 주소'}
            </p>
          </div>

          {/* 카카오맵 지도 */}
          <div className="rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm mb-4">
            <KakaoMap
              address={invitation?.venue_address}
              venueName={invitation?.venue_name}
            />
          </div>

          {/* 길찾기 내비게이션 바로가기 버튼 */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(invitation?.venue_name || '')}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/80 text-xs text-center text-stone-800 font-medium transition-colors shadow-2xs"
            >
              카카오맵
            </a>
            <a
              href={`tmap://search?name=${encodeURIComponent(invitation?.venue_name || '')}`}
              className="py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/80 text-xs text-center text-stone-800 font-medium transition-colors shadow-2xs"
            >
              티맵
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
                              예금주: {acc.holder || acc.name || '신랑'}
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
                              예금주: {acc.holder || acc.name || '신부'}
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
                    &ldquo;{guestbookList[guestbookIndex]?.message}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-mono font-medium">
                    <span>— {guestbookList[guestbookIndex]?.name}</span>
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

          {/* ✨ 하객 참여형 축하 꽃가루(Confetti) 팡팡 인터랙션 버튼 */}
          <div className="mb-8">
            <button
              onClick={handleCelebrate}
              className="px-6 py-3 rounded-full bg-linear-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-medium shadow-[0_8px_24px_rgba(40,80,50,0.25)] transition-all transform active:scale-90 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>🎉</span>
              <span>두 분의 앞날을 축복합니다!</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-mono font-bold">
                +{celebrateCount}
              </span>
            </button>
            <p className="text-[11px] text-stone-500 font-light mt-2">
              버튼을 누르시면 축하 꽃가루가 피어납니다 ✨
            </p>
          </div>

          <p className="font-mono text-[10px] tracking-widest text-stone-400 uppercase">
            &copy; {year} {coupleNamesEn}. ALL RIGHTS RESERVED.
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
            if (invitation?.slug) {
              supabase
                .from('guestbook')
                .select('*')
                .eq('slug', invitation.slug)
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
          targetItem={deleteTargetMsg}
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
