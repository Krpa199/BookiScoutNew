import { generateDailyArticles, getGenerationStats } from './article-generator';
import { getRemainingCalls } from './gemini';

async function main() {
  console.log('\n🚀 BookiScout Article Generator\n');
  console.log('================================\n');

  // Show current stats
  const stats = getGenerationStats();
  console.log('📊 Current Status:');
  console.log(`   Generated: ${stats.generated}/${stats.total} topics (${stats.percentage}%)`);
  console.log(`   Total articles: ${stats.totalArticles}`);
  console.log(`   Remaining: ${stats.remaining} topics`);
  console.log(`   Last run: ${stats.lastRun || 'Never'}`);

  if (stats.lastSessionStats) {
    console.log(`\n📋 Last Session:`);
    console.log(`   Articles: ${stats.lastSessionStats.articlesGenerated}`);
    console.log(`   Translations: ${stats.lastSessionStats.translationsGenerated}`);
    if (stats.lastSessionStats.stoppedReason) {
      console.log(`   Stopped: ${stats.lastSessionStats.stoppedReason}`);
    }
  }

  // Show API capacity
  const remaining = getRemainingCalls();
  console.log(`\n🔑 API Capacity:`);
  console.log(`   Pro (Gemini 2.5): ${remaining.pro} calls`);
  console.log(`   Flash (2.0 Lite): ${remaining.flash} calls`);

  // Calculate optimal articles count based on Pro capacity
  const articlesPerRun = parseInt(process.env.ARTICLES_PER_RUN || '60');
  const maxPossible = Math.min(articlesPerRun, remaining.pro);

  if (maxPossible <= 0) {
    console.log('\n❌ No API capacity remaining for today.');
    console.log('   Try again tomorrow or add more API keys.');
    return;
  }

  if (maxPossible < articlesPerRun) {
    console.log(`\n⚠️ Requested ${articlesPerRun} articles, but only ${maxPossible} Pro calls available.`);
  }

  console.log(`\n📝 Generating up to ${maxPossible} new articles...\n`);

  await generateDailyArticles(maxPossible);

  // Show updated stats
  const newStats = getGenerationStats();
  console.log('\n================================');
  console.log('📊 Final Status:');
  console.log(`   Generated: ${newStats.generated}/${newStats.total} topics (${newStats.percentage}%)`);
  console.log(`   Total articles: ${newStats.totalArticles}`);
  console.log(`   This run added: ${newStats.totalArticles - stats.totalArticles} articles`);

  // Estimate completion
  const articlesPerDay = maxPossible * 11; // 11 languages
  const daysRemaining = Math.ceil((newStats.remaining * 11) / articlesPerDay);
  console.log(`\n📅 Estimated completion: ~${daysRemaining} days`);

  console.log('\n✅ Done!\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
