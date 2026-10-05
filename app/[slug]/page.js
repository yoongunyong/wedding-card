import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BgmPlayer from '@/components/BgmPlayer';
import ModernTemplate from '@/components/templates/modern/ModernTemplate';
// 나중에 새 템플릿 추가 시 여기 import:
// import ClassicTemplate from '@/components/templates/ClassicTemplate';
// import FlowerTemplate from '@/components/templates/FlowerTemplate';

// 템플릿 라우팅 매핑 테이블
const TEMPLATE_MAP = {
  modern: ModernTemplate,
  // classic: ClassicTemplate,
  // flower: FlowerTemplate,
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

  // 기본 커버 이미지 또는 extra_data에 지정된 공유 전용 이미지 사용
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

  // DB의 template_type 값에 맞는 컴포넌트 자동 선택 (기본값: ModernTemplate)
  const CurrentTemplate = TEMPLATE_MAP[invitation.template_type] || ModernTemplate;

  return (
    <main className="min-h-screen bg-stone-100 flex justify-center py-0 sm:py-8">
      <BgmPlayer bgmUrl={invitation.bgm_url} />
      <CurrentTemplate invitation={invitation} />
    </main>
  );
}