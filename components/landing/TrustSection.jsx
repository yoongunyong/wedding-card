'use client';

import Link from 'next/link';
import ScrollReveal from '../ScrollReveal';

export default function TrustSection() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#FAF9F6] border-y border-slate-200/60 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* ========================================================
            0. 섹션 헤더 & 평점 배지 (안심 장치)
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="inline-block px-3.5 py-1 bg-white border border-slate-200/80 rounded-full text-[10.5px] font-mono tracking-wider text-slate-600 uppercase mb-2.5 shadow-2xs font-medium">
              WHY ATELIER DE MUKIRU
            </span>
            <h2
              className="text-2xl sm:text-3xl text-[#0f172a] font-extrabold tracking-[-0.03em] font-sans"
              style={{ lineHeight: 1.35 }}
            >
              결제는 마지막에,<br />
              <span className="text-slate-400 font-normal">확인은 지금 바로.</span>
            </h2>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-amber-200/80 text-amber-950 text-xs font-medium shadow-2xs">
              <span className="text-amber-500 font-bold">★ 4.98</span>
              <span className="text-stone-300">|</span>
              <span className="text-slate-600">만족도 99% 신랑·신부의 선택</span>
            </div>
          </div>
        </ScrollReveal>

        {/* ========================================================
            3대 핵심 혜택 카드 그리드 (요즘 감성의 마이크로 비주얼 & 리프트업 3D 뎁스)
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          
          {/* --------------------------------------------------------
              카드 01. 구매 전 무료 시안 제작 (100% 무료 체험)
             -------------------------------------------------------- */}
          <ScrollReveal delay={0} duration={800}>
            <div className="h-full p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-400/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                {/* 상단 넘버 & 뱃지 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-slate-300 group-hover:text-amber-600 transition-colors">
                    01
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-2xs">
                    무료 100% 체험
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#0f172a] mb-2 font-sans tracking-tight">
                  구매 전, 무료로 시안 제작
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-[1.65] break-keep">
                  비용 없이 두 분의 사진과 문구를 넣어 실시간 미리보기까지 완성해 보세요. 오직 마음에 쏙 들 때만 결제하시면 됩니다.
                </p>

                {/* 중간 마이크로 비주얼: 0원 즉시 확인 칩 */}
                <div className="mt-5 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">시안 제작 비용</span>
                    <strong className="text-emerald-600 font-mono font-bold">0원 (무료)</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">5대 시안 실시간 비교</span>
                    <span className="text-slate-700 font-medium">즉시 렌더링</span>
                  </div>
                </div>
              </div>

              {/* 하단 액션 링크 */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/create"
                  className="text-xs font-bold text-[#0f172a] group-hover:text-amber-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>무료 시안 만들기</span>
                  <span className="transition-transform group-hover:translate-x-1">➔</span>
                </Link>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                  FREE PREVIEW
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* --------------------------------------------------------
              카드 02. 구매 후에도 무제한 수정 (예식 당일까지 안심)
             -------------------------------------------------------- */}
          <ScrollReveal delay={120} duration={800}>
            <div className="h-full p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-400/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                {/* 상단 넘버 & 뱃지 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-slate-300 group-hover:text-amber-600 transition-colors">
                    02
                  </span>
                  <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/60 shadow-2xs">
                    예식 당일까지 안심
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#0f172a] mb-2 font-sans tracking-tight">
                  구매 후에도 무제한 수정
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-[1.65] break-keep">
                  예식 전까지 시간, 장소, 사진, 계좌번호를 언제든 자유롭게 수정하세요. 링크에 1초 만에 실시간 반영됩니다.
                </p>

                {/* 중간 마이크로 비주얼: 1초 실시간 반영 스펙 */}
                <div className="mt-5 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">수정 반영 속도</span>
                    <strong className="text-sky-700 font-mono font-bold">1초 실시간 동기화</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">사진·텍스트 변경</span>
                    <span className="text-slate-700 font-medium">전용 모바일 관리</span>
                  </div>
                </div>
              </div>

              {/* 하단 메트릭 태그 */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">수정 횟수</span>
                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/80">
                  무제한 (0원)
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* --------------------------------------------------------
              카드 03. 종이 청첩장용 QR코드 무료 (인쇄용 고해상도 벡터)
             -------------------------------------------------------- */}
          <ScrollReveal delay={240} duration={800}>
            <div className="h-full p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-400/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>
                {/* 상단 넘버 & 뱃지 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-slate-300 group-hover:text-amber-600 transition-colors">
                    03
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                    인쇄용 벡터 지원
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#0f172a] mb-2 font-sans tracking-tight">
                  종이 청첩장용 QR코드 무료
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 font-normal leading-[1.65] break-keep">
                  종이 청첩장 봉투나 식권, 테이블 카드에 선명하게 인쇄할 수 있는 고해상도 QR코드를 원클릭 다운로드해 드립니다.
                </p>

                {/* 중간 마이크로 비주얼: 인쇄용 벡터 QR 마이크로 그래픽 */}
                <div className="mt-5 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center gap-3">
                  {/* 미니멀한 정교한 인쇄용 QR 그래픽 */}
                  <div className="w-10 h-10 bg-white rounded-lg border border-slate-300/80 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg viewBox="0 0 24 24" className="w-full h-full text-slate-900" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v4h-4v-4zm-4 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm0-4h2v2h-2v-2zm-2-2h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div className="text-[11px] leading-tight">
                    <strong className="text-slate-800 block font-semibold mb-0.5">300 DPI 초고해상도</strong>
                    <span className="text-slate-400 text-[10px]">인쇄소 인쇄 규격 100% 호환</span>
                  </div>
                </div>
              </div>

              {/* 하단 포맷 태그 */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">다운로드 포맷</span>
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/80">
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
