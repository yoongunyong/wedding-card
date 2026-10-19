'use client';

export default function SampleWatermark() {
  return (
    <>
      {/* 1. 상단 고정 샘플 모드 알림 배너 */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center px-3 pt-3">
        <div className="pointer-events-auto max-w-[410px] w-full bg-stone-900/92 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-3 text-left animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 text-[10px] font-mono tracking-widest uppercase bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full">
              SAMPLE
            </span>
            <p className="text-[11px] font-light text-stone-200 truncate">
              미리보기 전용 샘플 모드입니다
            </p>
          </div>
          <span className="shrink-0 text-[10px] text-stone-400 font-mono">
            정식 인증 필요
          </span>
        </div>
      </div>

      {/* 2. 화면 전체에 은은하게 반복되는 사선 워터마크 오버레이 */}
      <div 
        className="fixed inset-0 z-30 pointer-events-none overflow-hidden select-none flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="w-[180vw] h-[180vh] flex flex-wrap content-center justify-center gap-x-20 gap-y-24 rotate-[-28deg] opacity-[0.065]">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="text-center font-serif text-stone-950 whitespace-nowrap">
              <span className="text-xl sm:text-2xl font-bold tracking-[0.25em] block">
                SAMPLE PREVIEW
              </span>
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase block opacity-80 mt-1">
                ATELIER DE MUKIRU
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
