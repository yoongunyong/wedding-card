import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BgmPlayer from '@/components/BgmPlayer';
import SampleWatermark from '@/components/SampleWatermark';
import ExpiredWeddingCard from '@/components/ExpiredWeddingCard';
import BasicTemplate from '@/components/templates/basic/BasicTemplate';
import EditorialTemplate from '@/components/templates/editorial/EditorialTemplate';

const TEMPLATE_MAP = {
  basic: BasicTemplate,
  modern: BasicTemplate, // 기존 DB 데이터 하위 호환
  editorial: EditorialTemplate,
};

// SNS/카카오톡 공유 메타데이터 (OG 태그)
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const { data: invitation } = await supabase
    .from('invitations')
    .select('groom_name, bride_name, wedding_date, venue_name, venue_hall, images')
    .eq('slug', slug)
    .single();

  if (!invitation) {
    return {
      title: '모바일 청첩장',
    };
  }

  // 공유 썸네일: images.cover 최우선
  const ogImage = invitation.images?.cover || invitation.images?.main || '/cover.jpg';
  const coupleText = [invitation.groom_name, invitation.bride_name].filter(Boolean).join(' ♥ ');
  const title = coupleText ? `${coupleText} 결혼합니다` : '모바일 청첩장';
  const fullVenue = [invitation.venue_name, invitation.venue_hall].filter(Boolean).join(' ');
  const description = [invitation.wedding_date, fullVenue].filter(Boolean).join(' | ') || '소중한 분들을 초대합니다';

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
              alt: coupleText ? `${coupleText} 청첩장` : '모바일 청첩장',
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

  // 예식일 기준 1년(365일) 경과 여부 확인
  let isExpired = false;
  if (invitation.wedding_date) {
    try {
      const weddingDate = new Date(invitation.wedding_date.replace(' ', 'T'));
      if (!isNaN(weddingDate.getTime())) {
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (Date.now() > weddingDate.getTime() + oneYearMs) {
          isExpired = true;
        }
      }
    } catch (e) {
      console.warn('Wedding date parse error:', e);
    }
  }

  if (isExpired) {
    return <ExpiredWeddingCard invitation={invitation} />;
  }

  const CurrentTemplate = TEMPLATE_MAP[invitation.template_type] || BasicTemplate;
  const isActive = invitation.is_active ?? invitation.template_config?.is_active ?? true;

  return (
    <main className="min-h-screen bg-stone-100 sm:py-8 flex justify-center p-0 m-0 relative">
      {!isActive && <SampleWatermark />}
      <BgmPlayer 
        bgmUrl={invitation.bgm_url} 
        hasIntro={invitation?.template_config?.show_intro !== false} 
      />
      <CurrentTemplate invitation={invitation} />
    </main>
  );
}