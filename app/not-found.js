'use client';

import Link from 'next/link';

export default function NotFound() {
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
        {/* 장식용 아이콘 */}
        <div className="w-16 h-16 rounded-full bg-stone-100/80 border border-stone-200/60 flex items-center justify-center text-stone-400 mb-6 shadow-xs">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <p className="font-serif text-xs tracking-[0.3em] text-[#C5A880] uppercase mb-2">
          Page Not Found
        </p>

        <h1 className="text-xl sm:text-2xl font-serif text-stone-800 tracking-tight leading-snug mb-3">
          소중한 청첩장을 찾을 수 없습니다
        </h1>

        <p className="text-xs sm:text-[13px] text-stone-500 leading-relaxed max-w-[320px] mb-8 font-sans">
          페이지 주소가 변경되었거나, 비공개 또는 종료된 청첩장일 수 있습니다.<br />
          전달받으신 링크를 다시 한번 확인해 주세요.
        </p>

        {/* 액션 버튼 그룹 */}
        <div className="w-full max-w-[280px] space-y-2.5">
          <Link
            href="/"
            className="w-full py-3.5 px-5 bg-stone-800 hover:bg-stone-900 active:scale-98 text-white rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <span>아틀리에 드 무키루 홈으로</span>
            <span>→</span>
          </Link>

          <a
            href="https://pf.kakao.com/_Nxhvvn"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-5 bg-white hover:bg-stone-50 active:scale-98 text-stone-600 border border-stone-200/80 rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 fill-[#3C1E1E]" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.708 4.8 4.27 6.054-.187.698-.675 2.528-.773 2.915-.121.482.177.476.372.346.154-.102 2.45-1.666 3.442-2.344.56.082 1.127.129 1.689.129 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
            </svg>
            <span>카카오톡 1:1 문의하기</span>
          </a>
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
