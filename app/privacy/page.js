import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 — 아틀리에 드 무키루 (ATELIER DE MUKIRU)',
  description: '아틀리에 드 무키루 모바일 청첩장 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
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
              개인정보처리방침
            </h1>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
            시행일: 2026. 10. 01
          </span>
        </div>

        {/* 본문 조항 */}
        <div className="space-y-6 text-xs sm:text-[13px] text-slate-600 leading-relaxed break-keep">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">1. 총칙</h2>
            <p>
              &apos;친절한 꺼묵이네&apos;(이하 &apos;회사&apos;)는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 본 방침은 회사가 제공하는 &apos;아틀리에 드 무키루&apos; 모바일 청첩장 서비스에 적용됩니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">2. 처리하는 개인정보의 항목 및 수집 목적</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">구분</th>
                    <th className="p-3">수집 항목</th>
                    <th className="p-3">수집 및 이용 목적</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11.5px]">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">신랑·신부 (제작자)</td>
                    <td className="p-3">신랑/신부 성함, 연락처, 혼주 성함/연락처, 예식일시, 예식장소, 축의금 계좌번호, 웨딩 사진</td>
                    <td className="p-3">모바일 청첩장 제작, 호스팅 제공 및 수정/관리 권한 인증</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">하객 (방문자)</td>
                    <td className="p-3">성함, 전화번호 뒤 4자리(또는 연락처), 참석 여부(RSVP), 동반인원, 식사여부, 방명록 축하 메시지, 하객 포토스냅 사진</td>
                    <td className="p-3">하객 참석 현황 집계 및 신랑·신부 전달, 방명록 게시 및 본인 삭제 인증</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">3. 개인정보의 보유 및 이용 기간</h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>제작된 청첩장 데이터는 <strong>예식일로부터 최소 1년간 안전하게 보관</strong>되며, 신랑·신부의 요청 시 관리자 페이지 또는 고객센터를 통해 즉시 영구 삭제할 수 있습니다.</li>
              <li>하객이 남긴 방명록 및 참석 정보는 신랑·신부의 청첩장 보관 기간과 동일하게 유지되며, 청첩장 삭제 시 연결된 모든 데이터(스토리지 사진 포함)는 영구 파기됩니다.</li>
              <li>전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령에 따라 보존할 필요가 있는 경우, 해당 법령에서 정한 기간 동안 보관합니다 (계약 또는 청약철회 등에 관한 기록: 5년).</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">4. 개인정보의 제3자 제공 및 위탁</h2>
            <p>
              회사는 이용자의 개인정보를 제3자에게 무단 제공하거나 마케팅 목적으로 활용하지 않습니다. 단, 서비스의 원활한 기술적 인프라 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>수탁자:</strong> Supabase Inc., Vercel Inc.</li>
              <li><strong>위탁 업무:</strong> 클라우드 데이터베이스 저장, 암호화 호스팅 및 파일 스토리지 인프라 운영</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">5. 정보주체의 권리·의무 및 행사 방법</h2>
            <p>
              이용자는 언제든지 등록되어 있는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다. 신랑·신부는 전용 관리 링크(`/manage/[slug]`)를 통해 언제든 사진, 문구, 참석자 정보를 직접 수정/삭제할 수 있으며, 카카오톡 1:1 고객센터를 통해서도 요청하실 수 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">6. 개인정보의 안전성 확보 조치</h2>
            <p>
              회사는 개인정보의 분실, 도난, 유출을 방지하기 위하여 전송 구간 SSL 암호화(HTTPS), 관리자 2단계 PIN 비밀번호 인증, 스토리지 접근 격리 제어, 방명록 열람 시 비밀번호 해시 마스킹 등 철저한 보안 조치를 이행하고 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0f172a]">7. 개인정보 보호책임자</h2>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1 text-[11.5px]">
              <p><strong>성명:</strong> 윤건용</p>
              <p><strong>직책 / 소속:</strong> 대표 / 친절한 꺼묵이네</p>
              <p><strong>연락처 / 이메일:</strong> yungunyong@naver.com (카카오톡 채널 &apos;아틀리에 드 무키루&apos;)</p>
            </div>
          </section>

        </div>

        {/* 하단 버튼 */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link
            href="/"
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
          >
            확인 및 메인으로
          </Link>
          <span className="text-[11px] text-slate-400">
            아틀리에 드 무키루 드림
          </span>
        </div>

      </div>
    </div>
  );
}
