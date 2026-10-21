'use client';

import { useState } from 'react';
import ScrollReveal from '../ScrollReveal';

const SHOWCASE_TABS = [
  { id: 'rsvp', label: '📊 스마트 RSVP', badge: '참석 집계 & 엑셀' },
  { id: 'today', label: '🚗 당일 안내데스크', badge: '내비게이션 & D-Day' },
  { id: 'bgm', label: '🎵 감성 BGM', badge: '바이닐 & 피아노 음원' },
];

export default function SignatureShowcase() {
  const [activeTab, setActiveTab] = useState('rsvp');

  return (
    <section className="py-14 sm:py-20 px-4 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
        {/* 1. 섹션 헤더 & 탭 바 (스크롤 리빌) */}
        <ScrollReveal duration={800}>
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
            <span className="inline-block px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-[11px] font-mono tracking-widest uppercase font-semibold mb-2.5">
              SIGNATURE EXPERIENCES
            </span>
            <h2 className="font-editorial-title text-2xl sm:text-3xl lg:text-4xl text-gray-900 font-bold tracking-tight leading-snug">
              청첩장 하나로 완성되는<br />
              무키루만의 시그니처 디테일
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-gray-500 font-light">
              링크를 여는 첫 순간부터 예식 당일 식장에 도착할 때까지,<br className="hidden sm:inline" />
              아래 탭을 눌러 무키루의 특별한 기능들을 직접 체험해 보세요.
            </p>
          </div>

          {/* 2. 인터랙티브 3단 탭 바 (모바일 가로 스크롤 지원) */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
            {SHOWCASE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm scale-102 font-semibold'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80 hover:text-stone-900'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* 3. 탭별 인터랙티브 쇼케이스 본문 카드 */}
        <ScrollReveal delay={150} duration={800}>
          <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-10 border border-stone-200/70 shadow-xs transition-all">
            {/* [TAB 1: 스마트 RSVP] */}
            {activeTab === 'rsvp' && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 animate-in fade-in duration-300">
                <div className="flex-1 text-left space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-semibold">
                      스마트 RSVP
                    </span>
                    <span className="px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md text-[11px] font-semibold">
                      엑셀 정리 0분
                    </span>
                  </div>

                  <h3 className="font-editorial-title text-xl sm:text-2xl lg:text-3xl text-gray-900 font-bold leading-snug">
                    엑셀 정리는 그만,<br />
                    응답과 집계를 자동으로 관리하세요
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
                    신랑·신부측 참석 여부, 식사 인원, 대절버스 탑승까지 하객들이 입력하면 실시간으로 자동 분류 집계됩니다. 예식장 식대 정산 시 엑셀(CSV) 한 번으로 즉시 다운로드하세요.
                  </p>

                  <ul className="space-y-2 pt-1 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>참석 인원 및 식사 여부 실시간 통계 대시보드</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>웨딩홀 제출용 엑셀(CSV) 파일 원클릭 다운로드</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>양가 부모님도 편하게 확인 가능한 관리자 링크 제공</span>
                    </li>
                  </ul>
                </div>

                {/* RSVP 대시보드 그래픽 */}
                <div className="w-full sm:w-[300px] shrink-0">
                  <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-200 space-y-3.5 text-left">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <span className="text-xs font-semibold text-gray-500">전체 응답</span>
                      <span className="text-lg font-bold font-mono text-gray-900">128건</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-emerald-50/70 rounded-xl flex items-center justify-between">
                        <span className="text-emerald-800 font-medium">참석</span>
                        <span className="font-bold text-emerald-900 font-mono text-sm">96명</span>
                      </div>
                      <div className="p-2.5 bg-blue-50/70 rounded-xl flex items-center justify-between">
                        <span className="text-blue-800 font-medium">식사</span>
                        <span className="font-bold text-blue-900 font-mono text-sm">88명</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between">
                        <span className="text-gray-600 font-medium">대절버스</span>
                        <span className="font-bold text-gray-900 font-mono text-sm">24명</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between">
                        <span className="text-gray-600 font-medium">불참</span>
                        <span className="font-bold text-gray-400 font-mono text-sm">32명</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] pt-1">
                      <div className="flex items-center justify-between py-1 border-b border-gray-50 text-gray-600">
                        <span className="font-medium text-gray-900">신랑측 김○○</span>
                        <span className="text-emerald-600 font-medium">참석 • 2명 (식사 O)</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-gray-50 text-gray-600">
                        <span className="font-medium text-gray-900">신부측 이○○</span>
                        <span className="text-emerald-600 font-medium">참석 • 1명 (식사 X)</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs">
                        <span>📊</span>
                        <span>엑셀(CSV) 원클릭 다운로드</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* [TAB 2: 당일 안내데스크] */}
            {activeTab === 'today' && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 animate-in fade-in duration-300">
                <div className="flex-1 text-left space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-[11px] font-semibold">
                      예식 당일 자동 전환
                    </span>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md text-[11px] font-semibold">
                      하객 배려 100%
                    </span>
                  </div>

                  <h3 className="font-editorial-title text-xl sm:text-2xl lg:text-3xl text-gray-900 font-bold leading-snug">
                    예식 당일,<br />
                    청첩장이 안내 데스크가 됩니다
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
                    결혼식 당일 하객이 청첩장 링크를 다시 열면, 길고 복잡한 내용 대신 <strong className="text-gray-900 font-medium">&quot;예식 시작까지 남은 시간&quot;</strong>과 <strong className="text-gray-900 font-medium">&quot;내비게이션 길안내&quot;</strong> 버튼이 상단에 자동으로 큼직하게 전환됩니다.
                  </p>

                  <ul className="space-y-2 pt-1 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span>실시간 디데이 카운트다운 (예식 시작까지 남은 시간)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span>네이버지도 • 카카오내비 원클릭 연동</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span>주차 안내 및 ATM 위치 한눈에 확인</span>
                    </li>
                  </ul>
                </div>

                {/* 당일 안내 데스크 그래픽 카드 */}
                <div className="w-full sm:w-[300px] shrink-0">
                  <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-gray-200 space-y-3.5 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-purple-600 font-bold uppercase block">
                          TODAY WEDDING
                        </span>
                        <span className="text-sm font-serif font-bold text-gray-900">
                          김도현 ♥ 이서연
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">
                        당일 자동 모드
                      </span>
                    </div>

                    <div className="p-3 bg-gray-900 text-white rounded-xl text-center">
                      <span className="text-[10px] text-gray-400 block mb-0.5">예식 시작까지</span>
                      <span className="text-base font-bold font-mono tracking-wider text-amber-300">
                        1시간 24분 전
                      </span>
                    </div>

                    {/* 실제 청첩장 템플릿과 100% 동일한 네이버지도 + 카카오내비 2종 */}
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-3.5 bg-[#03C75A] text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                        <span>Naver Map 네이버지도</span>
                        <span className="text-[10px] font-mono">길안내 ➔</span>
                      </div>
                      <div className="w-full py-2.5 px-3.5 bg-[#FEE500] text-gray-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                        <span>Kakao Navi 카카오내비</span>
                        <span className="text-[10px] font-mono">길안내 ➔</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md">🅿️ 주차 2시간 무료</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md">🏧 ATM 지하 1층</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* [TAB 3: 감성 BGM] */}
            {activeTab === 'bgm' && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 animate-in fade-in duration-300">
                <div className="flex-1 text-left space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md text-[11px] font-semibold">
                      감성 배경음악
                    </span>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md text-[11px] font-semibold">
                      BGM & 바이닐
                    </span>
                  </div>

                  <h3 className="font-editorial-title text-xl sm:text-2xl lg:text-3xl text-gray-900 font-bold leading-snug">
                    영화 같은 음악으로,<br />
                    두 사람의 분위기를 채우세요
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
                    화면 상단에서 잔잔하게 회전하는 LP 바이닐과 함께, 엄선된 피아노 멜로디가 흘러나옵니다. 하객들이 부담 없이 들을 수 있도록 자동 재생 및 볼륨 조절을 완벽하게 지원합니다.
                  </p>

                  <ul className="space-y-2 pt-1 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      <span>감성 클래식 & 피아노 BGM 프리셋 기본 제공</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      <span>두 사람만의 특별한 추억이 담긴 커스텀 MP3 음원 지원</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      <span>아날로그 바이닐 LP 턴테이블 회전 모션 탑재</span>
                    </li>
                  </ul>
                </div>

                {/* 바이닐 LP 플레이어 그래픽 */}
                <div className="w-full sm:w-[300px] shrink-0">
                  <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 text-center space-y-3.5">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="w-full h-full rounded-full bg-stone-900 border-4 border-stone-800 shadow-xl flex items-center justify-center animate-[spin_8s_linear_infinite]">
                        <div className="w-24 h-24 rounded-full border border-stone-700 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border border-stone-600 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-stone-900 flex items-center justify-center text-[7px] font-mono font-bold text-stone-900">
                              MUKIRU
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-6 h-14 border-r-2 border-stone-400 rotate-12" />
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block">
                        NOW PLAYING
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                        A Thousand Years (Piano Ver.)
                      </h4>
                      <p className="text-[10px] text-gray-500 font-light mt-0.5">
                        ATELIER DE MUKIRU SOUNDTRACK
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-gray-700 text-sm pt-0.5">
                      <span className="text-xs">⏮</span>
                      <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] shadow-xs">
                        ⏸
                      </div>
                      <span className="text-xs">⏭</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
