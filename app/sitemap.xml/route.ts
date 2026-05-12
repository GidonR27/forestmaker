import { NextResponse } from 'next/server';
import { forests } from '../data/forests';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://forestmaker.vercel.app').replace(/\/$/, '');

export async function GET() {
  const now = new Date().toISOString();

  const urls = [
    { loc: SITE_URL, priority: '1.0' },
    ...forests.map((f) => ({ loc: `${SITE_URL}/forest/${f.id}`, priority: '0.8' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
