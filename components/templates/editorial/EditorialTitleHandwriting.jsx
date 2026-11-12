'use client';

import { useState, useEffect, useId } from 'react';

/**
 * [방안 B] 실제 필기체 획순(Single-Stroke) 궤적 데이터
 * - 폰트: 피그마 원본 'Weddingday Personal Use' 폰트 100% 동일 유지
 * - 기법: Weddingday 폰트 위에 실제 사람의 펜 획순 궤적(Stroke Mask)을 씌워,
 *        기존의 우아한 폰트 모양 그대로 사람이 한 획 한 획 써내려가듯 드러나는 하이브리드 획순 엔진
 */
const HANDWRITING_STROKES = [
  // === We ===
  { id: 'W1', d: 'M 8 16 C 6 10, 12 7, 16 10 C 20 13, 17 28, 20 34', dur: 0.32 },
  { id: 'W2', d: 'M 20 34 C 23 39, 26 21, 29 15 C 32 21, 33 34, 37 34', dur: 0.35 },
  { id: 'W3', d: 'M 37 34 C 40 34, 43 21, 45 15 C 46 13, 48 14, 47 19', dur: 0.22 },
  { id: 'e1', d: 'M 47 19 C 48 24, 52 26, 54 23 C 56 19, 53 16, 49 17 C 44 19, 45 28, 51 29', dur: 0.28 },

  // === are ===
  { id: 'a1_loop', d: 'M 71 21 C 67 17, 60 18, 60 23 C 60 28, 66 30, 71 26', dur: 0.24 },
  { id: 'a1_stem', d: 'M 71 18 L 71 27 C 71 30, 73 30, 75 28', dur: 0.18 },
  { id: 'r1', d: 'M 75 28 C 76 25, 77 19, 80 19 C 82 19, 82 23, 83 28', dur: 0.22 },
  { id: 'e2', d: 'M 83 28 C 84 24, 88 18, 91 19 C 93 21, 92 26, 87 27 C 90 29, 94 28, 96 25', dur: 0.26 },

  // === getting ===
  { id: 'g1_loop', d: 'M 116 21 C 112 17, 105 18, 105 23 C 105 28, 111 30, 116 26', dur: 0.24 },
  { id: 'g1_tail', d: 'M 116 18 L 116 37 C 116 44, 106 45, 102 39 C 100 35, 106 31, 118 26', dur: 0.38 },
  { id: 'e3', d: 'M 118 26 C 120 23, 124 18, 127 20 C 129 22, 127 26, 122 27 C 125 29, 129 28, 131 25', dur: 0.24 },
  { id: 't1_stem', d: 'M 134 12 L 134 27 C 134 29, 136 30, 138 28', dur: 0.18 },
  { id: 't2_stem', d: 'M 142 12 L 142 27 C 142 29, 144 30, 146 28', dur: 0.18 },
  { id: 'tt_bar', d: 'M 129 18 L 148 18', dur: 0.16 },
  { id: 'i1_stem', d: 'M 149 19 L 149 27 C 149 29, 151 30, 154 28', dur: 0.16 },
  { id: 'i1_dot', d: 'M 149 12 L 149.5 12.5', dur: 0.08 },
  { id: 'n1', d: 'M 154 28 L 154 19 C 156 17, 160 17, 161 22 L 161 28 C 163 17, 167 17, 169 22 L 169 28 C 170 30, 173 29, 175 27', dur: 0.36 },
  { id: 'g2_loop', d: 'M 183 21 C 179 17, 173 18, 173 23 C 173 28, 178 30, 183 26', dur: 0.24 },
  { id: 'g2_tail', d: 'M 183 18 L 183 37 C 183 44, 174 45, 170 39 C 168 35, 174 31, 185 26', dur: 0.38 },

  // === married ===
  { id: 'm1', d: 'M 191 28 L 191 19 C 193 17, 196 17, 198 22 L 198 28 C 200 17, 204 17, 206 22 L 206 28 C 208 17, 212 17, 214 22 L 214 28 C 215 30, 218 29, 220 27', dur: 0.44 },
  { id: 'a2_loop', d: 'M 226 21 C 222 17, 215 18, 215 23 C 215 28, 221 30, 226 26', dur: 0.24 },
  { id: 'a2_stem', d: 'M 226 18 L 226 27 C 226 30, 228 30, 230 28', dur: 0.18 },
  { id: 'r2', d: 'M 230 28 C 231 25, 233 19, 236 19 C 238 19, 238 23, 239 28', dur: 0.2 },
  { id: 'r3', d: 'M 239 28 C 240 25, 242 19, 245 19 C 247 19, 247 23, 248 28', dur: 0.2 },
  { id: 'i2_stem', d: 'M 251 19 L 251 27 C 251 29, 253 30, 256 28', dur: 0.16 },
  { id: 'i2_dot', d: 'M 251 12 L 251.5 12.5', dur: 0.08 },
  { id: 'e4', d: 'M 256 28 C 257 24, 261 18, 264 19 C 266 21, 265 26, 260 27 C 263 29, 267 28, 269 25', dur: 0.24 },
  { id: 'd1_loop', d: 'M 276 21 C 272 17, 265 18, 265 23 C 265 28, 271 30, 276 26', dur: 0.24 },
  { id: 'd1_stem', d: 'M 276 8 L 276 27 C 276 30, 279 30, 283 27', dur: 0.26 },
];

