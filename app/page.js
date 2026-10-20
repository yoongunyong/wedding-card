import Link from 'next/link';

export const metadata = {
  title: '아틀리에 드 무키루 (ATELIER DE MUKIRU) — 감성 모바일 청첩장',
  description: '단 하나의 소중한 순간을 담은 프리미엄 모바일 청첩장. 모던 클래식, 에디토리얼 룩북, 플레이리스트 바이닐, 시네마틱 모노리스, 모던 씬 등 5가지 감각의 디자인 시안을 경험해 보세요.',
};

export default function HomePage() {
  const templates = [
    {
      id: 'basic',
      option: 'OPTION 01',
      title: '모던 클래식',
      subTitle: 'Modern Classic',
      badge: '스테디셀러',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      description: '부드러운 편지 봉투 오프닝 카드와 크림 베이지 톤의 정갈하고 따뜻한 시안입니다. 남녀노소 모든 하객분들께 단아하고 기품 있는 첫인상을 전합니다.',
      features: ['편지 봉투 개봉 오프닝', 'D-Day 카운트다운 타이머', '감성 블러 화보 갤러리', '식권·화환 안내 카드'],
      previewUrl: '/basic',
      accentColor: '#D97706',
    },
    {
      id: 'editorial',
      option: 'OPTION 02',
      title: '클래식 에디토리얼',
      subTitle: 'Editorial Lookbook',
      badge: '추천 디자인',
      badgeColor: 'bg-stone-200 text-stone-900 border-stone-300',
      description: '패션 하우스 매거진의 한 페이지처럼 감각적인 세리프 타이포그래피와 모던한 룩북 칼럼으로 두 사람의 특별한 이야기를 잡지처럼 연출합니다.',
      features: ['매거진 북마크 인용구', '미니멀 흑백 감성 보정', '바코드 & 판권지 백커버', '에디토리얼 팝업 모달'],
      previewUrl: '/editorial',
      accentColor: '#1C1917',
    },
    {
      id: 'playlist',
      option: 'OPTION 03',
      title: '감성 플레이리스트',
      subTitle: 'Playlist & Vinyl',
      badge: '추천 디자인',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      description: 'LP 바이닐 턴테이블과 빈티지 폴라로이드 화보가 어우러진 음악 감성 시안입니다. 아날로그 레코드 플레이어와 감각적인 음악 무드로 특별한 웨딩을 연출합니다.',
      features: ['화이트 필기체 Getting Married', '빈티지 폴라로이드 손글씨', 'LP 바이닐 회전 애니메이션', '글래스모피즘 뮤직 플레이어'],
      previewUrl: '/playlist',
      accentColor: '#047857',
    },
    {
      id: 'cinematic',
      option: 'OPTION 04',
      title: '시네마틱 모노리스',
      subTitle: 'Cinematic Monolith',
      badge: '인기 시안',
      badgeColor: 'bg-stone-900 text-white border-stone-800',
      description: '☀️ Day / 🌙 Night 듀얼 무드 테마 스위처와 시네마틱 흑백 인물 스냅이 돋보이는 모노크롬 시안입니다. 영화 같은 깊은 감동을 선사합니다.',
      features: ['☀️ Day ↔ 🌙 Night 듀얼 테마', '시네마틱 흑백 커버 & 와이드 컷', '신랑·신부 2분할 인물 스냅', '탭형 시크 축의금 카드'],
      previewUrl: '/cinematic',
      accentColor: '#000000',
    },
    {
      id: 'scene',
      option: 'OPTION 05',
      title: '모던 씬 (Scene 02)',
      subTitle: 'Modern Elegance & Classic',
      badge: 'NEW 시안',
      badgeColor: 'bg-stone-900 text-white border-stone-800',
      description: '우아하고 차분한 모던 클래식 감성에 신랑·신부 인터뷰 Q&A 문답 바텀시트, 3열 캘린더 손그림 애니메이션, 식사/전세버스 확장 RSVP를 결합한 프리미엄 시안입니다.',
      features: ['신랑·신부 인터뷰 (우리의 이야기)', '3열 캘린더 & 빨간 원형 애니메이션', '확장형 RSVP (식사 & 전세버스)', '2열 인물 스냅 & 와이드 갤러리'],
      previewUrl: '/scene',
      accentColor: '#333333',
    },
  ];

  const highlights = [
    {
      icon: '✨',
      title: '식전까지 무제한 실시간 수정',
      desc: '예식 전까지 사진, 모시는 글, 계좌번호 등을 언제든 신랑·신부님이 직접 수정하실 수 있습니다.',
    },
    {
      icon: '📷',
      title: '인쇄용 종이 QR코드 무료 제공',
      desc: '종이 청첩장 봉투나 식권에 인쇄할 수 있는 고해상도 벡터 QR코드를 원클릭으로 다운로드해 드립니다.',
    },
    {
      icon: '📊',
      title: '하객 참석(RSVP) 엑셀 다운로드',
      desc: '식사 인원과 참석 여부를 스마트하게 집계하고, 식장 제출용 엑셀(CSV) 파일로 한 번에 내려받으실 수 있습니다.',
    },
    {
      icon: '🗺️',
      title: '지도 & 원터치 내비게이션 연동',
      desc: '카카오 지도 탑재는 물론, 카카오내비·네이버지도 길안내 버튼으로 하객분들의 편안한 방문을 돕습니다.',
    },
    {
      icon: '🎵',
      title: '감성 BGM & 맞춤 음원 지원',
      desc: '엄선된 고품질 피아노 멜로디 프리셋부터, 두 사람만의 특별한 커스텀 음원 파일(MP3) 업로드까지 완벽 지원합니다.',
    },
    {
      icon: '💎',
      title: '평생 소장 가능한 영구 보관',
      desc: '예식이 끝난 후에도 소중한 순간과 하객들의 축하 방명록을 언제든 꺼내보실 수 있도록 영구 보관해 드립니다.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF7] text-stone-900 font-sans selection:bg-stone-200 antialiased">
      {/* 1. 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-50 bg-[#FCFBF7]/90 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col text-left">
            <span className="font-editorial-serif text-[18px] sm:text-[20px] tracking-[0.2em] font-medium uppercase text-stone-900">
              ATELIER DE MUKIRU
            </span>
            <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase -mt-0.5">
              BOUTIQUE WEDDING CARD
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="#templates"
              className="text-xs text-stone-500 hover:text-stone-900 transition-colors hidden sm:inline"
            >
              시안 5종 둘러보기
            </a>
            <Link
              href="/create"
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-full shadow-xs transition-all active:scale-95"
            >
              청첩장 제작하기
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 메인 히어로 섹션 */}
      <section className="pt-20 sm:pt-28 pb-16 sm:pb-24 px-6 text-center max-w-4xl mx-auto">
        <span className="inline-block px-3 py-1 bg-stone-200/60 text-stone-600 rounded-full text-xs font-mono tracking-widest uppercase font-semibold mb-6">
          THE ART OF ETERNAL MOMENTS
        </span>
        <h1 className="font-editorial-title text-4xl sm:text-6xl text-stone-900 font-normal leading-[1.15] tracking-tight mb-6">
          단 하나의 소중한 순간을 담은<br className="hidden sm:inline" /> 감성 모바일 청첩장
        </h1>
        <p className="font-serif text-sm sm:text-base text-stone-600 leading-relaxed font-light max-w-xl mx-auto mb-10 break-keep">
          형식적인 템플릿을 넘어, 두 사람의 취향과 분위기에 맞춘 독보적인 감각.<br className="hidden sm:inline" />
          마치 영화나 잡지, 바이닐 음반을 펼치듯 완성도 높은 다섯 가지 시안을 직접 스마트폰으로 경험해 보세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
          <Link
            href="/create"
            className="w-full sm:w-auto px-7 py-3.5 bg-stone-900 hover:bg-black text-white text-sm font-medium rounded-xl shadow-md transition-all active:scale-95"
          >
            청첩장 셀프 제작 신청하기 ➔
          </Link>
          <a
            href="#templates"
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-stone-50 text-stone-800 text-sm font-medium rounded-xl border border-stone-200/80 shadow-2xs transition-all"
          >
            시안 5종 둘러보기 ↓
          </a>
        </div>
      </section>

      {/* 3. 디자인 시안 5종 쇼케이스 섹션 */}
      <section id="templates" className="py-20 px-6 bg-white border-y border-stone-200/80 scroll-mt-14">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-mono text-xs text-stone-400 tracking-[0.25em] uppercase font-semibold block mb-2">
              CURATED TEMPLATES
            </span>
            <h2 className="font-editorial-title text-3xl sm:text-4xl text-stone-900 font-normal">
              다섯 가지 감각의 디자인 시안
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-2">
              버튼을 누르시면 실제 하객들이 열어보는 청첩장 화면을 그대로 체험하실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-[#FCFBF7] rounded-3xl p-7 border border-stone-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono tracking-widest text-stone-500 uppercase font-semibold">
                      {tpl.option}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${tpl.badgeColor}`}>
                      {tpl.badge}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl text-stone-900 font-normal mb-1">
                    {tpl.title}
                  </h3>
                  <p className="font-editorial-serif text-xs text-stone-400 tracking-wider uppercase mb-4">
                    {tpl.subTitle}
                  </p>

                  <p className="text-xs text-stone-600 leading-relaxed font-light mb-6 break-keep">
                    {tpl.description}
                  </p>

                  <div className="space-y-2 mb-8 pt-4 border-t border-stone-200/60 text-xs text-stone-700">
                    {tpl.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-stone-400 text-[10px]">✔</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Link
                    href={tpl.previewUrl}
                    target="_blank"
                    className="w-full py-3 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                  >
                    <span>실제 시안 체험하기</span>
                    <span className="text-[10px] opacity-70">↗</span>
                  </Link>
                  <Link
                    href={`/create?template=${tpl.id}`}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl flex items-center justify-center transition-colors"
                  >
                    이 시안으로 제작 신청
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* 디자인 저작권 보호 안내 배너 */}
          <div className="mt-14 p-5 sm:p-6 bg-[#FAF9F5] border border-stone-200/90 rounded-2xl text-center max-w-2xl mx-auto shadow-2xs">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold block mb-1.5">
              DESIGN INTELLECTUAL PROPERTY NOTICE
            </span>
            <p className="text-xs text-stone-600 font-light leading-relaxed break-keep">
              <strong className="text-stone-800 font-medium">ATELIER DE MUKIRU</strong>의 모든 모바일 청첩장 시안(1~5종) 및 인터랙션 모션, UI 레이아웃은 저작권법의 보호를 받는 고유 창작물입니다.<br className="hidden sm:inline" />
              무단 복제, 유사 디자인 도용 및 상업적 무단 배포 시 민·형사상 법적 조치가 진행될 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 프리미엄 기능 하이라이트 (고객 신뢰 섹션) */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="font-mono text-xs text-stone-400 tracking-[0.25em] uppercase font-semibold block mb-2">
            WHY ATELIER DE MUKIRU
          </span>
          <h2 className="font-editorial-title text-3xl sm:text-4xl text-stone-900 font-normal">
            더 안심되고 편리한 웨딩 서비스
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light mt-2">
            단 한 번뿐인 예식을 위해 세심하게 설계된 스마트 기능들을 모두 무료로 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="p-6 bg-white rounded-2xl border border-stone-200/70 shadow-2xs text-left"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="text-[15px] font-semibold text-stone-900 mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed break-keep">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 간단한 3단계 제작 프로세스 안내 */}
      <section className="py-16 px-6 bg-stone-100/70 border-t border-stone-200/80 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="font-mono text-xs text-stone-400 tracking-widest uppercase font-semibold block mb-2">
            HOW IT WORKS
          </span>
          <h2 className="font-editorial-title text-2xl sm:text-3xl text-stone-900 font-normal mb-10">
            누구나 3분 만에 완성하는 간편한 제작
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 bg-white rounded-2xl border border-stone-200/70 shadow-xs">
              <span className="font-mono text-xs text-stone-400 font-bold block mb-1">STEP 01</span>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">주문 및 코드 발급</h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                스마트스토어 주문 후 발급된 1회용 인증코드를 준비합니다.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200/70 shadow-xs">
              <span className="font-mono text-xs text-stone-400 font-bold block mb-1">STEP 02</span>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">예식 정보 & 사진 입력</h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                실시간 미리보기를 보며 두 사람의 사진과 초대 문구를 입력합니다.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-stone-200/70 shadow-xs">
              <span className="font-mono text-xs text-stone-400 font-bold block mb-1">STEP 03</span>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">즉시 발급 & 자유로운 수정</h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                청첩장 링크와 QR코드가 즉시 완성되며, 예식 전까지 무제한 수정 가능합니다.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/create"
              className="inline-block px-8 py-4 bg-stone-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
            >
              지금 청첩장 제작 시작하기 ➔
            </Link>
          </div>
        </div>
      </section>

      {/* 6. 하단 푸터 */}
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
              <a href="#templates" className="hover:text-stone-200 transition-colors">
                시안 5종 둘러보기
              </a>
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

      {/* 카카오톡 1:1 상담 플로팅 버튼 */}
      <a
        href="http://pf.kakao.com/_RJamX/chat"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] px-4 py-2.5 rounded-full shadow-lg font-medium text-xs flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 border border-black/5"
        title="카카오톡 1:1 문의"
      >
        <svg className="w-4 h-4 fill-[#191919]" viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.94-.123.498.182.49.383.357.158-.105 2.515-1.71 3.535-2.404.516.074 1.045.113 1.592.113 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
        </svg>
        <span className="font-semibold text-[13px]">카카오톡 문의</span>
      </a>
    </div>
  );
}
