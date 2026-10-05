'use client';

import { useState, useRef } from 'react';

export default function BgmPlayer({ bgmUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  if (!bgmUrl) return null;

  const handleStart = () => {
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
      <audio ref={audioRef} src={bgmUrl} loop preload="auto" />

      {!hasInteracted && (
        <div
          onClick={handleStart}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/90 text-white backdrop-blur-sm cursor-pointer p-6 select-none transition-opacity duration-500"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-white/10 text-2xl shadow-md animate-pulse">
              💌
            </div>
            <p className="text-xs tracking-widest text-stone-300 font-light">
              WEDDING INVITATION
            </p>
            <p className="text-base font-serif mt-1">
              화면을 터치하여 초대장을 열어보세요
            </p>
            <span className="text-xs text-stone-400 mt-2">
              🎵 배경음악과 함께 재생됩니다
            </span>
          </div>
        </div>
      )}

      {hasInteracted && (
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? '배경음악 일시정지' : '배경음악 재생'}
          className="fixed top-4 right-4 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow border border-stone-200 text-stone-700 active:scale-95 transition-all"
        >
          {isPlaying ? (
            <span className="inline-block animate-spin text-sm" style={{ animationDuration: '4s' }}>
              🎵
            </span>
          ) : (
            <span className="text-stone-400 text-xs font-bold line-through">
              🎵
            </span>
          )}
        </button>
      )}
    </>
  );
}