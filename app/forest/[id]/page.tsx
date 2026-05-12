import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { forests, Forest } from '../../data/forests';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://forestmaker.vercel.app';

const SOUND_LABELS: Record<string, string> = {
  wind: 'Wind',
  rain: 'Rain',
  birds: 'Birds',
  thunder: 'Thunder',
  water: 'Water',
  insects: 'Insects',
  mammals: 'Mammals',
  fire: 'Fire',
  ambient: 'Ambient',
  spiritual: 'Spiritual',
};

function getForestById(id: string): Forest | undefined {
  return forests.find((f) => f.id === id);
}

export async function generateStaticParams() {
  return forests.map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const forest = getForestById(params.id);
  if (!forest) return {};

  const title = `${forest.name} Sounds – Forest Maker`;
  const description =
    forest.description ||
    `Listen to ${forest.name} ambient sounds. Mix rain, wind, birds, and more to create the perfect ${forest.name} soundscape for sleep, focus, or meditation.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/forest/${forest.id}`,
      siteName: 'Forest Maker',
      images: [{ url: `${SITE_URL}${forest.imageUrl}`, alt: forest.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}${forest.imageUrl}`],
    },
    alternates: {
      canonical: `${SITE_URL}/forest/${forest.id}`,
    },
  };
}

function SoundBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  if (pct === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-right text-white/70 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/60 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-xs text-white/50 tabular-nums">{pct}%</span>
    </div>
  );
}

function ForestJsonLd({ forest }: { forest: Forest }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/forest/${forest.id}`,
        url: `${SITE_URL}/forest/${forest.id}`,
        name: `${forest.name} Sounds – Forest Maker`,
        description: forest.description,
        isPartOf: { '@id': SITE_URL },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${SITE_URL}${forest.imageUrl}`,
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Forest Maker',
        url: SITE_URL,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: `Create your perfect ${forest.name} soundscape by mixing nature sounds including rain, wind, birds, insects, and more.`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function ForestPage({ params }: { params: { id: string } }) {
  const forest = getForestById(params.id);
  if (!forest) notFound();

  const vibeTags = (forest.vibe || '').split(',').map((t) => t.trim()).filter(Boolean);
  const dominantSounds = Object.entries(forest.soundProfile)
    .filter(([, v]) => v >= 0.6)
    .map(([k]) => SOUND_LABELS[k] || k);

  return (
    <>
      <ForestJsonLd forest={forest} />

      <main className="min-h-screen bg-gray-950 text-white">
        {/* Hero */}
        <div className="relative h-[55vh] min-h-[320px] w-full overflow-hidden">
          <Image
            src={forest.imageUrl}
            alt={`${forest.name} — ambient soundscape`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-gray-950" />

          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm text-white/60 mb-1 uppercase tracking-widest font-medium">
                {forest.location}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                {forest.name}
              </h1>
              {vibeTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {vibeTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm text-white/80 border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

          {/* Description */}
          {forest.description && (
            <section aria-label="About this forest">
              <p className="text-lg text-white/80 leading-relaxed">
                {forest.description}
              </p>
            </section>
          )}

          {/* Sound profile */}
          <section aria-label="Sound profile">
            <h2 className="text-xl font-semibold text-white mb-4">
              Sound Profile
            </h2>
            <div className="space-y-3 bg-white/5 rounded-2xl p-5 border border-white/10">
              {Object.entries(forest.soundProfile).map(([key, value]) => (
                <SoundBar key={key} label={SOUND_LABELS[key] || key} value={value} />
              ))}
            </div>
            {dominantSounds.length > 0 && (
              <p className="mt-3 text-sm text-white/50">
                Dominant sounds: {dominantSounds.join(', ')}
              </p>
            )}
          </section>

          {/* CTA */}
          <section aria-label="Play this soundscape">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">
                Experience the {forest.name}
              </h2>
              <p className="text-white/60 text-sm mb-5">
                Open Forest Maker and this soundscape loads automatically — adjust any
                slider to make it your own.
              </p>
              <Link
                href={`/?forest=${forest.id}`}
                className="inline-block bg-white text-gray-950 font-semibold px-7 py-3 rounded-full hover:bg-white/90 transition-colors"
              >
                Play {forest.name} Sounds
              </Link>
            </div>
          </section>

          {/* Back link */}
          <div className="pb-6">
            <Link
              href="/"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              ← All forests
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
