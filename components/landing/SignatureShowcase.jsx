'use client';

import { useState } from 'react';

export default function SignatureShowcase() {
  const [openingType, setOpeningType] = useState('A');

  return (
    <section className="py-20 sm:py-28 px-4 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto space-y-24">
        {/* 섹션 도입 헤더 */}
        <div className="text-center max-w-xl mx-auto">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[11px] font-mono tracking-widest uppercase font-semibold mb-3">
            SIGNATURE EXPERIENCES
          </span>
          <h2 className="font-editorial-title text-3xl sm:text-4xl text-gray-900 font-bold tracking-tight leading-tight">
            청첩장 하나로,<br />
            결혼식 준비의 품격이 달라집니다
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-gray-500 font-light">
            하객들이 청첩장을 열어보는 첫 순간부터 예식 당일 식장에 도착할 때까지,<br className="hidden sm:inline" />
            무키루만의 감각적인 시그니처 연출을 경험해 보세요.
          </p>
        </div>

        {/* 쇼케이스 1: 오프닝 애니메이션 (데어무드 스타일) */}
        <div className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-10 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 shadow-xs">
          <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-semibold">
                오프닝 연출
              </span>
              <span className="px-2.5 py-1 bg-amber-100/70 text-amber-900 rounded-md text-[11px] font-semibold">
                ★ 시그니처 기능
              </span>
            </div>

            <h3 className="font-editorial-title text-2xl sm:text-3xl text-gray-900 font-bold leading-snug">
              열리는 순간, 시선을<br />
              사로잡는 감각적인 연출
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
              링크를 누르는 순간 단순한 웹페이지가 아닌, 고급 실물 편지 봉투가 부드럽게 열리며 두 사람의 웨딩 화보가 감성적으로 나타납니다.
            </p>

            <div className="pt-2">
              <span className="text-[11px] font-medium text-gray-400 block mb-2">
                연출 스타일 선택 가능 (ON/OFF 지원)
              </span>
              <div className="inline-flex p-1 bg-white rounded-xl border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setOpeningType('A')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    openingType === 'A'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  편지봉투 개봉 (타입 A)
                </button>
                <button
                  type="button"
                  onClick={() => setOpeningType('B')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    openingType === 'B'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  소프트 페이드 (타입 B)
                </button>
              </div>
            </div>
          </div>

          {/* 모바일 목업 그래픽 */}
          <div className="w-full sm:w-[280px] shrink-0">
            <div className="relative aspect-[9/16] bg-white rounded-3xl p-3 shadow-xl border border-gray-200/80 overflow-hidden flex flex-col justify-between">
              {/* 스마트폰 노치 & 상단바 */}
              <div className="flex justify-between items-center px-2 pt-1 text-[10px] text-gray-400 font-mono">
                <span>12:30</span>
                <div className="w-12 h-3.5 bg-gray-900 rounded-full" />
                <span>5G 100%</span>
              </div>

              {/* 봉투 인터랙션 프리뷰 카드 */}
              <div className="my-auto relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-100 flex items-center justify-center border border-gray-100">
                <img
                  src="/samples/editorial-cover.jpg"
                  alt="오프닝 화보"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl mb-2 animate-bounce">
                    ✉️
                  </div>
                  <span className="font-editorial-serif text-sm tracking-widest uppercase">
                    INVITATION
                  </span>
                  <p className="text-[10px] text-white/80 mt-1">
                    {openingType === 'A' ? '봉투를 터치하여 열어보세요' : '우아하게 나타나는 페이드 효과'}
                  </p>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 font-mono pb-1">
                ATELIER DE MUKIRU
              </div>
            </div>
          </div>
        </div>

        {/* 쇼케이스 2: 스마트 참석 확인 (RSVP + 엑셀 정리 0분) */}
        <div className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-10 border border-gray-100 flex flex-col md:flex-row-reverse items-center justify-between gap-8 sm:gap-12 shadow-xs">
          <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-semibold">
                스마트 RSVP
              </span>
              <span className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded-md text-[11px] font-semibold">
                엑셀 정리 0분
              </span>
            </div>

            <h3 className="font-editorial-title text-2xl sm:text-3xl text-gray-900 font-bold leading-snug">
              엑셀 정리는 그만,<br />
              응답과 집계를 자동으로 관리하세요
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
              신랑·신부측 참석 여부, 식사 인원, 대절버스 탑승까지 하객들이 입력하면 실시간으로 자동 분류 집계됩니다. 예식장 식대 정산 시 엑셀(CSV) 한 번으로 즉시 다운로드하세요.
            </p>

            <ul className="space-y-2 pt-2 text-xs text-gray-600">
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

          {/* RSVP 대시보드 그래픽 (데어무드 영상 그대로 재현) */}
          <div className="w-full sm:w-[320px] shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 space-y-4 text-left">
              {/* 상단 통계 바 */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-semibold text-gray-500">전체 응답</span>
                <span className="text-xl font-bold font-mono text-gray-900">128건</span>
              </div>

              {/* 통계 지표 그리드 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-emerald-50/70 rounded-xl flex items-center justify-between">
                  <span className="text-emerald-800 font-medium">참석</span>
                  <span className="font-bold text-emerald-900 font-mono text-sm">96명</span>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-xl flex items-center justify-between">
                  <span className="text-blue-800 font-medium">식사</span>
                  <span className="font-bold text-blue-900 font-mono text-sm">88명</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-600 font-medium">대절버스</span>
                  <span className="font-bold text-gray-900 font-mono text-sm">24명</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-600 font-medium">불참</span>
                  <span className="font-bold text-gray-400 font-mono text-sm">32명</span>
                </div>
              </div>

              {/* 응답자 명단 미리보기 */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50 text-gray-600">
                  <span className="font-medium text-gray-900">신랑측 김○○</span>
                  <span className="text-emerald-600 font-medium">참석 • 2명 (식사 O)</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-50 text-gray-600">
                  <span className="font-medium text-gray-900">신부측 이○○</span>
                  <span className="text-emerald-600 font-medium">참석 • 1명 (식사 X)</span>
                </div>
              </div>

              {/* 엑셀 다운로드 버튼 */}
              <div className="pt-1">
                <div className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs">
                  <span>📊</span>
                  <span>엑셀(CSV) 다운로드</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 쇼케이스 3: 예식 당일 안내 데스크 자동 전환 (하객나우 스타일) */}
        <div className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-10 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 shadow-xs">
          <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-[11px] font-semibold">
                예식 당일 자동 전환
              </span>
              <span className="px-2.5 py-1 bg-amber-100/70 text-amber-900 rounded-md text-[11px] font-semibold">
                하객 배려 100%
              </span>
            </div>

            <h3 className="font-editorial-title text-2xl sm:text-3xl text-gray-900 font-bold leading-snug">
              예식 당일,<br />
              청첩장이 안내 데스크가 됩니다
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
              결혼식 당일 하객이 청첩장 링크를 다시 열면, 길고 복잡한 내용 대신 <strong className="text-gray-900 font-medium">"예식 시작까지 남은 시간"</strong>과 <strong className="text-gray-900 font-medium">"내비게이션 길안내"</strong> 버튼이 상단에 자동으로 큼직하게 전환됩니다.
            </p>

            <ul className="space-y-2 pt-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>실시간 디데이 카운트다운 (예식 시작까지 남은 시간)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>네이버지도 • 티맵 • 카카오내비 원클릭 자동 연동</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>주차 안내 및 ATM 위치 한눈에 확인</span>
              </li>
            </ul>
          </div>

          {/* 당일 안내 데스크 그래픽 카드 */}
          <div className="w-full sm:w-[320px] shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200 space-y-4 text-left">
              {/* D-Day 당일 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-600 font-bold uppercase block">
                    TODAY WEDDING
                  </span>
                  <span className="text-sm font-serif font-bold text-gray-900">
                    김도현 ♥ 이서연
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">
                  당일 자동 모드
                </span>
              </div>

              {/* 예식 시작까지 카운트다운 박스 */}
              <div className="p-3.5 bg-gray-900 text-white rounded-xl text-center">
                <span className="text-[11px] text-gray-400 block mb-0.5">예식 시작까지</span>
                <span className="text-lg font-bold font-mono tracking-wider text-amber-300">
                  1시간 24분 전
                </span>
              </div>

              {/* 내비게이션 3종 버튼 */}
              <div className="space-y-2">
                <div className="w-full py-2 px-3 bg-[#03C75A] text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                  <span>Naver Map 네이버지도</span>
                  <span className="text-[11px] font-mono">연결하기 ➔</span>
                </div>
                <div className="w-full py-2 px-3 bg-[#E61C24] text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                  <span>T map 티맵 길안내</span>
                  <span className="text-[11px] font-mono">연결하기 ➔</span>
                </div>
                <div className="w-full py-2 px-3 bg-[#FEE500] text-gray-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                  <span>Kakao Navi 카카오내비</span>
                  <span className="text-[11px] font-mono">연결하기 ➔</span>
                </div>
              </div>

              {/* 편의시설 태그 */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-md">🅿️ 주차 2시간 무료</span>
                <span className="px-2 py-1 bg-gray-100 rounded-md">🏧 ATM 지하 1층</span>
              </div>
            </div>
          </div>
        </div>

        {/* 쇼케이스 4: 감성 BGM & 바이닐 플레이어 */}
        <div className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-10 border border-gray-100 flex flex-col md:flex-row-reverse items-center justify-between gap-8 sm:gap-12 shadow-xs">
          <div className="flex-1 text-left space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-stone-200 text-stone-800 rounded-md text-[11px] font-semibold">
                감성 배경음악
              </span>
              <span className="px-2.5 py-1 bg-amber-100/70 text-amber-900 rounded-md text-[11px] font-semibold">
                BGM & 바이닐
              </span>
            </div>

            <h3 className="font-editorial-title text-2xl sm:text-3xl text-gray-900 font-bold leading-snug">
              영화 같은 음악으로,<br />
              두 사람의 분위기를 채우세요
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
              화면 상단에서 잔잔하게 회전하는 LP 바이닐과 함께, 엄선된 피아노 멜로디가 흘러나옵니다. 하객들이 부담 없이 들을 수 있도록 자동 재생 및 볼륨 조절을 완벽하게 지원합니다.
            </p>

            <ul className="space-y-2 pt-2 text-xs text-gray-600">
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
          <div className="w-full sm:w-[320px] shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 text-center space-y-4">
              <div className="relative w-36 h-36 mx-auto">
                {/* LP 디스크 원형 */}
                <div className="w-full h-full rounded-full bg-stone-900 border-4 border-stone-800 shadow-xl flex items-center justify-center animate-[spin_8s_linear_infinite]">
                  {/* LP 홈 그루브 효과 */}
                  <div className="w-28 h-28 rounded-full border border-stone-700 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-stone-600 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-amber-200 border-2 border-stone-900 flex items-center justify-center text-[8px] font-mono font-bold text-stone-900">
                        MUKIRU
                      </div>
                    </div>
                  </div>
                </div>
                {/* 톤암 */}
                <div className="absolute top-0 right-0 w-8 h-16 border-r-2 border-stone-400 rotate-12" />
              </div>

              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                  NOW PLAYING
                </span>
                <h4 className="text-sm font-semibold text-gray-900">
                  A Thousand Years (Piano Ver.)
                </h4>
                <p className="text-[11px] text-gray-500 font-light mt-0.5">
                  ATELIER DE MUKIRU SOUNDTRACK
                </p>
              </div>

              {/* 재생 컨트롤러 */}
              <div className="flex items-center justify-center gap-4 text-gray-700 text-sm pt-1">
                <span>⏮</span>
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs shadow-xs">
                  ⏸
                </div>
                <span>⏭</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
