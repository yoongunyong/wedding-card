'use client';

import { useState } from 'react';
import ScrollReveal from '../ScrollReveal';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'convenience', label: '편의기능' },
  { id: 'design', label: '디자인·구성' },
  { id: 'share', label: '공유·안내' },
];

const FEATURES = [
  {
    category: 'convenience',
    icon: '📋',
    title: '스마트 RSVP (참석 여부)',
    desc: '신랑·신부측 구분, 참석 여부, 동행 인원, 식사, 대절버스를 실시간 자동 집계하고 웨딩홀 제출용 엑셀(CSV)로 다운로드합니다.',
    tags: ['보증인원 자동집계', '엑셀 원클릭 다운'],
  },
  {
    category: 'convenience',
    icon: '💳',
    title: '계좌번호 원터치 복사',
    desc: '신랑측·신부측 계좌를 깔끔한 아코디언으로 접고 펼치며, 계좌번호를 터치 한 번으로 클립보드에 복사합니다.',
    tags: ['카카오페이 송금', '원터치 복사'],
  },
  {
    category: 'convenience',
    icon: '✏️',
    title: '예식 전 무제한 무료 수정',
    desc: '예식 당일까지 모시는 글, 사진 순서, 예식 일시, 계좌번호 등을 전용 관리 링크에서 횟수 제한 없이 1초 만에 실시간 반영합니다.',
    tags: ['실시간 1초 반영', '수정 비용 0원'],
  },
  {
    category: 'design',
    icon: '✨',
    title: '5대 시그니처 오프닝',
    desc: 'iOS 정통 에어드랍, 패션 룩북 슬리브, 감성 플레이리스트 등 5가지 시안 고유의 감각적인 첫인상 오프닝을 제공합니다.',
    tags: ['시안별 고유 연출', 'ON/OFF 자유 설정'],
  },
  {
    category: 'design',
    icon: '🎨',
    title: '5가지 독창적인 템플릿',
    desc: '에어드랍, 에디토리얼, 플레이리스트, 시네마틱, 모던 씬 중 두 분의 웨딩 화보 무드에 꼭 맞는 디자인을 자유롭게 선택합니다.',
    tags: ['5대 공식 시안', '실시간 원클릭 변경'],
  },
  {
    category: 'design',
    icon: '🎵',
    title: '감성 배경음악 (BGM)',
    desc: '무키루 엄선 감성 피아노 멜로디 프리셋을 기본 제공하며, 두 사람만의 특별한 소장용 MP3 음원도 직접 업로드 가능합니다.',
    tags: ['피아노 프리셋', 'MP3 직접 등록'],
  },
  {
    category: 'design',
    icon: '📸',
    title: '프리미엄 웨딩 갤러리',
    desc: '고화질 웨딩 화보를 최대 30장까지 최적화하여 끊김 없이 빠르게 로딩하며, 하객 디바이스 확대 방지 뷰어를 지원합니다.',
    tags: ['최대 30장 지원', '화질 최적화 뷰어'],
  },
  {
    category: 'design',
    icon: '⏳',
    title: 'D-Day 카운트다운',
    desc: '예식일까지 남은 날짜와 시간을 실시간으로 정밀 계산하여 하객들에게 예식의 설렘과 기대감을 더합니다.',
    tags: ['D-Day 실시간 계산', 'D-Day 당일 전환'],
  },
  {
    category: 'share',
    icon: '💬',
    title: '카카오톡 맞춤 공유 카드',
    desc: '카카오톡으로 청첩장 링크를 공유할 때, 대표 사진과 두 사람의 성함, 예식 정보가 가장 예쁜 1:1 황금비율로 미리보기됩니다.',
    tags: ['카톡 맞춤 썸네일', '원클릭 간편 공유'],
  },
  {
    category: 'share',
    icon: '🗺️',
    title: '네이버 지도 · 카카오내비 길안내',
    desc: '인터랙티브 지도 렌더링은 물론, 네이버 지도 앱과 카카오내비로 원터치 즉시 길안내를 시작하여 하객의 편의를 극대화합니다.',
    tags: ['네이버지도 길안내', '카카오내비 즉시 연결'],
  },
  {
    category: 'share',
    icon: '📱',
    title: '종이 청첩장용 벡터 QR코드',
    desc: '종이 청첩장 봉투나 식권, 테이블 카드에 선명하게 인쇄할 수 있는 300 DPI 초고해상도 벡터 QR코드를 무료 다운로드합니다.',
    tags: ['PNG / SVG 벡터', '인쇄 규격 100%'],
  },
  {
    category: 'share',
    icon: '💌',
    title: '하객 축하 방명록',
    desc: '소중한 하객들의 따뜻한 축하 메시지를 남길 수 있으며, 비밀번호 기반의 실시간 삭제 관리 기능을 지원합니다.',
    tags: ['축하글 영구 보관', '비밀번호 삭제 관리'],
  },
];

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredFeatures =
    activeTab === 'all'
      ? FEATURES
      : FEATURES.filter((f) => f.category === activeTab);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#FAF9F6]/50 border-t border-slate-200/60">
      <div className="max-w-5xl mx-auto">
        {/* ========================================================
            헤더 & 카테고리 세그먼트 탭
           ======================================================== */}
        <ScrollReveal duration={800}>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="inline-block px-3.5 py-1 bg-white border border-slate-200/80 rounded-full text-[10.5px] font-mono tracking-wider text-slate-600 uppercase mb-3 shadow-2xs font-medium">
              ALL FEATURES · FULL SPEC
            </span>
            <h2
              className="text-2xl sm:text-4xl text-[#0f172a] font-extrabold tracking-[-0.03em] font-sans"
              style={{ lineHeight: 1.35 }}
            >
              모바일 청첩장에 필요한<br />
              <span className="text-slate-400 font-normal">모든 기능을 정성껏 담았습니다</span>
            </h2>
          </div>

          {/* 세그먼트 탭 버튼 (아틀리에 시그니처 컨트롤러 룩) */}
          <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-100 rounded-2xl max-w-md mx-auto mb-10 border border-slate-200/70 shadow-2xs">
            {CATEGORIES.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-[#1e293b] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* ========================================================
            기능 그리드 카드 (요즘 감성의 마이크로 아이콘 컨테이너 & 입체 섀도우)
           ======================================================== */}
        <ScrollReveal delay={150} duration={800}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredFeatures.map((item, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group select-none text-left"
              >
                <div>
                  {/* 상단: 세련된 아이콘 컨테이너 */}
                  <div className="w-11 h-11 rounded-2xl bg-[#FAF9F6] border border-slate-200/70 shadow-2xs flex items-center justify-center text-xl mb-3.5 group-hover:scale-105 group-hover:bg-amber-50 group-hover:border-amber-200/60 transition-all duration-300">
                    {item.icon}
                  </div>

                  <h3 className="text-[15px] font-bold text-[#0f172a] mb-1.5 tracking-tight font-sans group-hover:text-amber-800 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal leading-[1.65] break-keep">
                    {item.desc}
                  </p>
                </div>

                {/* 하단 태그 */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200/60 font-medium tracking-tight"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
