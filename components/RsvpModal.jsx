'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RsvpModal({ invitationId, groomName, brideName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [side, setSide] = useState('groom');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [attend, setAttend] = useState('true');
  const [companionCount, setCompanionCount] = useState(0);
  const [meal, setMeal] = useState('yes');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('성함을 입력해 주세요.');

    setLoading(true);
    const { error } = await supabase.from('rsvp').insert([
      {
        invitation_id: invitationId,
        side,
        name: name.trim(),
        phone: phone.trim() || null,
        attend: attend === 'true',
        companion_count: attend === 'true' ? Number(companionCount) : 0,
        meal: attend === 'true' ? meal : 'no',
        memo: memo.trim(),
      },
    ]);

    setLoading(false);
    if (error) {
      console.error(error);
      alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } else {
      alert('참석 의사가 신랑·신부에게 잘 전달되었습니다. 감사합니다!');
      setIsOpen(false);
      setName('');
      setPhone('');
      setMemo('');
      setCompanionCount(0);
    }
  };

  return (
    <>
      <div className="p-6 text-center bg-white">
        <p className="text-xs text-stone-500 mb-3">
          원활한 예식 진행 및 식사 준비를 위해 참석 의사를 미리 알려주시면 감사하겠습니다.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3.5 px-6 rounded-xl bg-stone-900 text-white font-medium text-sm tracking-wide shadow-md active:scale-[0.98] transition-all"
        >
          참석 의사 전달하기 💌
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-lg font-serif font-bold text-center text-stone-900 mb-1">
              참석 여부 전달
            </h3>
            <p className="text-xs text-center text-stone-400 mb-6">
              {groomName} &middot; {brideName}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm text-stone-700">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">구분</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSide('groom')}
                    className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                      side === 'groom' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    신랑측 하객
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('bride')}
                    className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                      side === 'bride' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    신부측 하객
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">성함</label>
                <input
                  type="text"
                  required
                  placeholder="성함을 입력해 주세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">
                  연락처 <span className="text-stone-400 font-normal">(선택)</span>
                </label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">참석 여부</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttend('true')}
                    className={`py-2 rounded-lg border text-xs font-medium ${
                      attend === 'true' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    참석 가능
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttend('false')}
                    className={`py-2 rounded-lg border text-xs font-medium ${
                      attend === 'false' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    마음으로 축하 (불참)
                  </button>
                </div>
              </div>

              {attend === 'true' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">
                      본인 외 동행 인원
                    </label>
                    <select
                      value={companionCount}
                      onChange={(e) => setCompanionCount(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-800 text-sm bg-white"
                    >
                      <option value={0}>없음 (본인 1명)</option>
                      <option value={1}>동행 1명 (총 2명)</option>
                      <option value={2}>동행 2명 (총 3명)</option>
                      <option value={3}>동행 3명 (총 4명)</option>
                      <option value={4}>동행 4명 이상</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">식사 여부</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'yes', label: '식사함' },
                        { key: 'no', label: '식사안함' },
                        { key: 'undecided', label: '미정' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setMeal(item.key)}
                          className={`py-2 rounded-lg border text-xs font-medium ${
                            meal === item.key ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">
                  신랑·신부에게 남길 메모 (선택)
                </label>
                <textarea
                  rows={2}
                  placeholder="축하 인사나 전달사항을 남겨주세요."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-800 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium text-sm mt-4 hover:bg-stone-800 transition-all disabled:opacity-50"
              >
                {loading ? '전달하는 중...' : '참석 의사 제출하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}