import '../styles/globals.css';
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  return (
    <div className="site">
      <nav className="site-nav">
        <Link href="/">首頁</Link>
        <Link href="/courses">課程總覽</Link>
        <Link href="/graduation">畢業證書/論文</Link>
        <Link href="/download">下載個人化PDF</Link>
      </nav>
      <main className="site-main">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
