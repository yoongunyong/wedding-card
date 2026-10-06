import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BgmPlayer from '@/components/BgmPlayer';
import BasicTemplate from '@/components/templates/basic/BasicTemplate';

const TEMPLATE_MAP = {
  basic: BasicTemplate,
  modern: BasicTemplate, // 기존 DB 데이터 하위 호환
};

// SNS/카카오톡 공유 메타데이터 (OG 태그)
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const { data: invitation } = await supabase
    .from('invitations')
    .select('groom_name, bride_name, wedding_date, venue_name, cover_image, extra_data')
    .eq('slug', slug)
    .single();

  if (!invitation) {
    return {
      title: '모바일 청첩장',
    };
  }

  // 공유 썸네일: share_image 우선, 없으면 기본 cover_image 사용
  const ogImage = invitation.extra_data?.share_image || invitation.cover_image;
  const title = `${invitation.groom_name} ♥ ${invitation.bride_name} 결혼합니다`;
  const description = `${invitation.wedding_date} | ${invitation.venue_name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 800,
              height: 1000,
              alt: `${invitation.groom_name} & ${invitation.bride_name} 청첩장`,
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

// 청첩장 메인 렌더링
export default async function WeddingCardPage({ params }) {
  const { slug } = await params;

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !invitation) {
    return notFound();
  }

  const CurrentTemplate = TEMPLATE_MAP[invitation.template_type] || BasicTemplate;

  return (
    <main className="min-h-screen bg-stone-100 sm:py-8 flex justify-center p-0 m-0">
      <BgmPlayer 
        bgmUrl={invitation.bgm_url} 
        coverImage={invitation.cover_image} 
      />
      <CurrentTemplate invitation={invitation} />
    </main>
  );
}