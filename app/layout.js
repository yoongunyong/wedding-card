import './globals.css';
import { Noto_Serif_KR } from 'next/font/google';

const serifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif-kr',
  display: 'swap',
});

// 모바일 상단 노치/홈바까지 화면 채우기 및 뷰포트 설정
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata = {
  title: '모바일 청첩장',
  description: '소중한 분들을 초대합니다.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={serifKr.variable}>
      <body className="antialiased bg-stone-100 selection:bg-stone-200 m-0 p-0">
        {children}
      </body>
    </html>
  );
}