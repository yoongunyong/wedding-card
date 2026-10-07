'use client';

import { useState, useRef, useEffect } from 'react';

export default function BgmPlayer({ bgmUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // 첫 사용자 인터랙션(화면 클릭 또는 터치) 시 음악 자동 재생 시작
  useEffect(() => {
    if (!bgmUrl) return;

    const startAudio = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            cleanup();
          })
          .catch((err) => {
            console.log('Audio autoplay prevented:', err);
          });
      }
    };

    const cleanup = () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('touchstart', startAudio);
    };

    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('touchstart', startAudio, { once: true });

    return cleanup;
  }, [bgmUrl]);

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

  if (!bgmUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={bgmUrl} loop preload="auto" />

      {/* 우측 상단 오디오 이퀄라이저 파동 버튼 */}
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
  );
}