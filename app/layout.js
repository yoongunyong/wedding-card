import './globals.css';
import { Noto_Serif_KR } from 'next/font/google';

const serifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif-kr',
  display: 'swap',
});

export const metadata = {
  title: '모바일 청첩장',
  description: '모바일 청첩장 서비스',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={serifKr.variable}>
      <body className="antialiased selection:bg-stone-200">
        {children}
      </body>
    </html>
  );
}