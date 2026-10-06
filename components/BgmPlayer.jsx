'use client';

import { useState, useRef } from 'react';

export default function BgmPlayer({ bgmUrl, coverImage }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  const handleStart = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    // 2. 오디오 재생 처리
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasInteracted(true);
        })
        .catch((err) => {
          console.error('오디오 자동 재생 에러:', err);
          setHasInteracted(true);
        });
    } else {
      setHasInteracted(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error(err));
    }
  };

  return (
    <>
      {bgmUrl && <audio ref={audioRef} src={bgmUrl} loop preload="auto" />}

      {/* 1. 첫 오프닝 커버 화면 */}
      {!hasInteracted && (
        <div
          onClick={handleStart}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer p-6 select-none transition-opacity duration-500 overflow-hidden"
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt="Intro Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-stone-900" />
          )}

          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

          <div className="relative z-10 flex flex-col items-center gap-4 text-center text-white">
            <div className="w-16 h-16 rounded-full border border-white/30 flex items-center justify-center bg-white/10 text-2xl shadow-lg backdrop-blur-sm animate-pulse">
              💌
            </div>
            <p className="text-xs tracking-widest text-stone-200 font-light uppercase">
              WEDDING INVITATION
            </p>
            <p className="text-base font-serif mt-1 drop-shadow">
              화면을 터치하여 초대장을 열어보세요
            </p>
            {bgmUrl && (
              <span className="text-xs text-stone-300 mt-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">
                🎵 배경음악과 함께 재생됩니다
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. 우측 상단 오디오 이퀄라이저 파동 버튼 */}
      {hasInteracted && bgmUrl && (
        <>
          <style jsx>{`
            @keyframes soundWave1 {
              0%, 100% { height: 3px; }
              50% { height: 12px; }
            }
            @keyframes soundWave2 {
              0%, 100% { height: 12px; }
              50% { height: 4px; }
            }
            @keyframes soundWave3 {
              0%, 100% { height: 6px; }
              50% { height: 15px; }
            }
            @keyframes soundWave4 {
              0%, 100% { height: 10px; }
              50% { height: 4px; }
            }
            .wave-bar-1 { animation: soundWave1 1s ease-in-out infinite; }
            .wave-bar-2 { animation: soundWave2 0.8s ease-in-out infinite 0.15s; }
            .wave-bar-3 { animation: soundWave3 1.1s ease-in-out infinite 0.3s; }
            .wave-bar-4 { animation: soundWave4 0.9s ease-in-out infinite 0.1s; }
          `}</style>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? '음악 정지' : '음악 재생'}
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)' }}
            className="fixed right-5 z-40 flex items-center justify-center w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white shadow-md active:scale-95 transition-all"
          >
            <div className="flex items-center justify-center gap-[2.5px] h-4 w-4">
              <span
                className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                  isPlaying ? 'wave-bar-1' : 'h-[3px]'
                }`}
              />
              <span
                className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                  isPlaying ? 'wave-bar-2' : 'h-[7px]'
                }`}
              />
              <span
                className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                  isPlaying ? 'wave-bar-3' : 'h-[11px]'
                }`}
              />
              <span
                className={`w-[2px] bg-white rounded-full transition-all duration-300 ${
                  isPlaying ? 'wave-bar-4' : 'h-[5px]'
                }`}
              />
            </div>
          </button>
        </>
      )}
    </>
  );
}