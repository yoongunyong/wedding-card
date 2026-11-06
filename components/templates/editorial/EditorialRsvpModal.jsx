'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditorialRsvpModal({ invitation, invitationId, onClose }) {
  const [side, setSide] = useState('groom'); // 'groom' | 'bride'
  const [attend, setAttend] = useState(true); // true | false
  const [name, setName] = useState('');
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [phone, setPhone] = useState('');
  const [meal, setMeal] = useState('식사 가능'); // '미정' | '식사 가능' | '식사 불가'
  const [bus, setBus] = useState('탑승'); // '탑승' | '미탑승'
  const [loading, setLoading] = useState(false);

  const config = invitation?.template_config || {};
  const extra = invitation?.extra_data || {};
  const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'editorial');

  // 모달 마운트 시 배경 스크롤 잠금 (브라우저 퀵스크롤 및 배경 밀림 완전 차단)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 전세버스 탑승 조사 노출 여부 (제작/수정 시 체크박스 on/off 연동)
  const showBusOption = Boolean(
    config.show_rsvp_bus === true ||
    extra.has_bus ||
    extra.show_bus ||
    (isSample && config.show_rsvp_bus !== false)
  );

  // 식사 여부 조사 노출 여부 (기본 true, config.show_rsvp_meal === false일 때만 비활성화)
  const showMealOption = config.show_rsvp_meal !== false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invitationId) {
      alert('실시간 미리보기 모드입니다.\n청첩장 제작 신청 완료 후 실제 발급된 링크에서 참석 정보를 전달하실 수 있습니다.');
      if (onClose) onClose();
      return;
    }
    if (!name.trim()) return alert('성함을 입력해 주세요.');
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 4) return alert('휴대전화 번호 뒤 4자리를 정확히 입력해 주세요.');

    setLoading(true);
    const cleanName = name.trim();
    const phoneDigits = cleanPhone;

    // 1. 기존 동일 하객(성함 + 연락처) 등록 여부 조회
    const { data: existingRows } = await supabase
      .from('rsvp')
      .select('id, name, phone')
      .eq('invitation_id', invitationId)
      .eq('name', cleanName);

    let matchedId = null;
    if (existingRows && existingRows.length > 0) {
      const match = existingRows.find((row) => {
        const rowDigits = (row.phone || '').replace(/\D/g, '');
        if (!rowDigits || !phoneDigits) {
          return existingRows.length === 1;
        }
        return rowDigits === phoneDigits || rowDigits.endsWith(phoneDigits) || phoneDigits.endsWith(rowDigits);
      });
      if (match) {
        matchedId = match.id;
      }
    }

    const totalAttendees = attend ? Math.max(1, parseInt(attendeeCount, 10) || 1) : 0;
    const companionCountVal = attend ? Math.max(0, totalAttendees - 1) : 0;

    const payload = {
      invitation_id: invitationId,
      side,
      attend,
      name: cleanName,
      companion_count: companionCountVal,
      phone: cleanPhone,
      meal: attend && showMealOption ? meal : null,
      bus: attend && showBusOption ? bus : null,
    };

    let error = null;
    let isUpdated = false;

    if (matchedId) {
      // 기존 내역 최신 내용으로 덮어쓰기 (UPDATE)
      const res = await supabase
        .from('rsvp')
        .update(payload)
        .eq('id', matchedId);
      error = res.error;
      isUpdated = true;
    } else {
      // 신규 등록 (INSERT)
      const res = await supabase
        .from('rsvp')
        .insert([payload]);
      error = res.error;
    }

    setLoading(false);
    if (error) {
      console.error('RSVP 등록 에러:', error);
      alert('참석 정보 전달 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } else {
      if (isUpdated) {
        alert('이전에 제출하신 참석 정보가 최신 내용으로 안전하게 변경되었습니다. 진심으로 감사드립니다.');
      } else {
        alert('소중한 참석 의사가 전달되었습니다. 진심으로 감사드립니다.');
      }
      if (onClose) onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[340px] rounded-[20px] shadow-2xl relative pt-[32px] pb-[28px] px-[20px] sm:px-[24px] animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 (X표시) */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#3C3A3A] hover:text-black transition-colors cursor-pointer w-8 h-8 flex items-center justify-center"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1.5 1.5L14.5 14.5M14.5 1.5L1.5 14.5" stroke="#3C3A3A" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* 헤더 */}
        <div className="text-center">
          {/* 참석 의사 체크하기 (Figma: NanumSquare Neo OTF 34px -> 1x 17px, #333333) */}
          <h3 className="font-nanumsquare font-normal text-[17px] text-[#333333] leading-none text-center tracking-tight">
            참석 의사 체크하기
          </h3>

          {/* 서브 안내 문구 (Figma: NanumSquare Neo OTF 24px -> 1x 12px, leading-150%, #575757) */}
          <p className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-[1.5] text-center mt-[14px] tracking-tight whitespace-pre-line">
            한 분 한 분을 소중히 모실 수 있도록{'\n'}
            참석 의사를 전해주시면 감사하겠습니다.
          </p>

          {/* 헤더 하단 구분선 (Figma: 546px -> 1x 273px, border: 1px solid #D3D3D3) */}
          <div style={{ borderTop: '1px solid #D3D3D3' }} className="w-full max-w-[273px] mx-auto mt-[18px] mb-[20px]" />
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="space-y-[18px] text-left">
          {/* 1. 어느 분의 하객이신가요? */}
          <div>
            <label className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-none mb-[8px] block">
              어느 분의 하객이신가요?
            </label>
            <div className="grid grid-cols-2 gap-[10px]">
              {/* 신랑 버튼 */}
              <button
                type="button"
                onClick={() => setSide('groom')}
                style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                className={`h-[41.5px] rounded-[11.5px] flex items-center justify-center font-nanumsquare text-[12px] tracking-tight transition-all cursor-pointer select-none ${
                  side === 'groom'
                    ? 'bg-[#393939] border border-[#393939] text-[#F6F6F6] font-bold'
                    : 'bg-white border border-[#DAD1D1] text-[#B5B5B5] font-normal hover:border-stone-400'
                }`}
              >
                신랑
              </button>

              {/* 신부 버튼 */}
              <button
                type="button"
                onClick={() => setSide('bride')}
                style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                className={`h-[41.5px] rounded-[11.5px] flex items-center justify-center font-nanumsquare text-[12px] tracking-tight transition-all cursor-pointer select-none ${
                  side === 'bride'
                    ? 'bg-[#393939] border border-[#393939] text-[#F6F6F6] font-bold'
                    : 'bg-white border border-[#DAD1D1] text-[#B5B5B5] font-normal hover:border-stone-400'
                }`}
              >
                신부
              </button>
            </div>
          </div>

          {/* 2. 참석하실 수 있나요? */}
          <div>
            <label className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-none mb-[8px] block">
              참석하실 수 있나요?
            </label>
            <div className="grid grid-cols-2 gap-[10px]">
              {/* 참석할게요 버튼 */}
              <button
                type="button"
                onClick={() => setAttend(true)}
                style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                className={`h-[41.5px] rounded-[11.5px] flex items-center justify-center font-nanumsquare text-[12px] tracking-tight transition-all cursor-pointer select-none ${
                  attend
                    ? 'bg-[#393939] border border-[#393939] text-[#F6F6F6] font-bold'
                    : 'bg-white border border-[#DAD1D1] text-[#B5B5B5] font-normal hover:border-stone-400'
                }`}
              >
                참석할게요
              </button>

              {/* 참석이 어려워요 버튼 */}
              <button
                type="button"
                onClick={() => setAttend(false)}
                style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                className={`h-[41.5px] rounded-[11.5px] flex items-center justify-center font-nanumsquare text-[12px] tracking-tight transition-all cursor-pointer select-none ${
                  !attend
                    ? 'bg-[#393939] border border-[#393939] text-[#F6F6F6] font-bold'
                    : 'bg-white border border-[#DAD1D1] text-[#B5B5B5] font-normal hover:border-stone-400'
                }`}
              >
                참석이 어려워요
              </button>
            </div>
          </div>

          {/* 3. 성함이 어떻게 되시나요? */}
          <div>
            <label className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-none mb-[8px] block">
              성함이 어떻게 되시나요?
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="참석자 본인 성함"
              style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
              className="w-full h-[41.5px] px-3.5 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#C5C5C5] font-nanumsquare text-[12px] text-center focus:outline-none focus:border-[#393939] transition-colors"
            />
          </div>

          {/* 4. 참석 인원 (참석 시 노출) */}
          {attend && (
            <div className="flex items-center justify-between">
              <label className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-none">
                참석 인원
              </label>
              {/* 카운트 박스 */}
              <div 
                style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                className="w-[121.5px] h-[41.5px] bg-white border border-[#DAD1D1] rounded-[11.5px] flex items-center justify-between px-3"
              >
                <button
                  type="button"
                  onClick={() => setAttendeeCount((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-full flex items-center justify-center font-nanumsquare text-[15px] text-[#575757] hover:text-black cursor-pointer select-none"
                >
                  -
                </button>
                <span className="font-nanumsquare font-normal text-[12px] text-[#575757] select-none">
                  {attendeeCount}
                </span>
                <button
                  type="button"
                  onClick={() => setAttendeeCount((prev) => prev + 1)}
                  className="w-6 h-full flex items-center justify-center font-nanumsquare text-[15px] text-[#575757] hover:text-black cursor-pointer select-none"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* 5. 식사 여부를 알려주세요. (참석 시 활성) */}
          {attend && showMealOption && (
            <div>
              <label className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-none mb-[8px] block">
                식사 여부를 알려주세요.
              </label>
              <div className="grid grid-cols-3 gap-[8px]">
                {['미정', '식사 가능', '식사 불가'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMeal(opt)}
                    style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                    className={`h-[41.5px] rounded-[11.5px] flex items-center justify-center font-nanumsquare text-[12px] tracking-tight transition-all cursor-pointer select-none ${
                      meal === opt
                        ? 'bg-[#393939] border border-[#393939] text-[#F6F6F6] font-bold'
                        : 'bg-white border border-[#DAD1D1] text-[#B5B5B5] font-normal hover:border-stone-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. 전세버스 탑승 여부 (참석 시 & 버스 옵션 활성화 시) */}
          {attend && showBusOption && (
            <div>
              <label className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-none mb-[8px] block">
                전세버스 탑승 여부
              </label>
              <div className="grid grid-cols-2 gap-[10px]">
                {['탑승', '미탑승'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBus(opt)}
                    style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                    className={`h-[41.5px] rounded-[11.5px] flex items-center justify-center font-nanumsquare text-[12px] tracking-tight transition-all cursor-pointer select-none ${
                      bus === opt
                        ? 'bg-[#393939] border border-[#393939] text-[#F6F6F6] font-bold'
                        : 'bg-white border border-[#DAD1D1] text-[#B5B5B5] font-normal hover:border-stone-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. 동명이인 체크를 위한 번호를 알려주세요. */}
          <div>
            <label className="font-nanumsquare font-normal text-[12px] text-[#575757] leading-none mb-[8px] block">
              동명이인 체크를 위한 번호를 알려주세요.
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              maxLength={4}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="핸드폰 번호 뒤 4자리"
              style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
              className="w-full h-[41.5px] px-3.5 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#C5C5C5] font-nanumsquare text-[12px] text-center focus:outline-none focus:border-[#393939] transition-colors"
            />
          </div>

          {/* 8. 작성 완료 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] bg-[#393939] hover:bg-[#2c2c2c] active:scale-[0.99] disabled:bg-[#888888] text-[#F6F6F6] font-nanumsquare font-bold text-[14px] rounded-[11.5px] transition-all cursor-pointer shadow-sm flex items-center justify-center select-none"
            >
              {loading ? '전달 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
