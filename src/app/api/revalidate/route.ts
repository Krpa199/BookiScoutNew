/**
 * On-demand revalidation endpoint.
 *
 * Called by the daily article-generation cron AFTER new articles have been pushed
 * to the repo, so the newly added pages get pre-warmed in the ISR cache instead of
 * waiting for the first organic visitor.
 *
 * Usage:
 *   curl -X POST https://bookiscout.com/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"slugs":["new-article-1","new-article-2"]}'
 *
 * Revalidates each slug across all 13 locales (small loop, fast).
 */

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { locales } from '@/i18n/config';

export async function POST(req: NextRequest) {
  // Simple bearer-token auth — set REVALIDATE_SECRET in /opt/bookiscout/.env.production
  const auth = req.headers.get('authorization');
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured on server' },
      { status: 500 },
    );
  }

  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { slugs?: string[]; paths?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const revalidated: string[] = [];

  // Slug-based: revalidate /<locale>/guides/<slug> across all locales
  if (Array.isArray(body.slugs)) {
    for (const slug of body.slugs) {
      for (const locale of locales) {
        const p = `/${locale}/guides/${slug}`;
        revalidatePath(p);
        revalidated.push(p);
      }
    }
  }

  // Raw path passthrough: e.g. ["/hr", "/sitemap.xml"]
  if (Array.isArray(body.paths)) {
    for (const p of body.paths) {
      revalidatePath(p);
      revalidated.push(p);
    }
  }

  return NextResponse.json({
    revalidated: revalidated.length,
    paths: revalidated.slice(0, 20), // sample
  });
}
