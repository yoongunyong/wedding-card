import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function WeddingCardPage({ params }) {
  const { slug } = await params;

  // Supabase의 invitations 테이블에서 slug가 일치하는 데이터 조회
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !invitation) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-stone-100 flex justify-center py-0 sm:py-8">
      {/* 모바일 뷰 고정 컨테이너 (최대 너비 430px) */}
      <div className="w-full max-w-[430px] bg-white shadow-xl min-h-screen flex flex-col font-sans text-stone-800">
        
        {/* 커버 이미지 & 타이틀 */}
        <section className="relative w-full">
          {invitation.cover_image && (
            <img
              src={invitation.cover_image}
              alt="웨딩 커버"
              className="w-full h-[480px] object-cover"
            />
          )}
          <div className="p-8 text-center bg-white">
            <p className="text-xs tracking-widest text-stone-400 mb-2 uppercase">Wedding Invitation</p>
            <h1 className="text-2xl font-serif font-medium text-stone-900 mb-2">
              {invitation.groom_name} &middot; {invitation.bride_name}
            </h1>
            <p className="text-sm text-stone-500">{invitation.wedding_date}</p>
            <p className="text-sm text-stone-500 mt-1">{invitation.venue_name}</p>
          </div>
        </section>

        <hr className="border-t border-stone-200 mx-8 my-4" />

        {/* 모시는 글 */}
        <section className="p-8 text-center">
          <h2 className="text-xs tracking-widest text-stone-400 uppercase mb-4">Invitation</h2>
          <p className="text-sm leading-relaxed text-stone-600 whitespace-pre-line">
            {invitation.message}
          </p>

          <div className="mt-8 text-sm text-stone-700 space-y-1">
            <p>
              <span className="font-medium">{invitation.groom_father}</span> &middot;{' '}
              <span className="font-medium">{invitation.groom_mother}</span>의 장남{' '}
              <span className="font-semibold text-stone-900">{invitation.groom_name}</span>
            </p>
            <p>
              <span className="font-medium">{invitation.bride_father}</span> &middot;{' '}
              <span className="font-medium">{invitation.bride_mother}</span>의 장녀{' '}
              <span className="font-semibold text-stone-900">{invitation.bride_name}</span>
            </p>
          </div>
        </section>

        <hr className="border-t border-stone-200 mx-8 my-4" />

        {/* 예식 일시 및 장소 */}
        <section className="p-8 text-center bg-stone-50">
          <h2 className="text-xs tracking-widest text-stone-400 uppercase mb-4">Location</h2>
          <p className="font-medium text-stone-900 mb-1">{invitation.venue_name}</p>
          <p className="text-xs text-stone-500 mb-2">{invitation.venue_address}</p>
          <p className="text-xs text-stone-400 leading-relaxed">{invitation.venue_detail}</p>
        </section>

        {/* 갤러리 */}
        {invitation.gallery_images && invitation.gallery_images.length > 0 && (
          <section className="p-8">
            <h2 className="text-xs tracking-widest text-stone-400 uppercase text-center mb-6">Gallery</h2>
            <div className="grid grid-cols-2 gap-3">
              {invitation.gallery_images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`갤러리 사진 ${idx + 1}`}
                  className="w-full h-44 object-cover rounded-md shadow-sm"
                />
              ))}
            </div>
          </section>
        )}

        {/* 계좌 정보 */}
        {invitation.accounts && invitation.accounts.length > 0 && (
          <section className="p-8 bg-stone-50">
            <h2 className="text-xs tracking-widest text-stone-400 uppercase text-center mb-6">Account</h2>
            <div className="space-y-3">
              {invitation.accounts.map((acc, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="inline-block px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded mr-2 font-medium">
                      {acc.group}
                    </span>
                    <span className="font-medium text-stone-800">{acc.name}</span>
                    <p className="text-stone-500 mt-1">{acc.bank} {acc.number}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 푸터 */}
        <footer className="py-8 text-center text-xs text-stone-400 bg-white">
          <p>© Wedding Card. All rights reserved.</p>
        </footer>

      </div>
    </main>
  );
}