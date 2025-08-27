import { Command } from 'commander';
import chalk from 'chalk';
import { main } from './main';

const program = new Command();

program
  .name('envcf')
  .description('🚀 Push environment variables to Cloudflare Pages/Workers\n💡 Supports cfman for multi-account management')
  .version('1.1.3')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-f, --file <file>', 'Specify custom env file path')
  .option('--config <config>', 'Specify custom wrangler config file')
  .option('--account <account>', 'Use cfman account for multi-account management')
  .addHelpText('after', `
Examples:
  $ envcf                              # Use default wrangler auth
  $ envcf --account production         # Use cfman account "production"
  $ envcf --account staging --dry-run  # Preview changes for staging account
  $ envcf --file .env.custom           # Use custom env file

Multi-Account Setup:
  $ npx cfman token add --name production --token cf_xxx
  $ npx cfman token add --name staging --token cf_yyy
  $ envcf --account production
  
📖 Learn more: https://github.com/novincode/envcf`)
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
