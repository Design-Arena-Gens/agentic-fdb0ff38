import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Autonomous Frontier Animated Explainer',
  description:
    'Full-length audio reactive animated experience for Navigating the Autonomous Frontier.',
  openGraph: {
    title: 'Autonomous Frontier Animated Explainer',
    description:
      'Watch a responsive, audio-reactive visualization powered by Navigating the Autonomous Frontier.',
    url: 'https://agentic-fdb0ff38.vercel.app',
    images: [
      {
        url: 'https://nyc3.digitaloceanspaces.com/imagine-explainers/audio-explainers-thumbnail/677d671ccefba3c7c5245cb9/7142fb25-3d99-414c-804b-718842efe318',
        width: 1280,
        height: 720,
        alt: 'Navigating the Autonomous Frontier cover art'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
