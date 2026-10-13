'use client';

import { useState } from 'react';

// YYYY-MM-DD 포맷 헬퍼
const toDateInputString = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function ExpiryAdjustModal({ isOpen, onClose, invitation, onSave }) {
  // 기존 설정된 만료일 계산
  const currentExpiryIso = invitation?.service_expired_at !== undefined 
    ? invitation?.service_expired_at 
    : invitation?.template_config?.service_expired_at;
  const isCurrentlyUnlimited = currentExpiryIso === null;

  // 초기 날짜 계산 (현재 만료일 -> 예식일+1년 순)
  const initialDateString = (() => {
    if (currentExpiryIso) {
      const d = new Date(currentExpiryIso);
      if (!isNaN(d.getTime())) return toDateInputString(d);
    }
    if (invitation?.wedding_date) {
      const d = new Date(invitation.wedding_date.replace(' ', 'T'));
      if (!isNaN(d.getTime())) {
        const plusOneYear = new Date(d);
        plusOneYear.setFullYear(plusOneYear.getFullYear() + 1);
        return toDateInputString(plusOneYear);
      }
    }
    return '';
  })();

  const [mode, setMode] = useState(isCurrentlyUnlimited ? 'unlimited' : 'date'); // 'date' | 'unlimited'
  const [selectedDate, setSelectedDate] = useState(initialDateString);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !invitation) return null;

  // 빠른 연장 헬퍼 (이벤트 핸들러 내에서 날짜 계산)
  const handleAddMonths = (months) => {
    const current = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    const next = new Date(isNaN(current.getTime()) ? Date.now() : current.getTime());
    next.setMonth(next.getMonth() + months);
    setSelectedDate(toDateInputString(next));
    setMode('date');
  };

  const handleSetUnlimited = () => {
    setMode('unlimited');
  };

  const handleConfirmSave = async () => {
    setSubmitting(true);
    try {
      if (mode === 'unlimited') {
        await onSave(invitation.id, null);
      } else {
        // 선택된 날짜의 23:59:59 KST 기준 ISO 저장
        const targetIso = new Date(`${selectedDate}T23:59:59`).toISOString();
        await onSave(invitation.id, targetIso);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono tracking-widest uppercase bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full font-bold">
            SERVICE EXPIRATION SETTING
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <h3 className="text-lg font-serif font-bold text-stone-900 mb-1">
          서비스 만료일 조정
        </h3>
        <p className="text-xs text-stone-500 font-light mb-4">
          <strong className="text-stone-800 font-medium">{invitation.groom_name} & {invitation.bride_name}</strong> (/{invitation.slug})
        </p>

        {/* 현재 상태 카드 */}
        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 mb-4 text-xs space-y-1">
          <div className="flex justify-between text-stone-600">
            <span>현재 설정 만료일</span>
            <span className="font-mono font-semibold text-stone-900">
              {isCurrentlyUnlimited ? '무제한 (평생 보관)' : (initialDateString || '-')}
            </span>
          </div>
          <div className="flex justify-between text-stone-400 text-[11px]">
            <span>예식 일시</span>
            <span>{invitation.wedding_date?.replace('T', ' ') || '-'}</span>
          </div>
        </div>

        {/* 빠른 프리셋 연장 버튼 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-stone-700 mb-2">빠른 기간 연장</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleAddMonths(6)}
              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition-colors cursor-pointer text-center"
            >
              +6개월 연장
            </button>
            <button
              type="button"
              onClick={() => handleAddMonths(12)}
              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition-colors cursor-pointer text-center"
            >
              +1년 연장
            </button>
            <button
              type="button"
              onClick={handleSetUnlimited}
              className={`py-2.5 px-3 text-xs font-medium rounded-xl transition-colors cursor-pointer text-center ${
                mode === 'unlimited'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              무제한 (영구)
            </button>
          </div>
        </div>

        {/* 만료일 직접 지정 */}
        {mode === 'date' ? (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              만료 날짜 직접 지정 (23:59까지 유효)
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 bg-white focus:outline-none focus:border-stone-900"
            />
          </div>
        ) : (
          <div className="mb-6 p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 font-light leading-relaxed">
            ✦ <strong>무제한(영구 보관) 모드:</strong> 기간 제한 없이 평생 만료되지 않고 지속 서비스됩니다. (지인 선물 or 평생소장 VIP 옵션)
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmSave}
            className="flex-1 py-3 px-4 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:bg-stone-400"
          >
            {submitting ? '저장 중...' : '만료일 저장하기 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
