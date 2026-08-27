import './globals.css';

export const metadata = {
  title: 'CoolCommute | Hackathon 26',
  description: 'AI-powered route optimization to avoid urban heat islands.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
