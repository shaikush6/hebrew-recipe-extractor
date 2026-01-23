import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hebrew Recipe Extractor | מחלץ מתכונים',
  description: 'Extract and visualize recipes from any URL with Hebrew and English support',
  keywords: ['recipe', 'extractor', 'hebrew', 'cooking', 'מתכונים'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="auto">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
