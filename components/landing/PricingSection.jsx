'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ScrollReveal from '../ScrollReveal';
import { DEFAULT_PRICING, getPricingConfig } from '@/lib/pricingConfig';

export default function PricingSection() {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);

  useEffect(() => {
    getPricingConfig().then((cfg) => {
      if (cfg) setPricing(cfg);
    });
  }, []);

  const features = [
    {
      title: '5대 독창적인 시안 자유 변경',
      desc: '에어드랍 클래식, 에디토리얼, 플레이리스트, 시네마틱, 레트로 캠코더 전 시안 무제한 교체',
      icon: '✨',
    },
    {
      title: '고해상도 웨딩 화보 갤러리',
      desc: '최대 30장 무손실 압축 업로드, 핀치 줌 & 모바일 전체화면 라이트박스',
      icon: '🖼️',
    },
    {
      title: '감성 웨딩 BGM & 커스텀 음원',
      desc: '시그니처 피아노 연주곡 4종 기본 탑재 + 두 사람만의 맞춤 MP3 업로드',
      icon: '🎵',
    },
    {
      title: '하객 참석 여부(RSVP) 실시간 관리',
      desc: '식사 여부, 동반 인원, 셔틀버스 실시간 자동 집계 및 엑셀(CSV) 원클릭 다운로드',
      icon: '📋',
    },
    {
      title: '감성 롤링 방명록 & 포토스냅 보관함',
      desc: '하객 축하 메시지 비밀번호 관리 및 하객이 직접 찍어준 현장 스냅 사진 무제한 수집',
      icon: '📸',
    },
    {
      title: '신랑·신부 전용 2차 보안 관리 페이지',
      desc: '4자리 PIN 번호 인증 + 참석자 명단 실시간 조회 + 원클릭 보안 링크 재발급',
      icon: '🔒',
    },
    {
      title: '예식 당일까지 횟수 제한 없는 1초 무제한 수정',
      desc: '예식 일시, 웨딩홀, 사진, 축의금 계좌번호 언제든 수정 즉시 하객 링크에 반영',
      icon: '⚡',
    },
    {
      title: '종이 청첩장 인쇄용 300 DPI 초고해상도 QR코드',
      desc: '종이 봉투, 식권, 테이블 카드에 선명하게 인쇄할 수 있는 고화질 QR 원클릭 다운로드',
      icon: '🏷️',
    },
  ];

  const formatPrice = (num) => {
    return (num || 0).toLocaleString();
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FAF9F6] border-t border-slate-200/70 overflow-hidden text-center">
      <div className="max-w-4xl mx-auto">
        
        {/* ========================================================
            0. 섹션 헤더 & 가치 제안
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block px-3.5 py-1 bg-white border border-slate-200/80 rounded-full text-[10.5px] font-mono tracking-wider text-slate-600 uppercase mb-3 shadow-2xs font-medium">
              TRANSPARENT PRICING · NO HIDDEN FEES
            </span>
            <h2
              className="text-2xl sm:text-4xl text-[#0f172a] font-extrabold tracking-[-0.03em] font-sans mb-4"
              style={{ lineHeight: 1.35 }}
            >
              추가 옵션 비용 없는<br />
              <span className="text-slate-400 font-normal">단 하나의 투명한 올인원 플랜</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-lg mx-auto leading-[1.7] break-keep">
              BGM 추가금, 사진 추가금, 계좌 개수 제한 등 복잡한 옵션 장사 없이<br className="hidden sm:inline" />
              아틀리에 드 무키루의 모든 프리미엄 기능을 한 번의 결제로 영구 제공합니다.
            </p>
          </div>
        </ScrollReveal>

        {/* ========================================================
            1. 올인원 가격 카드 (시그니처 럭셔리 카드)
           ======================================================== */}
        <ScrollReveal delay={150} duration={800}>
          <div className="relative bg-white rounded-3xl sm:rounded-[32px] border-2 border-[#0f172a] shadow-[0_20px_50px_rgba(15,23,42,0.08)] overflow-hidden text-left max-w-2xl mx-auto">
            
            {/* 상단 런칭 기념 특별 뱃지 */}
            <div className="bg-[#0f172a] text-white px-6 py-3 flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 font-bold tracking-wide">
                <span className="text-amber-400">✨</span>
                <span>{pricing.badge_text || '아틀리에 드 무키루 런칭 기념 특가'}</span>
              </span>
              {pricing.discount_rate > 0 && (
                <span className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border border-amber-400/30">
                  {pricing.discount_rate}% OFF
                </span>
              )}
            </div>

            <div className="p-7 sm:p-10 space-y-8">
              
              {/* 가격 헤더 */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-7 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    ALL-IN-ONE PASS
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
                    프리미엄 정식 서비스 패키지
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {pricing.period_text || '제작은 100% 무료 · 완성된 청첩장이 마음에 쏙 들 때만 활성화'}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-2">
                    {pricing.regular_price > pricing.discount_price && (
                      <span className="text-xs sm:text-sm text-slate-400 line-through font-mono">
                        ₩{formatPrice(pricing.regular_price)}
                      </span>
                    )}
                    <strong className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] font-mono tracking-tight">
                      ₩{formatPrice(pricing.discount_price)}
                    </strong>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                    추가 옵션 결제 0원 (VAT 포함)
                  </span>
                </div>
              </div>

              {/* 8대 핵심 포함 혜택 리스트 (2열 그리드) */}
              <div>
                <span className="text-xs font-bold text-slate-900 block mb-4 uppercase tracking-wider font-mono">
                  WHAT&apos;S INCLUDED · 기본 포함 모든 혜택
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {features.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-start gap-3 group hover:bg-slate-100/70 transition-colors"
                    >
                      <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                      <div className="space-y-0.5">
                        <strong className="text-xs font-bold text-[#0f172a] block leading-snug">
                          {item.title}
                        </strong>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-normal break-keep">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 안심 보증 배너 & CTA 버튼 */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <span className="font-medium text-[11.5px] leading-relaxed">
                      <strong>100% 무료 시안 체험:</strong> 카드 등록 없이 지금 바로 제작하고, 만족스러울 때 활성화하세요.
                    </span>
                  </div>
                  <span className="text-[10.5px] text-amber-800/80 font-mono shrink-0">
                    안심 후결제 방식
                  </span>
                </div>

                <Link
                  href="/create"
                  className="w-full py-4 bg-[#1e293b] hover:bg-[#0f172a] text-white text-sm sm:text-base font-bold rounded-2xl shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer text-center"
                >
                  <span>지금 0원으로 무료 시안 만들기</span>
                  <span className="transition-transform group-hover:translate-x-1">➔</span>
                </Link>

                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-slate-500">
                  <span>✓ 예식 후 1년 안심 보관</span>
                  <span>✓ 워터마크 즉시 제거</span>
                  <span>✓ 네이버페이 포인트 최대 5% 적립</span>
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
