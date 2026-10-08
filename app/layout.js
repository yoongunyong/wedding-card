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
  title: '모바일 청첩장',
  description: '소중한 분들을 초대합니다.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={serifKr.variable}>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased m-0 p-0 bg-[#FCFBF7]">
        {children}
      </body>
    </html>
  );
}