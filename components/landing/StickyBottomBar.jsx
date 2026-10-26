'use client';

import Link from 'next/link';

export default function StickyBottomBar() {
  const scrollToHero = () => {
    const el = document.getElementById('hero-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 모바일 화면 하단 고정 퀵 액션 바 */}
      <aside 
        aria-label="빠른 청첩장 제작 및 샘플 이동"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* 좌측: 시그니처 시안 보기 */}
          <button
            onClick={scrollToHero}
            type="button"
            className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all text-center cursor-pointer"
          >
            시그니처 시안 보기
          </button>

          {/* 우측: 내 청첩장 만들기 */}
          <Link
            href="/create"
            className="flex-[1.4] py-3 px-4 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-bold rounded-xl transition-all text-center shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>내 청첩장 만들기</span>
            <span className="text-sm font-bold">➔</span>
          </Link>
        </div>
      </aside>

      {/* 카카오톡 1:1 상담 플로팅 버튼 (하단 바 바로 위에 예쁘게 배치) */}
      <a
        href="http://pf.kakao.com/_RJamX/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-40 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] px-3.5 py-2.5 rounded-full shadow-lg font-medium text-xs flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 border border-black/5"
        title="카카오톡 1:1 문의"
      >
        <svg className="w-4 h-4 fill-[#191919]" viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.94-.123.498.182.49.383.357.158-.105 2.515-1.71 3.535-2.404.516.074 1.045.113 1.592.113 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
        </svg>
        <span className="font-semibold text-xs">문의</span>
      </a>
    </>
  );
}
