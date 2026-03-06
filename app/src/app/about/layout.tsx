import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Hormesis',
  description: 'Built by Iñaki — personal trainer, 5+ years in functional movement & injury rehabilitation.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
