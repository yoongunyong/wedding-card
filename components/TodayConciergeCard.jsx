'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * 예식 당일 안내 데스크 (Wedding Day Concierge Desk)
 * 
 * 결혼식 당일 하객이 청첩장 링크를 열었을 때,
 * "예식 시작까지 남은 시간"과 "네이버지도/카카오내비 길안내"를 최우선으로 안내하는 당일 특화 컴포넌트입니다.
 */
export default function TodayConciergeCard({ invitation, forceShow = false }) {
  // 접기/펼치기 상태 (기본 펼침)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // 1초마다 현재 시각 업데이트
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // URL 파라미터로 ?preview_today=true 테스트 지원
  const isPreviewMode = useMemo(() => {
    if (forceShow) return true;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('preview_today') === 'true' || params.get('today') === 'true';
    }
    return false;
  }, [forceShow]);

  // 예식 일시 파싱 (DB 스키마: wedding_date text 컬럼에 'YYYY-MM-DDTHH:mm:ss'로 날짜와 시간이 함께 저장됨)
  const weddingDateStr = invitation?.wedding_date;

  const targetDateTime = useMemo(() => {
    if (!weddingDateStr) return null;

    // ISO 문자열 정규화 (' ' -> 'T')
    const normalized = typeof weddingDateStr === 'string' ? weddingDateStr.replace(' ', 'T') : '';
    
    // YYYY-MM-DD 및 HH:mm 추출
    const match = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:T(\d{1,2}):(\d{2}))?/);
    if (!match) {
      const fallback = new Date(normalized);
      return isNaN(fallback.getTime()) ? null : fallback;
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-based
    const day = parseInt(match[3], 10);
    const hours = match[4] !== undefined ? parseInt(match[4], 10) : 13;
    const minutes = match[5] !== undefined ? parseInt(match[5], 10) : 0;

    // 브라우저 로컬 타임존 기준 정밀 Date 생성
    return new Date(year, month, day, hours, minutes, 0, 0);
  }, [weddingDateStr]);

  // 당일 여부 확인
  const isToday = useMemo(() => {
    if (isPreviewMode) return true; // 테스트 모드 시 무조건 활성화
    if (!targetDateTime) return false;
    return (
      targetDateTime.getFullYear() === now.getFullYear() &&
      targetDateTime.getMonth() === now.getMonth() &&
      targetDateTime.getDate() === now.getDate()
    );
  }, [targetDateTime, now, isPreviewMode]);

  // 예식 시작까지 남은 시간 계산
  const timeStatus = useMemo(() => {
    if (!targetDateTime) {
      return { status: 'before', hours: 0, minutes: 0, text: '' };
    }

    const diffMs = targetDateTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes > 0) {
      const h = Math.floor(diffMinutes / 60);
      const m = diffMinutes % 60;
      if (h > 0) {
        return { status: 'before', hours: h, minutes: m, text: `${h}시간 ${m}분 전` };
      }
      return { status: 'before', hours: 0, minutes: m, text: `${m}분 전` };
    } else if (diffMinutes >= -120) {
      // 예식 시작 후 2시간 이내: 예식 진행 중
      return { status: 'ongoing', text: '현재 예식이 진행 중입니다' };
    } else {
      // 2시간 이후: 예식 종료
      return { status: 'after', text: '예식이 성황리에 종료되었습니다' };
    }
  }, [targetDateTime, now]);

  // 식장 검색 쿼리
  const venueQuery = invitation?.venue_name || invitation?.venue_address || '웨딩홀';
  const groomName = invitation?.groom_name || '신랑';
  const brideName = invitation?.bride_name || '신부';

  // 주차/교통편 정보 추출
  const parkingInfo = useMemo(() => {
    const list = invitation?.transportation;
    if (Array.isArray(list)) {
      const found = list.find((item) => item.title?.includes('주차') || item.content?.includes('주차'));
      if (found) return found.title || found.content?.slice(0, 15);
    }
    return '주차 무료 안내';
  }, [invitation?.transportation]);

  // 당일이 아니거나 예식 일시가 설정되지 않았으면 렌더링하지 않음
  if (!isToday || !targetDateTime) return null;

  // [접힌 상태]: 화면 우측 하단 또는 상단 미니 플로팅 알약 버튼
  if (isCollapsed) {
    return (
      <aside aria-label="예식 당일 안내" className="fixed top-4 right-4 z-50 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="px-3.5 py-2 bg-gray-900/95 hover:bg-black text-white text-xs font-semibold rounded-full shadow-xl backdrop-blur-md border border-white/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>🚗 당일 안내데스크 열기</span>
        </button>
      </aside>
    );
  }

  // [펼쳐진 상태]: 상단 메인 안내 데스크 카드
  return (
    <section aria-label="예식 당일 안내 데스크" className="relative z-40 w-full px-4 pt-4 pb-2 bg-gradient-to-b from-stone-900/5 via-stone-900/0 to-transparent">
      <div className="max-w-[420px] mx-auto bg-white rounded-3xl p-5 shadow-2xl border border-stone-200/90 text-left animate-in slide-in-from-top-4 duration-300">
        {/* 상단 헤더 (TODAY WEDDING & 접기 버튼) */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-purple-700 font-bold tracking-widest uppercase">
                TODAY WEDDING
              </span>
            </div>
            <h2 className="text-sm font-serif font-bold text-gray-900">
              {groomName} ♥ {brideName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">
              당일 자동 모드
            </span>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 text-xs flex items-center justify-center transition-colors cursor-pointer"
              aria-label="안내데스크 접기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 예식 시작까지 카운트다운 박스 */}
        <div className="my-3.5 p-3.5 bg-gray-950 text-white rounded-2xl text-center shadow-inner">
          <span className="text-[10px] text-gray-400 block mb-0.5">
            {timeStatus.status === 'before' ? '예식 시작까지' : '오늘의 예식'}
          </span>
          <span className="text-lg sm:text-xl font-bold font-mono tracking-wider text-amber-300">
            {timeStatus.text}
          </span>
        </div>

        {/* 예식장 정보 */}
        {invitation?.venue_name && (
          <div className="text-xs text-stone-600 mb-3 px-1 flex items-center justify-between">
            <span className="font-semibold text-stone-900 truncate max-w-[240px]">
              📍 {invitation.venue_name}
            </span>
            <span className="text-[11px] text-stone-500 shrink-0">
              {invitation.venue_detail || ''}
            </span>
          </div>
        )}

        {/* 원클릭 내비게이션 길안내 버튼 2종 */}
        <div className="space-y-2 mb-3">
          {/* 네이버 지도 */}
          <button
            type="button"
            onClick={() => {
              window.open(`https://map.naver.com/p/search/${encodeURIComponent(venueQuery)}`, '_blank');
            }}
            className="w-full py-2.5 px-4 bg-[#03C75A] hover:bg-[#02b351] text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-white text-[#03C75A] rounded-xs font-black text-[10px] flex items-center justify-center">
                N
              </span>
              <span>Naver Map 네이버지도</span>
            </div>
            <span className="text-[10px] font-mono">길안내 ➔</span>
          </button>

          {/* 카카오내비 */}
          <button
            type="button"
            onClick={() => {
              window.open(`https://map.kakao.com/link/search/${encodeURIComponent(venueQuery)}`, '_blank');
            }}
            className="w-full py-2.5 px-4 bg-[#FEE500] hover:bg-[#ebd400] text-gray-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-900 text-[#FEE500] rounded-xs font-black text-[10px] flex items-center justify-center">
                K
              </span>
              <span>Kakao Navi 카카오내비</span>
            </div>
            <span className="text-[10px] font-mono">길안내 ➔</span>
          </button>
        </div>

        {/* 편의시설 안내 태그 & 청첩장 본문 보러가기 */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[10px] text-stone-700 font-medium">
              🅿️ {parkingInfo}
            </span>
            {invitation?.template_config?.show_guest_photos !== false && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('guest-photo-snap');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>📷</span>
                <span>사진 선물</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            className="text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>청첩장 보기</span>
            <span>↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}
