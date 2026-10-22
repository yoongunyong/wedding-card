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
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-amber-100 selection:text-amber-900 antialiased pb-24 sm:pb-0">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex flex-col text-left group">
            <span className="font-editorial-serif text-[17px] sm:text-[19px] tracking-[0.2em] font-bold uppercase text-gray-900 group-hover:text-amber-700 transition-colors">
              ATELIER DE MUKIRU
            </span>
            <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase -mt-0.5">
              BOUTIQUE WEDDING ATELIER
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95"
            >
              청첩장 무료 제작
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 첫 화면: 시안 5종의 독보적인 첫 느낌을 담은 카드 스와이퍼 */}
      <HeroCardSwiper />

      {/* 3. 신뢰 & 가치 제안 (결제는 마지막에, 확인은 지금 바로) */}
      <TrustSection />

      {/* 4. 시그니처 기능 인터랙티브 쇼케이스 (오프닝/RSVP/당일안내/BGM 4단 탭 전환) */}
      <SignatureShowcase />

      {/* 5. 전체 기능 둘러보기 (4단 탭 네비게이션) */}
      <FeatureTabs />

      {/* 6. 쉬운 3단계 제작 가이드 & 하단 CTA 배너 (스크롤 리빌) */}
      <section className="py-14 sm:py-20 px-4 bg-white border-t border-gray-100 text-center">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal duration={800}>
            <span className="font-mono text-xs text-amber-600 tracking-widest uppercase font-bold block mb-2">
              SIMPLE PROCESS
            </span>
            <h2 className="font-editorial-title text-2xl sm:text-4xl text-gray-900 font-bold tracking-tight mb-4">
              단 5분 만에 완성되는<br />두 사람만의 모바일 청첩장
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-light max-w-md mx-auto mb-10">
              복잡한 승인 과정 없이 사진과 문구를 넣으면 즉시 완성되며, 예식 전까지 언제든 자유롭게 수정하실 수 있습니다.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={150} duration={800}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-12">
              <div className="p-5 bg-[#F8F9FA] rounded-2xl border border-gray-200/70 shadow-2xs hover:border-gray-300 transition-colors">
                <span className="font-mono text-xs text-amber-600 font-bold block mb-1">STEP 01</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">디자인 시안 선택</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  5가지 시안 중 두 사람의 사진 분위기에 어울리는 테마를 고릅니다.
                </p>
              </div>

              <div className="p-5 bg-[#F8F9FA] rounded-2xl border border-gray-200/70 shadow-2xs hover:border-gray-300 transition-colors">
                <span className="font-mono text-xs text-amber-600 font-bold block mb-1">STEP 02</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">예식 정보 & 사진 입력</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  실시간 미리보기를 보며 사진, 초대 문구, 계좌번호를 입력합니다.
                </p>
              </div>

              <div className="p-5 bg-[#F8F9FA] rounded-2xl border border-gray-200/70 shadow-2xs hover:border-gray-300 transition-colors">
                <span className="font-mono text-xs text-amber-600 font-bold block mb-1">STEP 03</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">즉시 발급 & 무제한 수정</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  청첩장 링크와 인쇄용 QR이 발급되며, 예식 전까지 무제한 수정됩니다.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={250} duration={800}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/create"
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>지금 무료로 시안 만들기</span>
                <span>➔</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 8. 하단 푸터 (전자상거래 및 카카오 비즈니스 심사 규격 100% 보존) */}
      <footer className="py-12 px-6 bg-stone-950 text-stone-400 font-sans text-xs border-t border-stone-800">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-800/80">
            <div>
              <p className="font-editorial-serif text-sm tracking-widest uppercase text-stone-200 font-medium mb-1">
                ATELIER DE MUKIRU
              </p>
              <p className="text-[11px] text-stone-500 font-light">
                단 하나의 특별한 순간을 완성하는 프리미엄 모바일 청첩장 아틀리에, 무키루(MUKIRU)
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-stone-400">
              <Link href="/create" className="hover:text-stone-200 transition-colors">
                청첩장 제작
              </Link>
              <a
                href="http://pf.kakao.com/_RJamX/chat"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 text-amber-200/90 font-medium"
              >
                카카오톡 1:1 상담
              </a>
            </div>
          </div>

          {/* 사업자 정보 (전자상거래 표준 및 카카오 비즈니스 채널 심사 규격) */}
          <div className="text-[11px] text-stone-500 leading-relaxed font-light space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-400">
              <span><strong className="text-stone-300 font-medium">상호명:</strong> 친절한 꺼묵이네</span>
              <span className="text-stone-700">|</span>
              <span><strong className="text-stone-300 font-medium">대표자:</strong> 윤건용</span>
              <span className="text-stone-700">|</span>
              <span><strong className="text-stone-300 font-medium">사업자등록번호:</strong> 386-12-02981</span>
              <span className="text-stone-700">|</span>
              <span><strong className="text-stone-300 font-medium">서비스명:</strong> 아틀리에 드 무키루 (ATELIER DE MUKIRU)</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span><strong className="text-stone-400 font-medium">사업장 소재지:</strong> 경기도 안양시 동안구 시민대로 190 (힐스테이트 범계역 모비우스) 102동 3008호 (우 : 14072)</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span><strong className="text-stone-400 font-medium">고객문의:</strong> 카카오톡 1:1 채널 &apos;아틀리에 드 무키루&apos; (상담시간: 연중무휴 09:00 ~ 22:00)</span>
              <span className="text-stone-700">|</span>
              <span><strong className="text-stone-400 font-medium">이메일:</strong> yungunyong@naver.com</span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-600 gap-2">
            <span>&copy; {new Date().getFullYear()} 친절한 꺼묵이네 & ATELIER DE MUKIRU. All rights reserved.</span>
            <span>본 사이트의 콘텐츠 및 UI/UX 디자인은 저작권법의 보호를 받습니다.</span>
          </div>
        </div>
      </footer>

      {/* 9. 모바일 하단 고정 바 & 카카오톡 플로팅 버튼 */}
      <StickyBottomBar />
    </div>
  );
}
