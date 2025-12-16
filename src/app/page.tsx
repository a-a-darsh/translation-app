// Main page component for the translation app
// This is the entry point that renders our translation interface

import TranslationInterface from '../components/TranslationInterface';

export default function Home() {
  return (
      <main className="min-h-screen bg-zinc-50 dark:bg-black py-8">
        <TranslationInterface />
      </main>
  );
}