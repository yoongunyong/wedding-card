import Link from 'next/link';

export const metadata = {
  title: '서비스 이용약관 — 아틀리에 드 무키루 (ATELIER DE MUKIRU)',
  description: '아틀리에 드 무키루 모바일 청첩장 서비스 이용약관입니다.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans antialiased py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-8">
        
        {/* 상단 헤더 */}
        <div className="border-b border-slate-100 pb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs font-mono tracking-widest text-slate-400 uppercase hover:text-amber-800 transition-colors block mb-1">
              ← ATELIER DE MUKIRU 홈으로
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              서비스 이용약관
            </h1>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
            시행일: 2026. 10. 01
          </span>
        </div>

        {/* 본문 약관 조항 */}
        <div className="space-y-6 text-xs sm:text-[13px] text-slate-600 leading-relaxed break-keep">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">제1조 (목적)</h2>
            <p>
              본 약관은 &apos;친절한 꺼묵이네&apos;(이하 &apos;회사&apos;)가 운영하는 모바일 청첩장 웹서비스 &apos;아틀리에 드 무키루 (ATELIER DE MUKIRU)&apos;(이하 &apos;서비스&apos;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">제2조 (용어의 정의)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>&apos;서비스&apos;란 회사가 제공하는 모바일 청첩장 제작, 미리보기, 수정, 하객 참석 관리(RSVP), 방명록 및 호스팅 서비스를 의미합니다.</li>
              <li>&apos;이용자&apos;란 본 약관에 동의하고 서비스를 이용하여 모바일 청첩장을 제작하거나 열람하는 회원 및 비회원을 말합니다.</li>
              <li>&apos;인증코드/결제&apos;란 청첩장의 워터마크를 제거하고 정식 서비스를 개시하기 위해 회사가 발급하거나 구매한 1회용 등록 코드를 의미합니다.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">제3조 (서비스의 제공 및 변경)</h2>
            <p>
              회사는 이용자에게 다음과 같은 서비스를 제공합니다:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>온라인 모바일 청첩장 디자인 템플릿(5종) 선택 및 실시간 커스텀 제작</li>
              <li>하객 참석 여부(RSVP) 및 축하 방명록 관리, 하객 포토스냅 업로드/다운로드</li>
              <li>인쇄용 고해상도 QR코드 생성 및 다운로드</li>
              <li>예식 종료 후 최소 1년간의 안전한 웹 호스팅 보관 서비스</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">제4조 (이용자의 의무 및 저작권)</h2>
            <p>
              이용자는 서비스에 업로드하는 사진, 문구, 음원 등의 콘텐츠가 제3자의 저작권, 초상권 또는 기타 권리를 침해하지 않도록 해야 하며, 미풍양속을 해치거나 불법적인 내용을 게시하여서는 안 됩니다. 회사가 제공하는 템플릿 디자인 및 레이아웃에 대한 지식재산권은 회사에 귀속됩니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">제5조 (청약철회 및 환불 정책)</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>본 서비스는 디지털 맞춤형 콘텐츠 특성상, <strong>인증코드를 등록하여 워터마크가 제거되고 정식 서비스 링크가 활성화된 이후에는 전자상거래법 제17조 제2항에 따라 원칙적으로 청약철회 및 환불이 제한</strong>됩니다.</li>
              <li>단, 회사의 시스템 오류나 서버 장애로 인해 서비스를 정상적으로 이용할 수 없는 중대한 결함이 발생한 경우 전액 환불 조치합니다.</li>
              <li>인증코드를 사용하지 않은 미사용 주문 건은 구매처(스마트스토어 등)의 규정에 따라 7일 이내 환불이 가능합니다.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">제6조 (면책 조항)</h2>
            <p>
              회사는 천재지변, 기간통신사업자의 회선 장애 또는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다. 또한 이용자가 기재한 정보의 오류로 인한 불이익에 대해서는 회사가 책임을 지지 않습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">제7조 (분쟁 해결 및 관할 법원)</h2>
            <p>
              서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁은 상호 원만한 협의를 거쳐 해결하며, 소송이 제기될 경우 회사의 본점 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
            </p>
          </section>

        </div>

        {/* 하단 홈 이동 버튼 */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
          >
            확인 및 메인으로
          </Link>
          <span className="text-[11px] text-slate-400">
            문의사항: yungunyong@naver.com
          </span>
        </div>

      </div>
    </div>
  );
}
