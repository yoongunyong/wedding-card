'use client';

import { useState, useEffect } from 'react';
import RsvpModal from '@/components/RsvpModal';

export default function ModernTemplate({ invitation }) {
  const extra = invitation.extra_data || {};

  // 계좌 아코디언 상태
  const [openGroom, setOpenGroom] = useState(true);
  const [openBride, setOpenBride] = useState(true);

  // 실시간 카운트다운 타이머
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 });

  useEffect(() => {
    const targetDate = new Date(invitation.wedding_date_iso || '2027-03-27T11:00:00');

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, totalDays: days });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [invitation.wedding_date_iso]);

  // 클립보드 복사 함수
  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} 복사되었습니다.`);
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  // 계좌 데이터
  const groomAccounts = (invitation.accounts || []).filter((a) => a.group === '신랑측' || a.side === 'groom');
  const brideAccounts = (invitation.accounts || []).filter((a) => a.group === '신부측' || a.side === 'bride');

  // 모달 제어용 (RSVP)
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  return (
    <div className="w-full max-w-[430px] bg-[#FCFBF7] text-[#333333] min-h-screen flex flex-col font-serif shadow-2xl antialiased selection:bg-stone-200">

      {/* 1. 메인 커버 */}
      <section className="relative w-full h-[680px] overflow-hidden">
        <img
          src={invitation.cover_image || '/temp/cover.jpg'}
          alt="Wedding Cover"
          className="w-full h-full object-cover"
        />

        {/* 좌상단 영문 필기체 */}
        <div className="absolute top-12 left-6 text-white/95">
          <p className="font-serif italic text-3xl font-light tracking-wide leading-tight drop-shadow-md">
            we are<br />getting married!
          </p>
        </div>

        {/* 하단 좌우 신부/신랑 이름 */}
        <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-between text-white/90 text-sm tracking-wider font-light drop-shadow">
          <span>{invitation.bride_name || '장민기'}</span>
          <span>{invitation.groom_name || '권기득'}</span>
        </div>
      </section>

      {/* 2. 초대합니다 (모시는 글) */}
      <section className="py-24 px-6 text-center bg-[#FCFBF7]">
        <h2 className="text-lg font-medium text-[#222222] tracking-wider mb-8">초대합니다</h2>
        <div className="text-[13px] leading-[2.5] text-[#555555] font-light space-y-5 break-keep">
          <p>
            서로를 만나 평범했던 하루가<br />
            조금 더 따뜻하고 특별해졌습니다.<br />
            이제 두 사람이 한마음으로<br />
            새로운 계절을 시작하려 합니다.
          </p>
          <p>
            소중한 분들과 함께<br />
            그 순간을 나누고 싶습니다.<br />
            저희의 첫걸음에 따뜻한 축복을 보내주세요.
          </p>
        </div>

        {/* 수직 구분선 */}
        <div className="w-[1px] h-12 bg-[#E2DED6] mx-auto my-12" />

        {/* 혼주 관계 표기 */}
        <div className="text-xs text-[#555555] space-y-2 mb-10 font-light tracking-wide">
          <p>
            {invitation.groom_father || '신랑아버지'} · {invitation.groom_mother || '신랑 어머니'}의 아들{' '}
            <span className="font-normal text-[#222]">{invitation.groom_name || '권기득'}</span>
          </p>
          <p>
            {invitation.bride_father || '장철규'} · {invitation.bride_mother || '이정자'}의 딸{' '}
            <span className="font-normal text-[#222]">{invitation.bride_name || '장민기'}</span>
          </p>
        </div>

        {/* 축하 연락하기 버튼 */}
        <button
          onClick={() => alert(`신랑: ${invitation.groom_phone || '010-0000-0000'}\n신부: ${invitation.bride_phone || '010-0000-0000'}`)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F4F1EA] hover:bg-[#ECE7DC] text-[#444] rounded-full text-xs transition-colors shadow-sm"
        >
          <span>축하 연락하기</span>
          <span className="text-[10px]">📞</span>
        </button>

        {/* 신랑 신부 프로필 */}
        <div className="mt-20">
          <p className="font-serif italic text-xs text-[#8C8479] mb-6">we are getting married</p>
          <div className="flex justify-center items-center gap-10">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border border-[#E8E2D8] shadow-sm">
                <img
                  src={extra.groom_profile_image || invitation.cover_image}
                  alt="신랑"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] text-[#999]">신랑</p>
              <p className="text-xs font-medium text-[#222] mt-0.5">{invitation.groom_name || '권기득'}</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border border-[#E8E2D8] shadow-sm">
                <img
                  src={extra.bride_profile_image || invitation.cover_image}
                  alt="신부"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] text-[#999]">신부</p>
              <p className="text-xs font-medium text-[#222] mt-0.5">{invitation.bride_name || '장민기'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Wedding Day & 캘린더 & 카운트다운 */}
      <section className="py-20 px-6 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <h2 className="text-3xl font-serif text-[#2C2928] tracking-wider mb-4">Wedding Day</h2>
        <p className="text-xs text-[#444] font-medium tracking-wide">
          {invitation.wedding_date || '2027년 3월 27일 토요일 | 오후 11시'}
        </p>
        <p className="text-[11px] text-[#8C857B] mt-1 mb-8">Saturday, March 27, 2027 | AM 11:00</p>

        {/* 캘린더 그리드 */}
        <div className="max-w-[320px] mx-auto pt-6 border-t border-[#EAE4D9]">
          <div className="grid grid-cols-7 text-center text-xs text-[#8C857B] mb-5 font-sans">
            <span className="text-[#E76C53]">일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span>토</span>
          </div>
          <div className="grid grid-cols-7 text-center text-xs gap-y-4 text-[#444] font-sans">
            <span /><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
            <span className="text-[#E76C53]">7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span>
            <span className="text-[#E76C53]">14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span><span>20</span>
            <span className="text-[#E76C53]">21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
            <div className="relative flex items-center justify-center">
              <span className="w-8 h-8 rounded-full bg-[#F6EAC2] text-[#444] flex items-center justify-center font-semibold z-10">27</span>
            </div>
            <span className="text-[#E76C53]">28</span><span>29</span><span>30</span><span>31</span>
          </div>
        </div>

        {/* 카운트다운 4개 박스 */}
        <div className="grid grid-cols-4 gap-2.5 max-w-[320px] mx-auto mt-12 mb-8">
          {[
            { label: 'DAYS', val: timeLeft.days },
            { label: 'HOURS', val: timeLeft.hours },
            { label: 'MINUTES', val: timeLeft.minutes },
            { label: 'SECONDS', val: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="bg-white py-3 px-1 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F0EBE1] text-center">
              <span className="text-[9px] text-[#A39C93] block font-sans tracking-wider">{item.label}</span>
              <span className="text-xl font-medium text-[#222] font-sans mt-0.5 block">{item.val}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#555] tracking-wide">
          {invitation.groom_name || '기득'} ♥ {invitation.bride_name || '민기'}님의 결혼식이{' '}
          <span className="text-[#E76C53] font-medium">{timeLeft.totalDays}일</span> 남았습니다.
        </p>
      </section>

      {/* 4. 웨딩 갤러리 */}
      <section className="py-20 px-6 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 1.svg" alt="" className="w-7 h-7 mx-auto mb-2 opacity-80" />
        <h2 className="text-base text-[#222] tracking-wider mb-8">웨딩 갤러리</h2>

        {/* 피그마 2열 비대칭 모자이크 그리드 */}
        <div className="grid grid-cols-2 gap-2 max-w-[340px] mx-auto">
          {(invitation.gallery_images && invitation.gallery_images.length > 0
            ? invitation.gallery_images
            : ['/temp/1.jpg', '/temp/2.jpg', '/temp/3.jpg', '/temp/4.jpg', '/temp/5.jpg', '/temp/6.jpg', '/temp/7.jpg', '/temp/8.jpg']
          ).map((src, i) => (
            <div
              key={i}
              className={`overflow-hidden bg-[#EFECE6] ${
                i === 0 ? 'row-span-2 h-[280px]' : i === 1 ? 'h-[135px]' : i === 2 ? 'h-[135px]' : 'h-[140px]'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>

        <button className="mt-8 px-12 py-3 bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs text-[#555] rounded-xl transition-colors">
          더보기
        </button>
      </section>

      {/* 5. 식장 위치 & 지도 & 교통 안내 */}
      <section className="py-20 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <div className="px-6">
          <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 2.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-80" />
          <h2 className="text-base text-[#222] tracking-wider mb-4">식장 위치</h2>
          <p className="text-sm font-medium text-[#222] mb-1">{invitation.venue_name || '호텔금오산 컨벤션센터'}</p>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#777] mb-8">
            <span>{invitation.venue_address || '경북 구미시 금오산로 400'}</span>
            <button
              onClick={() => handleCopy(invitation.venue_address || '경북 구미시 금오산로 400', '주소가')}
              className="text-[#999] hover:text-[#333]"
            >
              📋
            </button>
          </div>

          {/* 지도 뷰 영역 */}
          <div className="w-full h-56 bg-stone-200 rounded-xl overflow-hidden mb-5 border border-stone-200 shadow-sm relative">
            <img src="/temp/map_mock.png" alt="지도" className="w-full h-full object-cover" />
          </div>

          {/* 지도 내비게이션 2버튼 */}
          <div className="grid grid-cols-2 gap-3 mb-12">
            <button
              onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(invitation.venue_name || '호텔금오산')}`)}
              className="py-3 px-4 rounded-xl bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs text-[#444] font-sans flex items-center justify-center gap-1.5 transition-colors"
            >
              네이버 지도 <span>🟢</span>
            </button>
            <button
              onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(invitation.venue_name || '호텔금오산')}`)}
              className="py-3 px-4 rounded-xl bg-[#F4F1EA] hover:bg-[#EAE5DA] text-xs text-[#444] font-sans flex items-center justify-center gap-1.5 transition-colors"
            >
              카카오내비 <span>🟡</span>
            </button>
          </div>
        </div>

        {/* 교통편 상세 카드 목록 (연한 그레이 배경 전환) */}
        <div className="bg-[#F8F7F4] py-10 px-6 space-y-4 text-left font-sans">
          {/* 주차 */}
          <div className="bg-white p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <p className="font-semibold text-xs text-[#333] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1">
              주차안내 <span className="text-[10px] text-stone-400">🅿️</span>
            </p>
            <p className="text-[11px] text-[#666] leading-relaxed break-keep">
              {extra.parking_info || '주차공간이 협소하오니, 되도록 대중교통을 이용해 주시기 바랍니다.\n특히, 주말은 오전 시간대에 만차가 되니 부득이하게 주차가 필요하신 분들은 예식장에 전화 부탁드립니다.'}
            </p>
          </div>

          {/* 자차 */}
          <div className="bg-white p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <p className="font-semibold text-xs text-[#333] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1">
              자차 <span className="text-[10px] text-stone-400">🚗</span>
            </p>
            <p className="text-[11px] text-[#666] leading-relaxed break-keep">
              {extra.car_info || `네비게이션 : '${invitation.venue_name || '금오산 호텔'}' 검색\n${invitation.venue_address || '경북 구미시 금오산로 400 호텔금오산 컨벤션센터'}`}
            </p>
          </div>

          {/* 버스 */}
          <div className="bg-white p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <p className="font-semibold text-xs text-[#333] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1">
              버스 <span className="text-[10px] text-stone-400">🚌</span>
            </p>
            <p className="text-[11px] text-[#666] leading-relaxed whitespace-pre-line break-keep">
              {extra.bus_info || '172 (우리은행종로지점 방면)\n서울광장역 하차 → 도보 5분\n\n405 (롯데백화점 방면)\n서울광장역 하차 → 도보 5분'}
            </p>
          </div>

          {/* 지하철 */}
          <div className="bg-white p-5 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <p className="font-semibold text-xs text-[#333] mb-3 pb-2 border-b border-stone-100 flex items-center gap-1">
              지하철 <span className="text-[10px] text-stone-400">🚇</span>
            </p>
            <p className="text-[11px] text-[#666] leading-relaxed whitespace-pre-line break-keep">
              {extra.subway_info || '[1호선] 시청역 4번 출구\n[2호선] 을지로입구역 하차 후 시청 방면'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. 마음 전하실 곳 & 식사 안내 */}
      <section className="py-20 px-6 bg-[#EFECE4] text-center">
        <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 3.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-80" />
        <h2 className="text-base text-[#222] tracking-wider mb-8">마음 전하실 곳</h2>

        {/* 신랑측 계좌 아코디언 */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm text-left mb-4 border border-[#E6E1D6]">
          <button
            onClick={() => setOpenGroom(!openGroom)}
            className="w-full py-4 px-5 flex items-center justify-between text-xs text-[#333] font-sans font-medium"
          >
            <span>신랑측 계좌번호</span>
            <span className="text-stone-400 text-[10px]">{openGroom ? '∧' : '∨'}</span>
          </button>
          {openGroom && (
            <div className="px-5 pb-5 pt-1 divide-y divide-stone-100">
              {(groomAccounts.length > 0 ? groomAccounts : [
                { name: '신랑 권기득', bank: '하나은행', number: '504-910579-89707' },
                { name: '신랑 권기득', bank: '신한은행', number: '504-910579-89707' },
              ]).map((acc, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs font-sans">
                  <div>
                    <p className="text-[11px] text-[#888]">{acc.name}</p>
                    <p className="text-xs text-[#222] font-medium mt-0.5">{acc.bank} {acc.number}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name} 계좌번호가`)}
                    className="px-3 py-1.5 bg-[#F4F1EA] hover:bg-[#EAE5DA] text-[11px] text-[#444] rounded-full transition-colors"
                  >
                    복사하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 신부측 계좌 아코디언 */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm text-left mb-16 border border-[#E6E1D6]">
          <button
            onClick={() => setOpenBride(!openBride)}
            className="w-full py-4 px-5 flex items-center justify-between text-xs text-[#333] font-sans font-medium"
          >
            <span>신부측 계좌번호</span>
            <span className="text-stone-400 text-[10px]">{openBride ? '∧' : '∨'}</span>
          </button>
          {openBride && (
            <div className="px-5 pb-5 pt-1 divide-y divide-stone-100">
              {(brideAccounts.length > 0 ? brideAccounts : [
                { name: '신부 장민기', bank: '하나은행', number: '504-910579-89707' },
                { name: '신부 장민기', bank: '신한은행', number: '504-910579-89707' },
              ]).map((acc, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs font-sans">
                  <div>
                    <p className="text-[11px] text-[#888]">{acc.name}</p>
                    <p className="text-xs text-[#222] font-medium mt-0.5">{acc.bank} {acc.number}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(`${acc.bank} ${acc.number}`, `${acc.name} 계좌번호가`)}
                    className="px-3 py-1.5 bg-[#F4F1EA] hover:bg-[#EAE5DA] text-[11px] text-[#444] rounded-full transition-colors"
                  >
                    복사하기
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 정보 (식사안내) 카드 */}
        <div>
          <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 4.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-80" />
          <h2 className="text-base text-[#222] tracking-wider mb-6">정보</h2>

          <div className="relative max-w-[320px] mx-auto">
            <div className="bg-white rounded-2xl p-7 shadow-sm text-center border border-[#EAE5DA]">
              <h3 className="text-sm font-medium text-[#222] mb-1">식사안내</h3>
              <p className="text-[11px] text-[#777] mb-4">PM 14:00~ 16:00 뷔페 이용 가능</p>
              <div className="w-full h-[1px] bg-stone-100 mb-4" />
              <p className="text-xs text-[#555] leading-relaxed break-keep">
                {extra.meal_info || '교환권을 스테이크 코너에 제시해주시면 안심 스테이크가 제공됩니다.'}
              </p>
            </div>
            {/* 인디케이터 도트 */}
            <div className="flex justify-center gap-1.5 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#555]" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. 참석 의사 (RSVP) */}
      <section className="py-24 px-6 bg-[#FCFBF7] text-center border-t border-[#F2ECE1]">
        <img src="/templates/modern/미니멀 웨딩 아이콘 6종 세트 5.svg" alt="" className="w-10 h-10 mx-auto mb-3 opacity-80" />
        <h2 className="text-base text-[#222] tracking-wider mb-1">참석 의사</h2>
        <p className="text-xs text-[#777] font-light mb-8">모든 분들을 소중하게 모실 수 있도록 전해주세요</p>

        {/* 예식 요약 화이트 카드 */}
        <div className="bg-white rounded-2xl p-7 max-w-[320px] mx-auto shadow-sm border border-[#EAE5DA] mb-6">
          <p className="text-sm font-medium text-[#222] mb-4">
            신랑 {invitation.groom_name || '권기득'} ♥ 신부 {invitation.bride_name || '장민기'}
          </p>
          <div className="w-full h-[1px] bg-stone-100 mb-4" />
          <p className="text-xs text-[#555] mb-1">{invitation.wedding_date || '2027년 3월 27일 토요일 오전 11시'}</p>
          <p className="text-xs text-[#777]">{invitation.venue_name || '호텔금오산 컨벤션센터'}</p>
        </div>

        {/* 참석 정보 전달하기 검정 버튼 */}
        <button
          onClick={() => setShowRsvpModal(true)}
          className="w-full max-w-[320px] py-4 bg-[#333333] hover:bg-[#222] text-white rounded-xl text-xs tracking-wider transition-colors shadow-sm"
        >
          참석 정보 전달하기
        </button>

        {showRsvpModal && (
          <RsvpModal
            invitationId={invitation.id}
            groomName={invitation.groom_name}
            brideName={invitation.bride_name}
            onClose={() => setShowRsvpModal(false)}
          />
        )}
      </section>

      {/* 8. 방명록 */}
      <section className="py-20 px-6 bg-[#EFECE4] text-center">
        <div className="text-2xl mb-1">📖</div>
        <h2 className="text-base text-[#222] tracking-wider mb-1">방명록</h2>
        <p className="text-xs text-[#777] font-light mb-8">저희 둘에게 따뜻한 메시지를 남겨주세요.</p>

        {/* 샘플 방명록 카드 3개 */}
        <div className="space-y-3 max-w-[320px] mx-auto mb-6 text-left">
          {[
            { name: '장성경', msg: '두 사람 꽃길 결혼 생활 예약🌷\n행복과 축복으로 가득하길 바래🤍' },
            { name: '윤건용', msg: '두 분의 새로운 시작을 진심으로 축하드립니다.\n행복한 가정 이루시길 바라요' },
            { name: '떡만이', msg: '드디어 결혼이라니 너무 축하해!\n예쁜 추억 많이 만들면서 행복하게 살아~' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-[#E4DFD5]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] italic px-2 py-0.5 border border-stone-200 rounded-full text-stone-500 font-serif">From</span>
                  <span className="text-xs font-medium text-[#222]">{item.name}</span>
                </div>
                <span className="text-stone-300 text-xs cursor-pointer">×</span>
              </div>
              <p className="text-xs text-[#555] leading-relaxed whitespace-pre-line">{item.msg}</p>
            </div>
          ))}
        </div>

        {/* 전체보기 & 작성하기 버튼 */}
        <div className="grid grid-cols-2 gap-3 max-w-[320px] mx-auto">
          <button className="py-3 bg-[#F4F1EA] hover:bg-[#EAE5DA] rounded-xl text-xs text-[#555] transition-colors flex items-center justify-center gap-1">
            <span>전체보기</span> <span>≡</span>
          </button>
          <button className="py-3 bg-[#F4F1EA] hover:bg-[#EAE5DA] rounded-xl text-xs text-[#555] transition-colors flex items-center justify-center gap-1">
            <span>작성하기</span> <span>✎</span>
          </button>
        </div>
      </section>

      {/* 9. 엔딩 커버 사진 */}
      <section className="relative w-full h-[460px] overflow-hidden">
        <img
          src={extra.ending_image || invitation.cover_image || '/temp/ending.jpg'}
          alt="Ending Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-6">
          <p className="text-white text-sm font-light tracking-widest drop-shadow-md">
            축하해주셔서 감사합니다.
          </p>
        </div>
      </section>

      {/* 10. 하단 공유 바 */}
      <footer className="py-8 px-6 bg-white space-y-2.5">
        <button
          onClick={() => handleCopy(window.location.href, '청첩장 주소가')}
          className="w-full py-3.5 px-4 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#333] text-xs rounded-xl flex items-center justify-between font-sans transition-colors"
        >
          <span>카카오톡으로 공유하기</span>
          <img src="/templates/modern/카카오톡 공유하기 아이콘.svg" alt="" className="w-4 h-4 opacity-70" />
        </button>
        <button
          onClick={() => handleCopy(window.location.href, '청첩장 주소가')}
          className="w-full py-3.5 px-4 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#333] text-xs rounded-xl flex items-center justify-between font-sans transition-colors"
        >
          <span>청첩장 주소 복사하기</span>
          <span className="text-xs text-stone-500">🔗</span>
        </button>
      </footer>

    </div>
  );
}