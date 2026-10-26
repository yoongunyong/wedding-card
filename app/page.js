import Link from 'next/link';
import HeroCardSwiper from '@/components/landing/HeroCardSwiper';
import TrustSection from '@/components/landing/TrustSection';
import SignatureShowcase from '@/components/landing/SignatureShowcase';
import FeatureTabs from '@/components/landing/FeatureTabs';
import StickyBottomBar from '@/components/landing/StickyBottomBar';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: '아틀리에 드 무키루 (ATELIER DE MUKIRU) — 프리미엄 모바일 청첩장',
  description: '단 하나의 소중한 순간을 완성하는 감성 모바일 청첩장 아틀리에. 모던 클래식, 에디토리얼 룩북, 감성 플레이리스트, 시네마틱 모노리스, 모던 씬 5종 시안을 실시간으로 체험해 보세요.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900 antialiased pb-24 sm:pb-0">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex flex-col text-left group">
            <span className="font-editorial-serif text-[17px] sm:text-[19px] tracking-[0.2em] font-bold uppercase text-[#0f172a] group-hover:text-amber-700 transition-colors">
              ATELIER DE MUKIRU
            </span>
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase -mt-0.5">
              BOUTIQUE WEDDING ATELIER
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95"
            >
              청첩장 무료 제작
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 첫 화면: 시안 5종 + 룩북의 독보적인 첫 느낌을 담은 와이드 카드 파노라마 스와이퍼 */}
      <HeroCardSwiper />

      {/* 3. 신뢰 & 가치 제안 (결제는 마지막에, 확인은 지금 바로) */}
      <TrustSection />

      {/* 4. 시그니처 기능 인터랙티브 쇼케이스 (오프닝/RSVP/당일안내/BGM 4단 탭 전환) */}
      <SignatureShowcase />

      {/* 5. 전체 기능 둘러보기 (4단 탭 네비게이션) */}
      <FeatureTabs />

      {/* 6. 쉬운 3단계 제작 가이드 & 하단 CTA 배너 (요즘 감성의 지오메트릭 셰이프 & 리프트업 3D 뎁스) */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white border-t border-slate-100 text-center overflow-hidden">
        <div className="max-w-5xl mx-auto">
          {/* 섹션 헤더 */}
          <ScrollReveal duration={800}>
            <span className="inline-block px-3.5 py-1 bg-white border border-slate-200/80 rounded-full text-[10.5px] font-mono tracking-wider text-slate-600 uppercase mb-3 shadow-2xs font-medium">
              SIMPLE 3 STEPS · EFFORTLESS
            </span>
            <h2
              className="text-2xl sm:text-4xl text-[#0f172a] font-extrabold tracking-[-0.03em] font-sans mb-4"
              style={{ lineHeight: 1.35 }}
            >
              단 5분 만에 완성되는<br />
              <span className="text-slate-400 font-normal">두 사람만의 모바일 청첩장</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-md mx-auto mb-12 sm:mb-16 leading-[1.7] break-keep">
              복잡한 승인 대기 없이 두 사람의 사진과 문구를 넣으면 즉시 완성되며, 예식 전까지 언제든 자유롭게 수정하실 수 있습니다.
            </p>
          </ScrollReveal>

          {/* 3단계 프로세스 카드 그리드 (기하학적 도형 아이콘 & 소프트 리프트업) */}
          <ScrollReveal delay={150} duration={800}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 text-left mb-14 sm:mb-16">
              
              {/* STEP 01 */}
              <div className="h-full p-6 sm:p-7 bg-[#FAF9F6] rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:border-slate-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {/* 기하학적 셰이프 아이콘 (시안 템플릿 모티프) */}
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-100/80 transition-all duration-300 shadow-2xs">
                      <svg className="w-6 h-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <span className="font-mono text-xs font-bold tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                      STEP 01
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0f172a] mb-2 tracking-tight font-sans group-hover:text-amber-800 transition-colors">
                    디자인 시안 선택
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-[1.65] break-keep">
                    5가지 독창적인 시안 중 두 분의 웨딩 화보 분위기에 어울리는 테마를 고릅니다.
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                    <span className="text-amber-600">✨</span>
                    <span>5대 시안 실시간 원클릭 변경</span>
                  </span>
                </div>
              </div>

              {/* STEP 02 */}
              <div className="h-full p-6 sm:p-7 bg-[#FAF9F6] rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:border-slate-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {/* 기하학적 셰이프 아이콘 (에디터 & 사진 모티프) */}
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200/70 text-sky-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-100/80 transition-all duration-300 shadow-2xs">
                      <svg className="w-6 h-6 text-sky-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <span className="font-mono text-xs font-bold tracking-wider text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/60">
                      STEP 02
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0f172a] mb-2 tracking-tight font-sans group-hover:text-sky-800 transition-colors">
                    예식 정보 &amp; 사진 입력
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-[1.65] break-keep">
                    실시간 화면을 보며 사진, 초대 문구, 예식 정보, 계좌번호를 쉽고 편하게 입력합니다.
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                    <span className="text-sky-600">⚡</span>
                    <span>실시간 프리뷰 즉시 렌더링</span>
                  </span>
                </div>
              </div>

              {/* STEP 03 */}
              <div className="h-full p-6 sm:p-7 bg-[#FAF9F6] rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:border-slate-300 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {/* 기하학적 셰이프 아이콘 (링크 & 발급 모티프) */}
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-100/80 transition-all duration-300 shadow-2xs">
                      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <span className="font-mono text-xs font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                      STEP 03
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0f172a] mb-2 tracking-tight font-sans group-hover:text-emerald-800 transition-colors">
                    즉시 발급 &amp; 무제한 수정
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-[1.65] break-keep">
                    청첩장 링크와 인쇄용 QR이 즉시 발급되며, 예식 전까지 횟수 제한 없이 자유롭게 수정됩니다.
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                    <span className="text-emerald-600">🔗</span>
                    <span>모바일 링크 &amp; 인쇄 QR 즉시 제공</span>
                  </span>
                </div>
              </div>

            </div>
          </ScrollReveal>

          {/* 하단 CTA 버튼 & 안심 캡션 (요즘 프리미엄 필 버튼 룩) */}
          <ScrollReveal delay={250} duration={800}>
            <div className="flex flex-col items-center justify-center gap-3">
              <Link
                href="/create"
                className="w-full sm:w-auto px-9 py-4 bg-[#1e293b] hover:bg-[#0f172a] text-white text-sm sm:text-base font-bold rounded-full shadow-[0_10px_25px_rgba(15,23,42,0.12)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.22)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>지금 무료로 시안 만들기</span>
                <span className="transition-transform group-hover:translate-x-1">➔</span>
              </Link>
              <p className="text-[11px] text-slate-400 font-normal">
                신용카드 등록 없이 0원으로 시작 · 마음에 들 때만 결제
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 8. 하단 푸터 (아틀리에 무드에 맞춘 럭셔리 딥 차콜 & 샴페인 골드 에디토리얼 푸터) */}
      <footer className="py-14 sm:py-16 px-6 bg-[#16181f] text-stone-400 font-sans text-xs border-t border-white/10 selection:bg-amber-900 selection:text-amber-100">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* 상단: 브랜드 마스트헤드 & 퀵 액션 */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2.5">
                <span className="font-editorial-serif text-lg tracking-[0.2em] uppercase text-stone-100 font-bold">
                  ATELIER DE MUKIRU
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[9.5px] font-mono tracking-wider uppercase font-semibold">
                  BOUTIQUE
                </span>
              </div>
              <p className="text-xs text-stone-400 font-light max-w-md break-keep">
                단 하나의 소중한 순간을 완성하는 프리미엄 모바일 청첩장 아틀리에, 무키루
              </p>
            </div>

            {/* 우측 링크 & 카카오톡 상담 버튼 */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Link
                href="/create"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 transition-all font-medium cursor-pointer"
              >
                청첩장 무료 제작
              </Link>
              <a
                href="http://pf.kakao.com/_RJamX/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#FEE500] hover:bg-[#ffe812] text-stone-950 font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-xs">💬</span>
                <span>카카오톡 1:1 상담</span>
              </a>
            </div>
          </div>

          {/* 중간: 사업자 정보 & 고객센터 (가독성 높은 단정한 2열 분할 그리드) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-[11px] text-stone-400 leading-relaxed font-light text-left">
            
            {/* 좌측 8열: 사업자 법적 고지 (전자상거래 및 카카오 비즈니스 규격 100% 준수) */}
            <div className="md:col-span-8 space-y-2">
              <span className="font-mono text-[10px] text-stone-500 uppercase tracking-widest block font-semibold mb-1">
                BUSINESS INFORMATION
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span><strong className="text-stone-300 font-normal">상호명</strong> 친절한 꺼묵이네</span>
                <span className="text-stone-700">·</span>
                <span><strong className="text-stone-300 font-normal">대표자</strong> 윤건용</span>
                <span className="text-stone-700">·</span>
                <span><strong className="text-stone-300 font-normal">사업자등록번호</strong> 386-12-02981</span>
                <span className="text-stone-700">·</span>
                <span><strong className="text-stone-300 font-normal">서비스명</strong> 아틀리에 드 무키루 (ATELIER DE MUKIRU)</span>
              </div>
              <p>
                <strong className="text-stone-300 font-normal">사업장 소재지</strong> 경기도 안양시 동안구 시민대로 190 (힐스테이트 범계역 모비우스) 102동 3008호 (우 : 14072)
              </p>
            </div>

            {/* 우측 4열: 고객센터 카드 (상담시간 & 이메일) */}
            <div className="md:col-span-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="font-mono text-[10px] text-amber-400/90 uppercase tracking-widest block font-bold">
                CUSTOMER SERVICE
              </span>
              <p className="text-stone-200 font-medium text-xs">
                카카오톡 채널 &apos;아틀리에 드 무키루&apos;
              </p>
              <div className="text-[11px] text-stone-400 space-y-0.5">
                <p>상담시간: 연중무휴 09:00 ~ 22:00</p>
                <p>
                  이메일:{' '}
                  <a href="mailto:yungunyong@naver.com" className="text-stone-300 hover:underline">
                    yungunyong@naver.com
                  </a>
                </p>
              </div>
            </div>

          </div>

          {/* 하단: 카피라이트 & 저작권 고지 */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-500 gap-2">
            <span>&copy; {new Date().getFullYear()} ATELIER DE MUKIRU · 친절한 꺼묵이네. All rights reserved.</span>
            <span className="text-stone-600">본 사이트의 콘텐츠 및 UI/UX 디자인은 저작권법의 보호를 받습니다.</span>
          </div>

        </div>
      </footer>

      {/* 9. 모바일 하단 고정 바 & 카카오톡 플로팅 버튼 */}
      <StickyBottomBar />
    </div>
  );
}
