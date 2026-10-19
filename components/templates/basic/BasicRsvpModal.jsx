'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BasicRsvpModal({ invitationId, onClose }) {
  const [side, setSide] = useState('groom'); // 'groom' | 'bride'
  const [attend, setAttend] = useState(true); // true | false
  const [name, setName] = useState('');
  const [companionCount, setCompanionCount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

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

    const payload = {
      invitation_id: invitationId,
      side,
      attend,
      name: cleanName,
      companion_count: attend ? (parseInt(companionCount, 10) || 0) : 0,
      phone: cleanPhone,
      meal: null,
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
        alert('이전에 제출하신 참석 정보가 최신 내용으로 안전하게 변경되었습니다. 감사합니다!');
      } else {
        alert('소중한 참석 의사가 잘 전달되었습니다. 감사합니다!');
      }
      if (onClose) onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[360px] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-[26px] p-1.5 leading-none transition-colors cursor-pointer"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 헤더 */}
        <div className="text-center pt-2 pb-5">
          <h3 className="text-base font-semibold text-stone-900 tracking-tight mb-1.5">
            참석 의사 체크하기
          </h3>
          <p className="text-xs text-stone-400 font-light leading-relaxed break-keep">
            한 분 한 분을 소중히 모실 수 있도록<br />참석 의사를 전해주시면 감사하겠습니다.
          </p>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* 1. 어느 분의 하객이신가요? */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-2">
              어느 분의 하객이신가요?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('groom')}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  side === 'groom'
                    ? 'bg-[#333333] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                신랑
              </button>
              <button
                type="button"
                onClick={() => setSide('bride')}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  side === 'bride'
                    ? 'bg-[#333333] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                신부
              </button>
            </div>
          </div>

          {/* 2. 참석하실 수 있나요? */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-2">
              참석하실 수 있나요?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAttend(true)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  attend === true
                    ? 'bg-[#333333] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                참석할게요
              </button>
              <button
                type="button"
                onClick={() => setAttend(false)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  attend === false
                    ? 'bg-[#333333] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                참석이 어려워요
              </button>
            </div>
          </div>

          {/* 3. 성함 */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
              성함이 어떻게 되시나요?
            </label>
            <input
              type="text"
              required
              placeholder="참석자 본인 성함"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-700 transition-colors"
            />
          </div>

          {/* 4. 동반 인원 (참석 시만 활성) */}
          {attend && (
            <div>
              <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                본인 제외 동반 인원 수를 입력해주세요.
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={companionCount}
                onChange={(e) => setCompanionCount(e.target.value)}
                className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-700 transition-colors"
              />
            </div>
          )}

          {/* 5. 휴대전화 번호 뒤 4자리 */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
              휴대전화 번호 뒤 4자리
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              maxLength={4}
              placeholder="동명이인 구분을 위한 번호 뒤 4자리 (예: 1234)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-3.5 py-3 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-700 transition-colors"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#333333] hover:bg-[#1a1a1a] text-white rounded-xl text-sm font-medium tracking-wide transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? '전달 중...' : '작성 완료'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}