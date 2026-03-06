import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';
import { prompts } from '@/data/prompts';
import PromptPageContent from '@/components/PromptPageContent';

export function generateStaticParams() {
  return prompts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prompt = prompts.find(p => p.slug === slug);
  if (!prompt) return {};
  return {
    title: `${prompt.title} — AI Health Prompts`,
    description: prompt.tagline,
  };
}

export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prompt = prompts.find(p => p.slug === slug);
  if (!prompt) notFound();

  const filePathEn = path.join(process.cwd(), 'public', 'prompts', prompt.promptFile);
  const filePathEs = path.join(process.cwd(), 'public', 'prompts', prompt.promptFile_es);

  let contentEn: string;
  let contentEs: string;
  try {
    contentEn = await fs.readFile(filePathEn, 'utf-8');
  } catch {
    contentEn = 'Prompt file not found. Check the GitHub repository for the latest version.';
  }
  try {
    contentEs = await fs.readFile(filePathEs, 'utf-8');
  } catch {
    contentEs = contentEn;
  }

  return <PromptPageContent prompt={prompt} content={contentEn} contentEs={contentEs} />;
}
