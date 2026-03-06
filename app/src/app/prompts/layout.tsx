import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Health Prompts — Hormesis',
  description: '6 AI health prompts for training, nutrition, sleep, back pain, CrossFit, and pelvic floor. Copy, paste into ChatGPT or Claude, and get a personal coach.',
};

export default function PromptsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
