'use client';

import { useState, useEffect } from 'react';
import ScrollReveal from '../ScrollReveal';
import { DEFAULT_REVIEWS_CONFIG, getReviewsConfig } from '@/lib/reviewsConfig';

export default function ReviewsSection() {
  const [reviewsConfig, setReviewsConfig] = useState(DEFAULT_REVIEWS_CONFIG);

  useEffect(() => {
    getReviewsConfig().then((cfg) => {
      if (cfg) setReviewsConfig(cfg);
    });
  }, []);

  const reviews = reviewsConfig.reviews || DEFAULT_REVIEWS_CONFIG.reviews;

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white border-t border-slate-100 overflow-hidden text-center">
      <div className="max-w-5xl mx-auto">
        
        {/* ========================================================
            0. 섹션 헤더
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block px-3.5 py-1 bg-[#FAF9F6] border border-slate-200/80 rounded-full text-[10.5px] font-mono tracking-wider text-slate-600 uppercase mb-3 shadow-2xs font-medium">
              VERIFIED REVIEWS · BEST CURATION
            </span>
            <h2
              className="text-2xl sm:text-4xl text-[#0f172a] font-extrabold tracking-[-0.03em] font-sans mb-3"
              style={{ lineHeight: 1.35 }}
            >
              아틀리에 드 무키루를 먼저 경험한<br />
              <span className="text-slate-400 font-normal">신랑·신부님들의 베스트 실구매평</span>
            </h2>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 rounded-full border border-amber-200/80 text-amber-950 text-xs font-semibold shadow-2xs mt-1">
              <span className="text-amber-500">★★★★★</span>
              <span>평균 만족도 4.98 / 5.0</span>
              <span className="text-amber-300">|</span>
              <span className="text-slate-600 font-normal">네이버 스마트스토어 공식 인증</span>
            </div>
            <p className="text-xs text-slate-500 font-light mt-3 max-w-md mx-auto">
              {reviewsConfig.badge_subtitle || '1,200+ 쌍의 신혼부부가 증명하는 만족도 99%의 경험'}
            </p>
          </div>
        </ScrollReveal>

        {/* ========================================================
            1. 4종 고객 후기 카드 그리드 (2x2)
           ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 text-left">
          {reviews.map((rev, idx) => (
            <ScrollReveal key={rev.id || idx} delay={idx * 80} duration={800}>
              <div className="h-full p-6 sm:p-7 rounded-3xl bg-[#FAF9F6] border border-slate-200/80 hover:border-slate-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                
                <div className="space-y-3.5">
                  {/* 상단: 별점 & 네이버 인증 뱃지 & 시안명 */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      {'★'.repeat(rev.rating || 5)}
                      <span className="text-slate-400 font-mono text-[11px] ml-1 font-normal">
                        {rev.wedding_date || rev.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                        <span>✓</span>
                        <span>실구매 인증</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200/80 text-[10.5px] font-mono text-slate-600 font-medium shadow-2xs hidden sm:inline-block">
                        {rev.template_name || rev.template}
                      </span>
                    </div>
                  </div>

                  {/* 인용구 / 하이라이트 문구 */}
                  {rev.quote && (
                    <h3 className="text-base sm:text-lg font-bold text-[#0f172a] tracking-tight font-sans leading-snug group-hover:text-amber-800 transition-colors">
                      {rev.quote}
                    </h3>
                  )}

                  {/* 상세 후기 내용 */}
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-[1.7] break-keep font-normal">
                    {rev.content}
                  </p>
                </div>

                {/* 하단: 부부 성함 & 핵심 만족 포인트 */}
                <div className="mt-5 pt-3.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {rev.names || rev.couple}
                  </span>
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 font-medium">
                    {rev.tag || rev.highlight}
                  </span>
                </div>

              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* ========================================================
            2. 하단: 네이버 스마트스토어 실구매평 전체보기 CTA 버튼
           ======================================================== */}
        <ScrollReveal delay={200} duration={800}>
          <div className="mt-12 sm:mt-16 text-center">
            <a
              href={reviewsConfig.naver_reviews_url || 'https://smartstore.naver.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-stone-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 group"
            >
              <span className="w-5 h-5 rounded-full bg-[#03C75A] text-white font-black text-[11px] flex items-center justify-center">
                N
              </span>
              <span>네이버 스마트스토어 실구매평 전체보기</span>
              <span className="text-amber-300 font-bold font-mono">★ 4.98</span>
              <span className="transition-transform group-hover:translate-x-1">➔</span>
            </a>
            <p className="text-[11px] text-slate-400 mt-2">
              * 스마트스토어에서 실제 결제하신 신혼부부님들의 진솔한 100% 실구매 포토 리뷰를 확인하실 수 있습니다.
            </p>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
