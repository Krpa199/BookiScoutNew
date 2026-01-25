import { generateDailyArticles, getGenerationStats } from '../src/lib/article-generator';

async function main() {
  console.log('\n🚀 BookiScout Article Generator\n');
  console.log('================================\n');

  // Show current stats
  const stats = getGenerationStats();
  console.log('📊 Current Status:');
  console.log(`   Generated: ${stats.generated}/${stats.total} topics (${stats.percentage}%)`);
  console.log(`   Total articles: ${stats.totalArticles}`);
  console.log(`   Remaining: ${stats.remaining} topics`);
  console.log(`   Last run: ${stats.lastRun || 'Never'}\n`);

  // Generate articles
  const articlesPerRun = parseInt(process.env.ARTICLES_PER_RUN || '10');
  console.log(`\n📝 Generating ${articlesPerRun} new articles...\n`);

  await generateDailyArticles(articlesPerRun);

  // Show updated stats
  const newStats = getGenerationStats();
  console.log('\n================================');
  console.log('📊 Updated Status:');
  console.log(`   Generated: ${newStats.generated}/${newStats.total} topics (${newStats.percentage}%)`);
  console.log(`   Total articles: ${newStats.totalArticles}`);
  console.log(`   This run added: ${newStats.totalArticles - stats.totalArticles} articles`);
  console.log('\n✅ Done!\n');
}

main().catch(console.error);
