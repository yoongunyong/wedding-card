'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RsvpModal({ invitationId, onClose }) {
  const [side, setSide] = useState('groom'); // 'groom' | 'bride'
  const [attend, setAttend] = useState(true); // true | false
  const [name, setName] = useState('');
  const [companionCount, setCompanionCount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('성함을 입력해 주세요.');
    if (!phone.trim()) return alert('핸드폰 번호 뒤 4자리를 입력해 주세요.');

    setLoading(true);
    const { error } = await supabase.from('rsvp').insert([
      {
        invitation_id: invitationId,
        side,
        attend,
        name: name.trim(),
        companion_count: attend ? (parseInt(companionCount, 10) || 0) : 0,
        phone: phone.trim(),
        meal: null,
      },
    ]);

    setLoading(false);
    if (error) {
      console.error('RSVP 등록 에러:', error);
      alert('참석 정보 전달 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } else {
      alert('소중한 참석 의사가 잘 전달되었습니다. 감사합니다!');
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
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 text-lg transition-colors"
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

          {/* 5. 핸드폰 번호 뒤 4자리 */}
          <div>
            <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
              동명이인 체크를 위한 번호를 알려주세요.
            </label>
            <input
              type="text"
              required
              maxLength={4}
              placeholder="핸드폰 번호 뒤 4자리"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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