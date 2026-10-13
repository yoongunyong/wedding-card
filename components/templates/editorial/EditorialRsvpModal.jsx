'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditorialRsvpModal({ invitationId, onClose }) {
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
    if (!phone.trim()) return alert('연락처(핸드폰 번호 또는 뒤 4자리)를 입력해 주세요.');

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
      alert('소중한 참석 의사가 전달되었습니다. 진심으로 감사드립니다.');
      if (onClose) onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[390px] border border-stone-200 shadow-2xl relative p-7 sm:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center text-xl font-light"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 헤더 */}
        <div className="text-center pb-6 border-b border-stone-200 mb-6">
          <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 block mb-1 font-semibold">
            R . S . V . P
          </span>
          <h3 className="font-editorial-title text-[28px] text-stone-900 leading-tight">
            Attendance Card
          </h3>
          <p className="font-korean-serif text-[12.5px] text-stone-600 mt-1.5 leading-relaxed break-keep">
            귀한 발걸음으로 축복해 주실 분들을<br />소중히 맞이하고자 하오니 참석 여부를 알려주세요.
          </p>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
          {/* 1. 구분 선택 (신랑측 / 신부측) */}
          <div>
            <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-2 font-semibold">
              01 · INVITATION SIDE
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('groom')}
                className={`py-3 text-xs tracking-wider transition-all cursor-pointer ${
                  side === 'groom'
                    ? 'bg-stone-900 text-white font-medium'
                    : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-900'
                }`}
              >
                신랑측 하객
              </button>
              <button
                type="button"
                onClick={() => setSide('bride')}
                className={`py-3 text-xs tracking-wider transition-all cursor-pointer ${
                  side === 'bride'
                    ? 'bg-stone-900 text-white font-medium'
                    : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-900'
                }`}
              >
                신부측 하객
              </button>
            </div>
          </div>

          {/* 2. 참석 여부 */}
          <div>
            <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-2 font-semibold">
              02 · ATTENDANCE
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAttend(true)}
                className={`py-3 text-xs tracking-wider transition-all cursor-pointer ${
                  attend
                    ? 'bg-stone-900 text-white font-medium'
                    : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-900'
                }`}
              >
                참석합니다
              </button>
              <button
                type="button"
                onClick={() => setAttend(false)}
                className={`py-3 text-xs tracking-wider transition-all cursor-pointer ${
                  !attend
                    ? 'bg-stone-900 text-white font-medium'
                    : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-900'
                }`}
              >
                마음으로 축하합니다
              </button>
            </div>
          </div>

          {/* 3. 성함 */}
          <div>
            <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-1.5 font-semibold">
              03 · GUEST NAME *
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="성함을 입력해 주세요"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 text-xs font-sans transition-colors"
            />
          </div>

          {/* 4. 동행 인원 (참석 시) */}
          {attend && (
            <div>
              <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-1.5 font-semibold">
                04 · COMPANIONS
              </span>
              <input
                type="number"
                min="0"
                value={companionCount}
                onChange={(e) => setCompanionCount(e.target.value)}
                placeholder="본인 제외 동행 인원 수 (예: 1)"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 text-xs font-sans transition-colors"
              />
            </div>
          )}

          {/* 5. 연락처 */}
          <div>
            <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 block mb-1.5 font-semibold">
              05 · CONTACT NUMBER *
            </span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="핸드폰 번호 또는 뒤 4자리"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 text-xs font-sans transition-colors"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="pt-4 border-t border-stone-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs uppercase tracking-[0.2em] font-editorial-serif transition-colors cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit RSVP · 참석 의사 전달'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
