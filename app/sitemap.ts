import { MetadataRoute } from 'next';
import { forests } from './data/forests';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://forestmaker.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const forestEntries: MetadataRoute.Sitemap = forests.map((forest) => ({
    url: `${SITE_URL}/forest/${forest.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...forestEntries,
  ];
}