export default function EditorialTitleHandwriting({
  text = 'We are getting married',
  startDelay = 250,
  className = '',
}) {
  const maskId = useId().replace(/:/g, '');

  // 모드: 'stroke' (방안 B: Weddingday 폰트 + 리얼 획순) | 'wipe' (방안 A: Weddingday 폰트 + 마스크 와이프) | 'typewriter' (기존: 타자기)
  const [activeMode, setActiveMode] = useState('stroke');
  const [playCount, setPlayCount] = useState(0);

  // 방안 B: 활성화된 획순 인덱스
  const [activeStrokeIdx, setActiveStrokeIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // 방안 A: 와이프 진행률 (0 -> 100)
  const [wipeProgress, setWipeProgress] = useState(0);

  // 기존: 타자기 글자 카운터
  const [typeCount, setTypeCount] = useState(0);

  useEffect(() => {
    const timers = [];

    // 안전한 비동기 초기화 및 애니메이션 킥오프
    const initTimer = setTimeout(() => {
      setActiveStrokeIdx(0);
      setWipeProgress(0);
      setTypeCount(0);
      setIsFinished(false);

      if (activeMode === 'stroke') {
        let accumulatedTime = startDelay;
        HANDWRITING_STROKES.forEach((stroke, i) => {
          accumulatedTime += (stroke.dur * 1000) * 0.75;
          const t = setTimeout(() => {
            setActiveStrokeIdx(i + 1);
          }, accumulatedTime);
          timers.push(t);
        });

        const finishTimer = setTimeout(() => {
          setIsFinished(true);
        }, accumulatedTime + 180);
        timers.push(finishTimer);
      } else if (activeMode === 'wipe') {
        const wipeTimer = setTimeout(() => {
          setWipeProgress(100);
        }, startDelay);
        timers.push(wipeTimer);

        const finishTimer = setTimeout(() => {
          setIsFinished(true);
        }, startDelay + 2000);
        timers.push(finishTimer);
      } else if (activeMode === 'typewriter') {
        const keystrokes = [70, 50, 240, 65, 45, 55, 250, 65, 50, 40, 40, 55, 45, 60, 280, 70, 55, 40, 40, 50, 45, 60];
        let acc = startDelay;
        text.split('').forEach((_, idx) => {
          acc += keystrokes[idx] ?? 50;
          const t = setTimeout(() => {
            setTypeCount(idx + 1);
          }, acc);
          timers.push(t);
        });
        const finishTimer = setTimeout(() => {
          setIsFinished(true);
        }, acc + 100);
        timers.push(finishTimer);
      }
    }, 15);

    timers.push(initTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [activeMode, playCount, startDelay, text]);

  const handleReplay = (e) => {
    e.stopPropagation();
    setPlayCount((prev) => prev + 1);
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      
      {/* ========================================================
          상단 비교 컨트롤 바 (방안 B vs 방안 A vs 기존 타자기)
          ======================================================== */}
      <div 
        className="mb-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 shadow-xl z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            setActiveMode('stroke');
            setPlayCount((c) => c + 1);
          }}
          className={`px-3 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer ${
            activeMode === 'stroke'
              ? 'bg-amber-400 text-stone-950 font-bold shadow-md scale-105'
              : 'text-stone-300 hover:text-white font-medium'
          }`}
        >
          ✍️ 방안 B (원래 폰트 + 획순)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('wipe');
            setPlayCount((c) => c + 1);
          }}
          className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer ${
            activeMode === 'wipe'
              ? 'bg-white text-stone-950 font-bold shadow-md scale-105'
              : 'text-stone-300 hover:text-white font-medium'
          }`}
        >
          🌊 방안 A (와이프)
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('typewriter');
            setPlayCount((c) => c + 1);
          }}
          className={`px-2 py-1 rounded-full text-[10.5px] font-sans transition-all cursor-pointer ${
            activeMode === 'typewriter'
              ? 'bg-stone-200 text-stone-900 font-bold shadow-xs'
              : 'text-stone-400 hover:text-stone-200 font-normal'
          }`}
        >
          기존 (타자기)
        </button>

        {/* ↺ 다시 보기 버튼 */}
        <button
          type="button"
          onClick={handleReplay}
          title="다시 재생"
          className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white text-[12px] transition-all cursor-pointer active:scale-90"
        >
          ↺
        </button>
      </div>

      {/* ========================================================
          본체: 폰트는 무조건 피그마 실측 'Weddingday Personal Use' 100% 동일!
          ======================================================== */}
      <div className="relative w-[320px] max-w-[92vw] h-[52px] flex items-center justify-center">

        {/* ----------------------------------------------------
            [MODE 1: 방안 B - 원래 Weddingday 폰트 + 리얼 획순 마스크 드로잉]
            - 폰트 모양: Weddingday 원본 100% 그대로 (두께감/세리프 완벽 유지)
            - 렌더링: 사람이 펜으로 굴려 쓰듯 각 획이 순서대로 드러남
            ---------------------------------------------------- */}
        {activeMode === 'stroke' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg
              viewBox="0 0 310 48"
              className="w-full h-full overflow-visible drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
            >
              <defs>
                <mask id={`mask-${maskId}`} maskUnits="userSpaceOnUse" x="0" y="0" width="310" height="48">
                  {/* 기본 바탕: 검정색 (가림) */}
                  <rect x="0" y="0" width="310" height="48" fill="black" />

                  {/* 애니메이션 완성 후 미세한 세리프 끝자락까지 100% 영구 개방 */}
                  {isFinished && (
                    <rect x="0" y="0" width="310" height="48" fill="white" />
                  )}

                  {/* 획순에 따라 순서대로 그려지는 굵은 붓(마스크) */}
                  {HANDWRITING_STROKES.map((stroke, idx) => {
                    const isVisible = idx < activeStrokeIdx;

                    return (
                      <path
                        key={stroke.id}
                        d={stroke.d}
                        pathLength="100"
                        stroke="white"
                        strokeWidth="15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        style={{
                          strokeDasharray: 100,
                          strokeDashoffset: isVisible ? 0 : 100,
                          transition: `stroke-dashoffset ${stroke.dur * 0.75}s cubic-bezier(0.25, 0.1, 0.25, 1)`,
                          opacity: isVisible ? 1 : 0,
                        }}
                      />
                    );
                  })}
                </mask>
              </defs>

              {/* 피그마 실측 'Weddingday Personal Use' 폰트 텍스트 (마스크를 통해 획순대로 잉크가 채워짐!) */}
              <text
                x="155"
                y="31"
                textAnchor="middle"
                className="font-weddingday text-[40px] fill-[#F3F3F3] select-none tracking-normal"
                style={{
                  fontFamily: "'Weddingday Personal Use', cursive",
                  letterSpacing: '0.01em',
                }}
                mask={`url(#mask-${maskId})`}
              >
                {text}
              </text>
            </svg>
          </div>
        )}

        {/* ----------------------------------------------------
            [MODE 2: 방안 A - 마스크 스무스 와이프]
            - Weddingday 원본 폰트 위에서 좌 ➔ 우로 부드럽게 채워짐
            ---------------------------------------------------- */}
        {activeMode === 'wipe' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <h1
              className="font-weddingday text-[40px] text-[#F3F3F3] leading-[70%] text-center whitespace-nowrap drop-shadow-md transition-all duration-[2000ms] ease-out select-none"
              style={{
                fontFamily: "'Weddingday Personal Use', cursive",
                WebkitMaskImage: `linear-gradient(90deg, #000 0%, #000 ${wipeProgress}%, transparent ${Math.min(100, wipeProgress + 18)}%)`,
                maskImage: `linear-gradient(90deg, #000 0%, #000 ${wipeProgress}%, transparent ${Math.min(100, wipeProgress + 18)}%)`,
              }}
            >
              {text}
            </h1>
          </div>
        )}

        {/* ----------------------------------------------------
            [MODE 3: 기존 - 타자기 키스트로크]
            - 한 글자씩 딱딱 끊기며 찍히는 타자기 모드
            ---------------------------------------------------- */}
        {activeMode === 'typewriter' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <h1 
              className="font-weddingday text-[40px] text-[#F3F3F3] leading-[70%] text-center whitespace-nowrap drop-shadow-md select-none"
              style={{ fontFamily: "'Weddingday Personal Use', cursive" }}
            >
              {text.slice(0, typeCount)}
              {!isFinished && <span className="inline-block w-[2px] h-[24px] bg-white ml-0.5 align-middle animate-pulse" />}
            </h1>
          </div>
        )}

      </div>
    </div>
  );
}
