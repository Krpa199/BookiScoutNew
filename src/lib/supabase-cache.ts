/**
 * Supabase-based cache for Stay Check
 * - Cache: 1 entry per accommodation (365 days TTL)
 * - Rate limit: 3 checks per day per IP
 * Works on Vercel (unlike file-based cache)
 */

import { createClient } from '@supabase/supabase-js';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Lazy init — avoids crash during Next.js build when env vars aren't available
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase credentials not configured');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

const CACHE_TTL_DAYS = 365;
const DAILY_LIMIT = 3;

// ── Cache ────────────────────────────────────────────────────────────

export interface CachedReport {
  locale: string;
  data: Record<string, unknown>;
}

export async function getCachedReport(key: string): Promise<CachedReport | null> {
  try {
    const { data, error } = await getSupabase()
      .from('stay_check_cache')
      .select('locale, data, created_at')
      .eq('key', key)
      .single() as { data: { locale: string; data: Record<string, unknown>; created_at: string } | null; error: unknown };

    if (error || !data) return null;

    // Check TTL
    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
      await getSupabase().from('stay_check_cache').delete().eq('key', key);
      return null;
    }

    return { locale: data.locale, data: data.data };
  } catch {
    return null;
  }
}

export async function setCachedReport(key: string, locale: string, data: Record<string, unknown>): Promise<void> {
  try {
    await (getSupabase().from('stay_check_cache') as any).upsert({
      key,
      locale,
      data,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Supabase Cache] Write error:', err);
  }
}

// ── Rate Limiting ────────────────────────────────────────────────────

const RATE_LIMIT_MESSAGES: Record<string, string> = {
  en: `You've reached your daily limit of ${DAILY_LIMIT} checks. Please try again tomorrow.`,
  hr: `Dosegli ste dnevni limit od ${DAILY_LIMIT} provjere. Pokušajte ponovo sutra.`,
  de: `Sie haben Ihr Tageslimit von ${DAILY_LIMIT} Prüfungen erreicht. Versuchen Sie es morgen erneut.`,
  it: `Hai raggiunto il limite giornaliero di ${DAILY_LIMIT} controlli. Riprova domani.`,
  fr: `Vous avez atteint votre limite quotidienne de ${DAILY_LIMIT} vérifications. Réessayez demain.`,
  es: `Has alcanzado tu límite diario de ${DAILY_LIMIT} verificaciones. Inténtalo de nuevo mañana.`,
  pl: `Osiągnąłeś dzienny limit ${DAILY_LIMIT} sprawdzeń. Spróbuj ponownie jutro.`,
  cz: `Dosáhli jste denního limitu ${DAILY_LIMIT} kontrol. Zkuste to znovu zítra.`,
  hu: `Elérted a napi ${DAILY_LIMIT} ellenőrzés limitedet. Próbáld újra holnap.`,
  sk: `Dosiahli ste denný limit ${DAILY_LIMIT} kontrol. Skúste to znova zajtra.`,
  nl: `Je hebt je dagelijkse limiet van ${DAILY_LIMIT} controles bereikt. Probeer het morgen opnieuw.`,
  sl: `Dosegli ste dnevno omejitev ${DAILY_LIMIT} preverjanj. Poskusite znova jutri.`,
  ru: `Вы достигли дневного лимита в ${DAILY_LIMIT} проверки. Попробуйте снова завтра.`,
};

export function getRateLimitMessage(locale: string): string {
  return RATE_LIMIT_MESSAGES[locale] || RATE_LIMIT_MESSAGES.en;
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await getSupabase()
      .from('stay_check_rate_limit')
      .select('count')
      .eq('ip', ip)
      .eq('date', today)
      .single() as { data: { count: number } | null };

    return !data || data.count < DAILY_LIMIT;
  } catch {
    return true; // Allow on error
  }
}

export async function incrementRateLimit(ip: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await getSupabase()
      .from('stay_check_rate_limit')
      .select('count')
      .eq('ip', ip)
      .eq('date', today)
      .single() as { data: { count: number } | null };

    if (data) {
      await (getSupabase().from('stay_check_rate_limit') as any)
        .update({ count: data.count + 1 })
        .eq('ip', ip)
        .eq('date', today);
    } else {
      await (getSupabase().from('stay_check_rate_limit') as any)
        .insert({ ip, date: today, count: 1 });
    }
  } catch (err) {
    console.error('[Supabase] Rate limit error:', err);
  }
}
