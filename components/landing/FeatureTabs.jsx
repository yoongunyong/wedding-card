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
    title: '참석 여부 (RSVP)',
    desc: '참석 여부, 동행 인원, 식사 여부, 전세버스 탑승을 실시간으로 집계하고 엑셀로 내려받습니다.',
    tags: ['식장 제출용', '엑셀 다운로드'],
  },
  {
    category: 'convenience',
    icon: '💳',
    title: '계좌번호 원클릭 복사',
    desc: '신랑측, 신부측 계좌번호를 깔끔하게 접고 펼칠 수 있으며, 터치 한 번으로 복사됩니다.',
    tags: ['카카오페이 연동', '복사 알림'],
  },
  {
    category: 'convenience',
    icon: '✏️',
    title: '식전 무제한 수정',
    desc: '예식 전까지 모시는 글, 사진 순서, 계좌번호, 시간 등을 언제든 직접 수정할 수 있습니다.',
    tags: ['실시간 반영', '비용 0원'],
  },
  {
    category: 'design',
    icon: '✉️',
    title: '편지봉투 오프닝 연출',
    desc: '청첩장을 열었을 때 우아하게 봉투가 열리며 시선을 사로잡는 오프닝 효과를 제공합니다.',
    tags: ['감성 연출', 'ON/OFF 가능'],
  },
  {
    category: 'design',
    icon: '🎨',
    title: '5가지 독창적인 시안',
    desc: '모던 클래식, 에디토리얼 잡지, 바이닐 턴테이블, 시네마틱 흑백, 모던 씬 중 취향대로 선택합니다.',
    tags: ['테마 자유 변경', '고화질 화보'],
  },
  {
    category: 'design',
    icon: '🎵',
    title: '감성 배경음악 (BGM)',
    desc: '엄선된 잔잔한 피아노 멜로디 프리셋을 제공하며, 두 사람만의 특별한 MP3 음원도 등록 가능합니다.',
    tags: ['음원 프리셋', '커스텀 업로드'],
  },
  {
    category: 'design',
    icon: '📸',
    title: '프리미엄 갤러리',
    desc: '고화질 웨딩 화보를 최대 30장까지 끊김 없이 빠르게 로딩하며, 확대 방지 기능을 지원합니다.',
    tags: ['슬라이드 뷰어', '화질 최적화'],
  },
  {
    category: 'design',
    icon: '⏳',
    title: 'D-Day 카운트다운',
    desc: '예식일까지 남은 날짜와 시간을 실시간으로 계산하여 하객들에게 설렘을 전합니다.',
    tags: ['실시간 계산', '캘린더 연동'],
  },
  {
    category: 'share',
    icon: '💬',
    title: '카카오톡 맞춤 공유 카드',
    desc: '카톡으로 링크를 보낼 때 사진과 두 사람의 이름, 예식 정보가 가장 예쁜 비율로 미리보기됩니다.',
    tags: ['카톡 썸네일', '원클릭 공유'],
  },
  {
    category: 'share',
    icon: '🗺️',
    title: '원터치 내비게이션 길안내',
    desc: '카카오 지도 내장은 물론 카카오내비, 네이버지도 앱으로 즉시 길안내를 시작합니다.',
    tags: ['네이버/카카오', '주차 안내'],
  },
  {
    category: 'share',
    icon: '📱',
    title: '인쇄용 종이 QR코드',
    desc: '종이 청첩장 봉투나 식권에 인쇄할 수 있는 고해상도 벡터 QR코드를 무료 다운로드합니다.',
    tags: ['PNG / SVG', '초고해상도'],
  },
  {
    category: 'share',
    icon: '💌',
    title: '축하 방명록',
    desc: '하객들의 따뜻한 축하 메시지를 남길 수 있으며, 비밀번호 기반 삭제 관리 기능을 제공합니다.',
    tags: ['비밀글 지원', '영구 보관'],
  },
];

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredFeatures =
    activeTab === 'all'
      ? FEATURES
      : FEATURES.filter((f) => f.category === activeTab);

  return (
    <section className="py-14 sm:py-20 px-4 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal duration={800}>
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
              ALL FEATURES
            </p>
            <h2 className="font-editorial-title text-2xl sm:text-4xl text-gray-900 font-bold tracking-tight">
              모바일 청첩장에 필요한<br />
              모든 기능을 담았습니다
            </h2>
          </div>

          {/* 4단 탭 버튼 (데어무드 스타일) */}
          <div className="flex items-center justify-center gap-1.5 p-1 bg-gray-100 rounded-2xl max-w-sm mx-auto mb-8">
            {CATEGORIES.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* 기능 그리드 카드 (스크롤 리빌) */}
        <ScrollReveal delay={150} duration={800}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeatures.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#F8F9FA] border border-gray-200/70 hover:border-gray-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/50 flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] px-2 py-0.5 bg-white text-gray-600 rounded-md border border-gray-200 font-mono"
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
