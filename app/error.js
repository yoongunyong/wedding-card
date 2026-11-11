'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // 런타임 오류 콘솔 로깅 (Sentry/Datadog 연동 지점)
    console.error('Unhandled Global Error:', error);
  }, [error]);

  const handleRetry = () => {
    if (reset) {
      try {
        reset();
      } catch {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col justify-between items-center px-6 py-12 select-none">
      {/* 상단 브랜드 헤더 */}
      <header className="w-full max-w-md flex justify-center items-center py-4">
        <Link 
          href="/" 
          className="font-serif tracking-[0.25em] text-[13px] text-stone-500 hover:text-stone-800 transition-colors uppercase"
        >
          ATELIER DE MUKIRU
        </Link>
      </header>

      {/* 중앙 안내 콘텐츠 */}
      <main className="w-full max-w-md flex flex-col items-center text-center my-auto py-10">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-6 shadow-xs">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <p className="font-serif text-xs tracking-[0.3em] text-[#C5A880] uppercase mb-2">
          Temporary Issue
        </p>

        <h1 className="text-xl sm:text-2xl font-serif text-stone-800 tracking-tight leading-snug mb-3">
          페이지를 불러오는 중<br />일시적인 오류가 발생했습니다
        </h1>

        <p className="text-xs sm:text-[13px] text-stone-500 leading-relaxed max-w-[320px] mb-8 font-sans">
          네트워크 환경이 불안정하거나 일시적인 연결 지연일 수 있습니다.<br />
          아래 버튼을 눌러 다시 시도해 주세요.
        </p>

        {/* 액션 버튼 그룹 */}
        <div className="w-full max-w-[280px] space-y-2.5">
          <button
            onClick={handleRetry}
            className="w-full py-3.5 px-5 bg-stone-800 hover:bg-stone-900 active:scale-98 text-white rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>페이지 다시 시도하기</span>
          </button>

          <Link
            href="/"
            className="w-full py-3 px-5 bg-white hover:bg-stone-50 active:scale-98 text-stone-600 border border-stone-200/80 rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <span>아틀리에 드 무키루 메인 홈으로</span>
          </Link>
        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="w-full max-w-md text-center py-4">
        <p className="text-[11px] text-stone-400 font-sans tracking-wider uppercase">
          © ATELIER DE MUKIRU. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
