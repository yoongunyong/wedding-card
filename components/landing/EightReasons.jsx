export default function EightReasons() {
  const reasons = [
    {
      num: '01',
      title: '사진 한 장도, 가장 예쁘게',
      desc: '클래식, 매거진 룩북, 바이닐 플레이리스트 등 5가지 테마로 어떤 사진을 올려도 분위기 있게 완성됩니다.',
    },
    {
      num: '02',
      title: '혼주와 어르신도 편하게 읽히도록',
      desc: '작아서 안 보이는 글씨는 지양합니다. 편안한 서체와 넉넉한 글자 크기, 직관적인 버튼으로 모든 세대를 배려했습니다.',
    },
    {
      num: '03',
      title: '받는 사람 입장에서 만듭니다',
      desc: '하객이 청첩장을 열었을 때 복잡함 없이 예식 일시, 장소, 교통편, 식권 안내를 한눈에 파악할 수 있도록 설계했습니다.',
    },
    {
      num: '04',
      title: '소중한 분께 진심을 전하는 구성',
      desc: '정갈한 모시는 글부터 두 사람만의 러브스토리를 담은 문답 인터뷰까지 감동을 전하는 디테일을 담았습니다.',
    },
    {
      num: '05',
      title: '길 찾기가 쉬워집니다',
      desc: '예식장 주소만 입력하면 카카오 지도와 네이버지도, 카카오내비 길안내 버튼이 자동으로 완벽 연동됩니다.',
    },
    {
      num: '06',
      title: '하객 정리는 무키루가 대신합니다',
      desc: '참석 여부(RSVP), 식사 여부, 전세버스 탑승 인원이 실시간으로 집계되며, 웨딩홀 제출용 엑셀로 한 번에 다운로드됩니다.',
    },
    {
      num: '07',
      title: '숨은 비용은 하나도 없습니다',
      desc: 'BGM 추가비, 갤러리 추가비, 기능별 옵션 장사 없이 모든 프리미엄 기능을 단일 가격으로 투명하게 제공합니다.',
    },
    {
      num: '08',
      title: '소중한 날의 기록, 영구 보관',
      desc: '예식이 끝난 후에도 축하 방명록과 아름다운 웨딩 화보를 언제든 다시 꺼내보실 수 있도록 안전하게 보관해 드립니다.',
    },
  ];

  return (
    <section className="py-20 sm:py-24 px-4 bg-[#F8F9FA] border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
            THE 8 PRINCIPLES
          </p>
          <h2 className="font-editorial-title text-2xl sm:text-4xl text-gray-900 font-bold tracking-tight">
            잘 만든 모바일 청첩장,<br />
            다 이유가 있어요
          </h2>
        </div>

        <div className="space-y-3.5">
          {reasons.map((item) => (
            <div
              key={item.num}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:border-gray-300 transition-all flex items-start gap-4 sm:gap-5"
            >
              <span className="font-mono text-xs sm:text-sm font-bold text-gray-400 shrink-0 w-7 pt-0.5">
                {item.num}
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
