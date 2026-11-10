'use client';

import { useState, useEffect } from 'react';

/**
 * 시안 1(Basic) 메인 풀스크린 커버 전용 시네마틱 타이틀 타이프라이터
 * - 시안 2 인트로처럼 리드미컬하고 선명하게 찍히는 실제 타건 애니메이션
 * - 타이핑 진행 중에만 슬림한 커서가 글자 선두를 따라가며 입력
 * - 마지막 글자 완성 즉시 커서가 깜빡이지 않고 깔끔하게 사라짐
 * - 봉투 인트로 오픈 시점에 맞춰 자연스럽게 타이핑 시작
 */
export default function BasicTitleTypewriter({
  text = 'We are getting married',
  startDelay = 350,
  isTriggered = true,
  titleColor = '#ffbe68',
  className = '',
}) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (!isTriggered) return;

    // 모션 최소화(접근성) 설정 시 즉시 전체 표시
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedCount(text.length);
      setShowCursor(false);
      return;
    }

    setShowCursor(true);

    // 영화 인트로 특유의 "타탁... 타다타탁..." 실제 타건 리듬
    const keystrokeIntervals = [
      // W, e -> "타탁!"
      70, 50,
      // space -> 호흡
      220,
      // a, r, e -> "타다탁!"
      65, 45, 55,
      // space -> 호흡
      230,
      // g, e, t, t, i, n, g -> "타다다다다닥!" (tt 연타)
      65, 50, 38, 38, 55, 45, 60,
      // space -> 호흡
      250,
      // m, a, r, r, i, e, d -> "타다다다다닥!" (rr 연타)
      70, 55, 38, 38, 50, 45, 60,
    ];

    const timeouts = [];
    let accumulatedDelay = startDelay;

    text.split('').forEach((_, index) => {
      const interval = keystrokeIntervals[index] ?? 50;
      accumulatedDelay += interval;

      const t = setTimeout(() => {
        setDisplayedCount(index + 1);
      }, accumulatedDelay);

      timeouts.push(t);
    });

    // 타이핑 완료 즉시 커서 제거 (끝났을 때 깜빡이지 않고 깔끔하게 사라짐)
    const endTimer = setTimeout(() => {
      setShowCursor(false);
    }, accumulatedDelay + 50);

    timeouts.push(endTimer);

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [text, startDelay, isTriggered]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <h1
        className={`font-bodoni italic font-normal text-[36px] sm:text-[40px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] tracking-normal ${className}`}
        style={{ color: titleColor }}
        aria-label={text}
      >
        {/* 시작 전 커서 (타이핑 직전 대기) */}
        {displayedCount === 0 && showCursor && (
          <span
            className="basic-caret mr-0.5"
            style={{
              backgroundColor: titleColor,
              boxShadow: `0 0 6px ${titleColor}`,
            }}
          />
        )}

        {text.split('').map((char, idx) => {
          const isVisible = idx < displayedCount;
          const isCurrentTip = idx === displayedCount - 1;

          return (
            <span key={idx} className="relative inline">
              <span className={isVisible ? 'opacity-100' : 'opacity-0'}>
                {char === ' ' ? '\u00A0' : char}
              </span>

              {/* 현재 타이핑되고 있는 글자 바로 뒤에 붙는 커서 (완료 시 즉시 사라짐) */}
              {isCurrentTip && showCursor && displayedCount < text.length && (
                <span
                  className="basic-caret"
                  style={{
                    backgroundColor: titleColor,
                    boxShadow: `0 0 6px ${titleColor}`,
                  }}
                />
              )}
            </span>
          );
        })}
      </h1>

      <style jsx>{`
        .basic-caret {
          display: inline-block;
          vertical-align: middle;
          width: 2px;
          height: 30px;
          margin-left: 2px;
          margin-right: -4px;
        }
      `}</style>
    </div>
  );
}
