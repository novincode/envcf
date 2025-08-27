import { execa } from 'execa';
import chalk from 'chalk';
import type { EnvVar } from './main';

export async function checkWranglerAuth(account?: string): Promise<boolean> {
  try {
    if (account) {
      const { stdout } = await execa('npx', ['cfman', 'wrangler', '--account', account, 'whoami'], {
        stdio: 'pipe',
        timeout: 20000
      });
      return stdout.includes('@') || stdout.includes('logged in');
    } else {
      const { stdout } = await execa('wrangler', ['whoami'], {
        stdio: 'pipe',
        timeout: 20000
      });
      return stdout.includes('@') || stdout.includes('logged in');
    }
  } catch {
    return false;
  }
}

export async function detectProjectType(wranglerConfig: any, account?: string): Promise<'pages' | 'workers'> {
  // Check if the config has pages-specific configuration
  if (wranglerConfig.pages_build_output_dir ||
      wranglerConfig.build?.command ||
      wranglerConfig.build?.cwd ||
      wranglerConfig.compatibility_flags) {
    return 'pages';
  }

  // Try to detect by attempting a pages command first
  try {
    if (account) {
      await execa('npx', ['cfman', 'wrangler', '--account', account, 'pages', 'project', 'list'], {
        stdio: 'pipe',
        timeout: 20000,
        reject: false
      });
    } else {
      await execa('wrangler', ['pages', 'project', 'list'], {
        stdio: 'pipe',
        timeout: 20000,
        reject: false
      });
    }
    return 'pages';
  } catch {
    // If pages command fails, assume workers
    return 'workers';
  }
}

export async function pushToCloudflare(
  projectName: string,
  environment: string,
  envVars: EnvVar[],
  wranglerConfig?: any,
  account?: string
): Promise<void> {
  // Check if wrangler is available and user is logged in
  const isAuthenticated = await checkWranglerAuth(account);

  if (!isAuthenticated) {
    if (account) {
      throw new Error(
        `cfman authentication required for account "${account}". Please ensure cfman is installed and the account is configured.`
      );
    } else {
      throw new Error(
        'Wrangler authentication required. Please run "wrangler login" first.'
      );
    }
  }

  if (account) {
    console.log(chalk.blue(`🔑 Authenticated with Cloudflare (Account: ${account})`));
  } else {
    console.log(chalk.blue(`🔑 Authenticated with Cloudflare`));
  }

  // Detect project type
  const projectType = await detectProjectType(wranglerConfig || {}, account);
  console.log(chalk.cyan(`🔍 Detected project type: ${projectType === 'pages' ? 'Cloudflare Pages' : 'Cloudflare Workers'}`));

  let successCount = 0;
  let errorCount = 0;

  for (const envVar of envVars) {
    try {
      console.log(chalk.gray(`  Setting ${envVar.key}...`));

      let execaCommand: string;
      let execaArgs: string[];

      if (account) {
        execaCommand = 'npx';
        execaArgs = ['cfman', 'wrangler', '--account', account];
      } else {
        execaCommand = 'wrangler';
        execaArgs = [];
      }

      if (projectType === 'pages') {
        execaArgs.push('pages', 'secret', 'put', envVar.key);
        // For Pages, add project name
        execaArgs.push('--project-name', projectName);

        // Add environment flag for Pages
        if (environment !== 'production') {
          execaArgs.push('--environment', environment);
        }
      } else {
        execaArgs.push('secret', 'put', envVar.key);

        // Add environment flag for Workers
        if (environment !== 'production') {
          execaArgs.push('--env', environment);
        }
      }

      // Both Pages and Workers use stdin for the value
      await execa(execaCommand, execaArgs, {
        input: envVar.value,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000,
        cwd: process.cwd()
      });

      console.log(chalk.green(`  ✅ ${envVar.key}`));
      successCount++;

    } catch (error) {
      console.log(chalk.red(`  ❌ ${envVar.key}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      errorCount++;
    }
  }

  console.log(chalk.cyan(`\n📊 Results:`));
  console.log(chalk.green(`  ✅ Success: ${successCount}`));

  if (errorCount > 0) {
    console.log(chalk.red(`  ❌ Errors: ${errorCount}`));
    throw new Error(`Failed to push ${errorCount} environment variables`);
  }
}

export async function listCloudflareSecrets(
  projectName: string,
  environment?: string,
  account?: string
): Promise<string[]> {
  try {
    let execaCommand: string;
    let execaArgs: string[];

    if (account) {
      execaCommand = 'npx';
      execaArgs = ['cfman', 'wrangler', '--account', account, 'secret', 'list'];
    } else {
      execaCommand = 'wrangler';
      execaArgs = ['secret', 'list'];
    }

    if (environment && environment !== 'production') {
      execaArgs.push('--env', environment);
    }

    const { stdout } = await execa(execaCommand, execaArgs, {
      stdio: 'pipe',
      timeout: 15000
    });

    // Parse the output to extract secret names
    const lines = stdout.split('\n');
    const secrets: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('Name') && !trimmed.startsWith('---')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length > 0) {
          secrets.push(parts[0]);
        }
      }
    }

    return secrets;
  } catch (error) {
    console.warn(chalk.yellow('⚠️ Could not list existing secrets'));
    return [];
  }
}
