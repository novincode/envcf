import { Command } from 'commander';
import chalk from 'chalk';
import { main } from './main';

const program = new Command();

program
  .name('envcf')
  .description('🚀 Push environment variables to Cloudflare Pages/Workers')
  .version('1.0.1')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-f, --file <file>', 'Specify custom env file path')
  .option('--config <config>', 'Specify custom wrangler config file')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('\n🌥️  EnvCF - Environment Variables to Cloudflare\n'));
      await main(options);
    } catch (error) {
      console.error(chalk.red.bold('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
