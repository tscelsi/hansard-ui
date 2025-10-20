import './globals.css';
import type { Metadata } from 'next';
import { Lora } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Augov Insights',
  description: 'Insights into Australian parliamentary speeches',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={lora.className}>
        <header style={{ padding: '1rem 0' }}>
          <div className="container">
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>Augov Insights</h1>
          </div>
        </header>
        <main className="container" style={{ paddingTop: '0.5rem' }}>{children}</main>
      </body>
    </html>
  );
}
