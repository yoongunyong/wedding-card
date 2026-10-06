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
    statusBarStyle: 'black-translucent', // 사파리 상태바를 반투명 오버레이로 전환
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={serifKr.variable}>
      <body className="antialiased m-0 p-0 bg-[#FCFBF7]">
        {children}
      </body>
    </html>
  );
}