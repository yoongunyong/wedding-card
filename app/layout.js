import './globals.css';
import { Noto_Serif_KR } from 'next/font/google';

const serifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif-kr',
  display: 'swap',
});

// 아이폰 사파리 전체 화면 확장 뷰포트
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // 상단 노치/상태바 영역까지 도큐먼트 확장
};

export const metadata = {
  title: 'ATELIER DE MUKIRU (아틀리에 드 무키루) — 감성 프리미엄 모바일 청첩장',
  description: '단 하나의 소중한 순간을 완성하는 부티크 모바일 청첩장 아틀리에, 무키루(MUKIRU)',
  openGraph: {
    title: 'ATELIER DE MUKIRU — 감성 프리미엄 모바일 청첩장',
    description: '단 하나의 소중한 순간을 완성하는 부티크 모바일 청첩장 아틀리에, 무키루(MUKIRU)',
    siteName: 'ATELIER DE MUKIRU',
    locale: 'ko_KR',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={serifKr.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 에디토리얼 & 플레이리스트 감성 세리프 및 필기체 폰트 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,600&family=Italiana&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Caveat:wght@400;600&family=Noto+Serif+KR:wght@300;400;500;600;700&display=swap"
        />
        {/* 프리텐다드 한글 기본 고딕 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased m-0 p-0 bg-white">
        {children}
      </body>
    </html>
  );
}