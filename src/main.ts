import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { findWranglerConfig, parseWranglerConfig } from './config';
import { findEnvFiles, parseEnvFile } from './env';
import { pushToCloudflare } from './cloudflare';

export interface CliOptions {
  dryRun?: boolean;
  file?: string;
  config?: string;
}

export interface EnvVar {
  key: string;
  value: string;
  source: string;
}

export async function main(options: CliOptions): Promise<void> {
  try {
    // Step 1: Find and parse wrangler config
    console.log(chalk.cyan('🔍 Looking for wrangler configuration...'));
    const configPath = options.config || await findWranglerConfig();
    
    if (!configPath) {
      throw new Error('No wrangler.toml or wrangler.jsonc found in current directory');
    }
    
    console.log(chalk.green(`✅ Found config: ${path.basename(configPath)}`));
    const wranglerConfig = await parseWranglerConfig(configPath);
    
    if (!wranglerConfig.name) {
      throw new Error('Project name not found in wrangler configuration');
    }
    
    console.log(chalk.blue(`📦 Project: ${wranglerConfig.name}`));
    
    // Step 2: Choose environment
    const { environment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Which environment do you want to deploy to?',
        choices: [
          { name: '🚀 Production', value: 'production' },
          { name: '🧪 Preview', value: 'preview' },
        ],
      },
    ]);
    
    // Step 3: Find and select env files
    console.log(chalk.cyan('\n🔍 Looking for environment files...'));
    const envFiles = await findEnvFiles(options.file);
    
    if (envFiles.length === 0) {
      throw new Error('No .env files found in current directory');
    }
    
    const { selectedFiles } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedFiles',
        message: 'Which environment files do you want to use?',
        choices: [
          ...envFiles.map((file: string) => ({ name: `📄 ${file}`, value: file })),
          { name: '📁 All files', value: 'all' },
        ],
        validate: (input) => {
          if (input.length === 0) {
            return 'Please select at least one file';
          }
          return true;
        },
      },
    ]);
    
    // Handle "all" selection
    const filesToProcess = selectedFiles.includes('all') ? envFiles : selectedFiles;
    
    // Step 4: Parse environment variables
    console.log(chalk.cyan('\n📝 Parsing environment variables...'));
    const allEnvVars: EnvVar[] = [];
    
    for (const file of filesToProcess) {
      const vars = await parseEnvFile(file);
      allEnvVars.push(...vars);
    }
    
    if (allEnvVars.length === 0) {
      throw new Error('No environment variables found in selected files');
    }
    
    console.log(chalk.green(`✅ Found ${allEnvVars.length} environment variables`));
    
    // Step 5: Show preview and confirm
    console.log(chalk.yellow('\n📋 Environment variables to be pushed:'));
    allEnvVars.forEach(({ key, source }) => {
      console.log(chalk.gray(`  • ${key} (from ${source})`));
    });
    
    if (options.dryRun) {
      console.log(chalk.blue('\n🏃‍♂️ Dry run mode - no changes will be made'));
      return;
    }
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Push these ${allEnvVars.length} variables to ${environment}?`,
        default: false,
      },
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('❌ Operation cancelled'));
      return;
    }
    
    // Step 6: Push to Cloudflare
    console.log(chalk.cyan('\n🚀 Pushing to Cloudflare...'));
    await pushToCloudflare(wranglerConfig.name, environment, allEnvVars);
    
    console.log(chalk.green.bold('\n✨ All environment variables pushed successfully!'));
    
  } catch (error) {
    throw error;
  }
}
