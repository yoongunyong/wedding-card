import Link from 'next/link';

export default function TrustSection() {
  return (
    <section className="py-16 sm:py-24 px-4 bg-white border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* 상단 헤더 & 평점 배지 */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase mb-2">
            WHY ATELIER DE MUKIRU
          </p>
          <h2 className="font-editorial-title text-2xl sm:text-4xl text-gray-900 font-bold tracking-tight">
            결제는 마지막에,<br className="sm:hidden" /> 확인은 지금 바로.
          </h2>
          <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 rounded-full border border-amber-200/80 text-amber-950 text-xs font-medium shadow-2xs">
            <span className="text-amber-500 font-bold">★ 4.98</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-700">만족도 99% 신랑·신부의 선택</span>
          </div>
        </div>

        {/* 3대 핵심 혜택 카드 그리드 (데어무드 스타일) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 카드 1: 무료 시안 제작 */}
          <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-gray-200/70 shadow-xs flex flex-col justify-between hover:border-gray-400 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-sm font-bold mb-4 font-mono">
                01
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-white text-gray-800 rounded-md text-[10px] font-bold border border-gray-200 mb-2">
                무료 100% 체험
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                구매 전, 무료로 시안 제작
              </h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                시작은 무료 시안으로, 선택은 마음에 들 때 하세요. 사진과 문구를 넣고 실시간 미리보기까지 비용 없이 먼저 완성해 볼 수 있습니다.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200/60">
              <Link
                href="/create"
                className="text-xs font-bold text-gray-900 hover:text-amber-600 transition-colors inline-flex items-center gap-1"
              >
                <span>무료 시안 제작하기</span>
                <span>➔</span>
              </Link>
            </div>
          </div>

          {/* 카드 2: 무제한 수정 */}
          <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-gray-200/70 shadow-xs flex flex-col justify-between hover:border-gray-400 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-800 flex items-center justify-center text-sm font-bold mb-4 font-mono">
                02
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-white text-gray-800 rounded-md text-[10px] font-bold border border-gray-200 mb-2">
                예식 당일까지 안심
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                구매 후에도 무제한 수정
              </h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                식전까지 시간 변경, 사진 교체, 계좌번호 및 인사말 수정이 언제든 자유롭습니다. 변경 사항은 청첩장 링크에 1초 만에 실시간 반영됩니다.
              </p>
            </div>
            {/* 미니 토글 UI 그래픽 */}
            <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
              <span>수정 횟수 제한</span>
              <span className="font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-full text-[10px]">무제한</span>
            </div>
          </div>

          {/* 카드 3: 종이 청첩장 QR & 공유 */}
          <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-gray-200/70 shadow-xs flex flex-col justify-between hover:border-gray-400 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-200 text-gray-800 flex items-center justify-center text-sm font-bold mb-4 font-mono">
                03
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-white text-gray-800 rounded-md text-[10px] font-bold border border-gray-200 mb-2">
                인쇄용 고해상도 벡터
              </span>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                종이 청첩장용 QR코드 무료
              </h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                종이 청첩장 봉투나 식권, 테이블 텐트카드에 깨짐 없이 선명하게 인쇄할 수 있는 고해상도 QR코드를 원클릭으로 다운로드해 드립니다.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
              <span>다운로드 포맷</span>
              <span className="font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-full text-[10px]">PNG / SVG</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
