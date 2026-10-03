import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://monoxido1984.github.io/la_espera/'),
  title: 'LA ESPERA · Una historia en datos',
  description: 'Un recorrido interactivo por las listas de espera y donación de órganos en Argentina, con datos públicos CRESI/SINTRA.',
  openGraph: {
    title: 'LA ESPERA · Una historia en datos',
    description: 'Un recorrido interactivo por las listas de espera y donación de órganos en Argentina.',
    type: 'website',
    images: [{ url: '/la_espera/og.png', width: 1200, height: 630, alt: 'La espera — órganos y tejidos en Argentina' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LA ESPERA · Una historia en datos',
    description: 'Un recorrido interactivo por las listas de espera y donación de órganos en Argentina.',
    images: ['/la_espera/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
