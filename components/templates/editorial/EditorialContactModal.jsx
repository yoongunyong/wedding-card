'use client';

export default function EditorialContactModal({ invitation, onClose }) {
  const config = invitation?.template_config || {};
  const isGroomFatherDeceased = invitation?.groom_father_deceased ?? config.groom_father_deceased ?? false;
  const isGroomMotherDeceased = invitation?.groom_mother_deceased ?? config.groom_mother_deceased ?? false;
  const isBrideFatherDeceased = invitation?.bride_father_deceased ?? config.bride_father_deceased ?? false;
  const isBrideMotherDeceased = invitation?.bride_mother_deceased ?? config.bride_mother_deceased ?? false;

  const formatName = (name, isDeceased) => {
    if (!name) return '';
    return isDeceased ? `故 ${name}` : name;
  };

  const groom = {
    role: '신랑',
    name: invitation?.groom_name || '',
    phone: invitation?.groom_phone || '',
  };
  const groomFather = {
    role: '신랑 아버지',
    name: formatName(invitation?.groom_father, isGroomFatherDeceased),
    phone: isGroomFatherDeceased ? '' : (invitation?.groom_father_phone || ''),
  };
  const groomMother = {
    role: '신랑 어머니',
    name: formatName(invitation?.groom_mother, isGroomMotherDeceased),
    phone: isGroomMotherDeceased ? '' : (invitation?.groom_mother_phone || ''),
  };

  const bride = {
    role: '신부',
    name: invitation?.bride_name || '',
    phone: invitation?.bride_phone || '',
  };
  const brideFather = {
    role: '신부 아버지',
    name: formatName(invitation?.bride_father, isBrideFatherDeceased),
    phone: isBrideFatherDeceased ? '' : (invitation?.bride_father_phone || ''),
  };
  const brideMother = {
    role: '신부 어머니',
    name: formatName(invitation?.bride_mother, isBrideMotherDeceased),
    phone: isBrideMotherDeceased ? '' : (invitation?.bride_mother_phone || ''),
  };

  const groomSide = [groom, groomFather, groomMother].filter((p) => p.name || p.phone);
  const brideSide = [bride, brideFather, brideMother].filter((p) => p.name || p.phone);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[370px] border border-stone-200 shadow-2xl relative p-7 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 우측 상단 미니멀 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer w-8 h-8 flex items-center justify-center text-xl font-light"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 에디토리얼 헤더 */}
        <div className="text-center pb-6 border-b border-stone-200">
          <span className="font-editorial-serif text-[11px] tracking-[0.3em] uppercase text-stone-400 block mb-1 font-semibold">
            CONTACT DIRECTORY
          </span>
          <h3 className="font-editorial-title text-[26px] text-stone-900 leading-tight">
            Contact & Blessing
          </h3>
          <p className="font-korean-serif text-[12.5px] text-stone-500 mt-1">
            축하의 마음을 직접 전하실 수 있습니다.
          </p>
        </div>

        {/* 연락처 목록 */}
        <div className="py-6 space-y-7 max-h-[60vh] overflow-y-auto pr-1">
          {/* 신랑측 */}
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 font-semibold">
                GROOM SIDE
              </span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            <div className="space-y-3 font-sans">
              {groomSide.map((person, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-[11px] font-sans text-stone-400 block">
                      {person.role}
                    </span>
                    <span className="font-korean-serif text-[15px] font-medium text-stone-900">
                      {person.name}
                    </span>
                  </div>

                  {person.phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${person.phone}`}
                        aria-label={`${person.name} 전화걸기`}
                        className="w-8 h-8 border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-700 flex items-center justify-center transition-all cursor-pointer"
                        title="전화 걸기"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                      </a>
                      <a
                        href={`sms:${person.phone}`}
                        aria-label={`${person.name} 문자보내기`}
                        className="w-8 h-8 border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-700 flex items-center justify-center transition-all cursor-pointer"
                        title="문자 보내기"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 신부측 */}
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <span className="font-editorial-serif text-[11px] tracking-widest uppercase text-stone-400 font-semibold">
                BRIDE SIDE
              </span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            <div className="space-y-3 font-sans">
              {brideSide.map((person, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-[11px] font-sans text-stone-400 block">
                      {person.role}
                    </span>
                    <span className="font-korean-serif text-[15px] font-medium text-stone-900">
                      {person.name}
                    </span>
                  </div>

                  {person.phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${person.phone}`}
                        aria-label={`${person.name} 전화걸기`}
                        className="w-8 h-8 border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-700 flex items-center justify-center transition-all cursor-pointer"
                        title="전화 걸기"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                      </a>
                      <a
                        href={`sms:${person.phone}`}
                        aria-label={`${person.name} 문자보내기`}
                        className="w-8 h-8 border border-stone-300 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-700 flex items-center justify-center transition-all cursor-pointer"
                        title="문자 보내기"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 닫기 */}
        <div className="pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors text-xs font-editorial-serif uppercase tracking-[0.2em] cursor-pointer"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
}
