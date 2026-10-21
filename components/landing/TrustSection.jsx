'use client';

import Link from 'next/link';
import ScrollReveal from '../ScrollReveal';

export default function TrustSection() {
  return (
    <section className="py-12 sm:py-16 px-4 bg-white border-y border-stone-100">
      <div className="max-w-4xl mx-auto">
        {/* 상단 헤더 & 평점 배지 */}
        <ScrollReveal duration={800}>
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase mb-1.5">
              WHY ATELIER DE MUKIRU
            </p>
            <h2 className="font-editorial-title text-2xl sm:text-3xl lg:text-4xl text-gray-900 font-bold tracking-tight">
              결제는 마지막에,<br className="sm:hidden" /> 확인은 지금 바로.
            </h2>
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200/80 text-amber-950 text-xs font-medium shadow-2xs">
              <span className="text-amber-500 font-bold">★ 4.98</span>
              <span className="text-stone-300">|</span>
              <span className="text-stone-700">만족도 99% 신랑·신부의 선택</span>
            </div>
          </div>
        </ScrollReveal>

        {/* 3대 핵심 혜택 카드 그리드 (불필요한 여백 제거 및 컴팩트 슬림 카드 룩) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 카드 1: 무료 시안 제작 */}
          <ScrollReveal delay={0} duration={800}>
            <div className="h-full p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200/80 hover:border-stone-400/80 transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-bold text-white bg-stone-900 px-2 py-0.5 rounded-md">
                    01
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200/80 shadow-2xs">
                    무료 100% 체험
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 mb-1.5">
                  구매 전, 무료로 시안 제작
                </h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  비용 없이 사진과 문구를 넣어 실시간 미리보기까지 완성해 보세요. 마음에 들 때만 결제하시면 됩니다.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                <Link
                  href="/create"
                  className="text-xs font-semibold text-stone-900 hover:text-amber-700 transition-colors inline-flex items-center gap-1"
                >
                  <span>무료 시안 만들기</span>
                  <span>➔</span>
                </Link>
                <span className="text-[10px] text-stone-400 font-mono tracking-wider">FREE PREVIEW</span>
              </div>
            </div>
          </ScrollReveal>

          {/* 카드 2: 무제한 수정 */}
          <ScrollReveal delay={120} duration={800}>
            <div className="h-full p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200/80 hover:border-stone-400/80 transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-bold text-white bg-stone-900 px-2 py-0.5 rounded-md">
                    02
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200/80 shadow-2xs">
                    예식 당일까지 안심
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 mb-1.5">
                  구매 후에도 무제한 수정
                </h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  예식 전까지 시간, 장소, 사진, 계좌번호를 언제든 자유롭게 수정하세요. 링크에 1초 만에 실시간 반영됩니다.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                <span className="text-xs font-medium text-stone-600">수정 횟수</span>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                  무제한 (0원)
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* 카드 3: 종이 청첩장 QR & 공유 */}
          <ScrollReveal delay={240} duration={800}>
            <div className="h-full p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] border border-stone-200/80 hover:border-stone-400/80 transition-all shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-bold text-white bg-stone-900 px-2 py-0.5 rounded-md">
                    03
                  </span>
                  <span className="text-[10px] font-semibold text-stone-600 bg-white px-2 py-0.5 rounded-full border border-stone-200/80 shadow-2xs">
                    인쇄용 고해상도 벡터
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 mb-1.5">
                  종이 청첩장용 QR코드 무료
                </h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  종이 청첩장 봉투나 식권, 테이블 카드에 선명하게 인쇄할 수 있는 고해상도 QR코드를 원클릭 다운로드해 드립니다.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                <span className="text-xs font-medium text-stone-600">다운로드 포맷</span>
                <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200/80">
                  PNG / SVG
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
