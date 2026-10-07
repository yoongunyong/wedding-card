'use client';

export default function ContactModal({ invitation, onClose }) {
  const groom = {
    role: '신랑',
    name: invitation?.groom_name || '권기득',
    phone: invitation?.groom_phone || '010-0000-0000',
  };
  const groomFather = {
    role: '신랑 아버지',
    name: invitation?.groom_father || '권순민',
    phone: invitation?.groom_father_phone || '010-0000-0000',
  };
  const groomMother = {
    role: '신랑 어머니',
    name: invitation?.groom_mother || '이미자',
    phone: invitation?.groom_mother_phone || '010-0000-0000',
  };

  const bride = {
    role: '신부',
    name: invitation?.bride_name || '장민기',
    phone: invitation?.bride_phone || '010-0000-0000',
  };
  const brideFather = {
    role: '신부 아버지',
    name: invitation?.bride_father || '장철규',
    phone: invitation?.bride_father_phone || '010-0000-0000',
  };
  const brideMother = {
    role: '신부 어머니',
    name: invitation?.bride_mother || '이정자',
    phone: invitation?.bride_mother_phone || '010-0000-0000',
  };

  const groomSide = [groom, groomFather, groomMother];
  const brideSide = [bride, brideFather, brideMother];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[340px] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-2">
          <div className="w-6" /> {/* 여백용 */}
          <h3 className="text-base font-medium text-stone-800 tracking-wide text-center">
            연락처
          </h3>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 연락처 리스트 */}
        <div className="space-y-4 py-2">
          {/* 신랑측 */}
          <div className="space-y-3.5">
            {groomSide.map((person, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#4A6B82] font-medium leading-none mb-1">
                    {person.role}
                  </p>
                  <p className="text-[15px] font-semibold text-stone-800 leading-none">
                    {person.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${person.phone}`}
                    aria-label={`${person.name} 전화걸기`}
                    className="w-9 h-9 rounded-full bg-[#EFF5F9] hover:bg-[#E2ECF3] text-[#3B698A] flex items-center justify-center transition-colors shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </a>
                  <a
                    href={`sms:${person.phone}`}
                    aria-label={`${person.name} 문자보내기`}
                    className="w-9 h-9 rounded-full bg-[#EFF5F9] hover:bg-[#E2ECF3] text-[#3B698A] flex items-center justify-center transition-colors shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full h-px bg-stone-100 my-2" />

          {/* 신부측 */}
          <div className="space-y-3.5">
            {brideSide.map((person, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#C06070] font-medium leading-none mb-1">
                    {person.role}
                  </p>
                  <p className="text-[15px] font-semibold text-stone-800 leading-none">
                    {person.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${person.phone}`}
                    aria-label={`${person.name} 전화걸기`}
                    className="w-9 h-9 rounded-full bg-[#FCEDF0] hover:bg-[#F9DEE3] text-[#C06070] flex items-center justify-center transition-colors shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                  </a>
                  <a
                    href={`sms:${person.phone}`}
                    aria-label={`${person.name} 문자보내기`}
                    className="w-9 h-9 rounded-full bg-[#FCEDF0] hover:bg-[#F9DEE3] text-[#C06070] flex items-center justify-center transition-colors shadow-xs"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
