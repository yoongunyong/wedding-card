import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BgmPlayer from '@/components/BgmPlayer';
import SampleWatermark from '@/components/SampleWatermark';
import ExpiredWeddingCard from '@/components/ExpiredWeddingCard';
import BasicTemplate from '@/components/templates/basic/BasicTemplate';
import EditorialTemplate from '@/components/templates/editorial/EditorialTemplate';
import PlaylistTemplate from '@/components/templates/playlist/PlaylistTemplate';
import CinematicTemplate from '@/components/templates/cinematic/CinematicTemplate';
import SceneTemplate from '@/components/templates/scene/SceneTemplate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TEMPLATE_MAP = {
  basic: BasicTemplate,
  editorial: EditorialTemplate,
  playlist: PlaylistTemplate,
  cinematic: CinematicTemplate,
  scene: SceneTemplate,
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

  // 서비스 만료일시(service_expired_at) 기준 만료 여부 확인
  let isExpired = false;
  const rawExpiredAt = invitation.service_expired_at ?? invitation.template_config?.service_expired_at;

  if (rawExpiredAt !== undefined) {
    if (rawExpiredAt === null) {
      // null로 명시된 경우 무제한(영구 보관) 상태 -> 절대 만료되지 않음
      isExpired = false;
    } else {
      try {
        const expDate = new Date(rawExpiredAt);
        if (!isNaN(expDate.getTime())) {
          isExpired = Date.now() > expDate.getTime();
        }
      } catch (e) {
        console.warn('service_expired_at parse error:', e);
      }
    }
  } else if (invitation.wedding_date) {
    // 하위 호환: 컬럼 값이 아직 없는 레코드는 예식일 + 1년으로 fallback
    try {
      const weddingDate = new Date(invitation.wedding_date.replace(' ', 'T'));
      if (!isNaN(weddingDate.getTime())) {
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (Date.now() > weddingDate.getTime() + oneYearMs) {
          isExpired = true;
        }
      }
    } catch (e) {
      console.warn('Wedding date fallback parse error:', e);
    }
  }

  if (isExpired) {
    return <ExpiredWeddingCard invitation={invitation} />;
  }

  const CurrentTemplate = TEMPLATE_MAP[invitation.template_type] || BasicTemplate;
  const isActive = invitation.is_active ?? invitation.template_config?.is_active ?? true;

  const isCinematic = invitation.template_type === 'cinematic';

  return (
    <main className={`min-h-screen ${isCinematic ? 'bg-neutral-100' : 'bg-stone-100'} sm:py-8 flex justify-center p-0 m-0 relative`}>
      {!isActive && <SampleWatermark />}
      <BgmPlayer 
        bgmUrl={invitation.bgm_url} 
        hasIntro={invitation?.template_config?.show_intro !== false} 
        template={invitation.template_type}
      />
      <CurrentTemplate invitation={{ ...invitation, manage_token: undefined, order_code: undefined }} />
    </main>
  );
}