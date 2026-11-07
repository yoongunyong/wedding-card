'use client';

import { useState, useEffect } from 'react';

/**
 * 영화 인트로 / 레트로 컴퓨터 문서 스타일의 시네마틱 키스트로크 타이핑
 * - 영화 속 타자기처럼 "타탁... 타다탁... 타다다닥" 빠르고 불규칙한 타건감
 * - 글자가 칼같이 즉시 찍히는 선명한 즉발성(Instant Reveal)
 * - 타이핑 선두를 따라 달리는 시네마틱 깜빡임 커서 (Blinking Caret)
 * - 완성 후 2~3회 깜빡이다 자연스럽게 사라지는 영화적 마무리
 */
export default function EditorialTitleTypewriter({
  text = 'We are getting married',
  startDelay = 350,
  className = '',
}) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [cursorFading, setCursorFading] = useState(false);

  useEffect(() => {
    // 1. 모션 최소화(접근성) 설정 시 즉시 전체 표시
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const immediate = setTimeout(() => {
        setDisplayedCount(text.length);
        setShowCursor(false);
      }, 0);
      return () => clearTimeout(immediate);
    }

    // 2. 영화/다큐멘터리 인트로 특유의 "타탁... 타다타탁..." 실제 타건 리듬
    // - 단어 내 빠른 연타(40~65ms), 연타 쌍자음(tt, rr: 40ms), 단어 사이 생각/호흡 멈춤(240~280ms)
    const keystrokeIntervals = [
      // W, e -> "타탁!"
      70, 50,
      // space -> 호흡
      240,
      // a, r, e -> "타다탁!"
      65, 45, 55,
      // space -> 호흡
      250,
      // g, e, t, t, i, n, g -> "타다다다다닥!" (tt 연타)
      65, 50, 40, 40, 55, 45, 60,
      // space -> 호흡
      280,
      // m, a, r, r, i, e, d -> "타다다다다닥!" (rr 연타)
      70, 55, 40, 40, 50, 45, 60,
    ];

    const timeouts = [];
    let accumulatedDelay = startDelay;

    text.split('').forEach((_, index) => {
      const interval = keystrokeIntervals[index] ?? 55;
      accumulatedDelay += interval;

      const t = setTimeout(() => {
        setDisplayedCount(index + 1);
      }, accumulatedDelay);

      timeouts.push(t);
    });

    // 3. 타이핑 완료 후 약 1.6초 동안 커서가 2~3회 깜빡인 뒤 부드럽게 퇴장
    const fadeTimer = setTimeout(() => {
      setCursorFading(true);
      const hideTimer = setTimeout(() => {
        setShowCursor(false);
      }, 500);
      timeouts.push(hideTimer);
    }, accumulatedDelay + 1600);

    timeouts.push(fadeTimer);

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [text, startDelay]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <h1
        className={`font-weddingday text-[40px] text-[#F3F3F3] leading-[70%] text-center select-none tracking-normal drop-shadow-md whitespace-nowrap ${className}`}
        aria-label={text}
      >
        {/* 시작 전 깜빡이는 커서 (타이핑 시작 대기) */}
        {displayedCount === 0 && showCursor && (
          <span className="cinema-caret mr-0.5" />
        )}

        {text.split('').map((char, idx) => {
          const isVisible = idx < displayedCount;
          const isCurrentTip = idx === displayedCount - 1;

          return (
            <span key={idx} className="relative inline">
              <span className={isVisible ? 'opacity-100' : 'opacity-0'}>
                {char === ' ' ? '\u00A0' : char}
              </span>

              {/* 현재 타이핑되고 있는 글자 바로 뒤에 붙는 영화 커서 */}
              {isCurrentTip && showCursor && (
                <span
                  className={`cinema-caret ${
                    cursorFading ? 'opacity-0 transition-opacity duration-500' : ''
                  }`}
                />
              )}
            </span>
          );
        })}
      </h1>

      <style jsx>{`
        .cinema-caret {
          display: inline-block;
          vertical-align: middle;
          width: 2px;
          height: 26px;
          background-color: #f3f3f3;
          margin-left: 2px;
          margin-right: -4px;
          box-shadow: 0 0 6px rgba(243, 243, 243, 0.85);
          animation: cinemaBlink 0.65s step-start infinite;
        }

        @keyframes cinemaBlink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
