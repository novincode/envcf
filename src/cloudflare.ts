import { execa } from 'execa';
import chalk from 'chalk';
import type { EnvVar } from './main';

export async function checkWranglerAuth(): Promise<boolean> {
  try {
    const { stdout } = await execa('wrangler', ['whoami'], { 
      stdio: 'pipe',
      timeout: 10000 
    });
    return stdout.includes('@') || stdout.includes('logged in');
  } catch {
    return false;
  }
}

export async function detectProjectType(wranglerConfig: any): Promise<'pages' | 'workers'> {
  // Check if the config has pages-specific configuration
  if (wranglerConfig.pages_build_output_dir || 
      wranglerConfig.build?.command || 
      wranglerConfig.build?.cwd ||
      wranglerConfig.compatibility_flags) {
    return 'pages';
  }
  
  // Try to detect by attempting a pages command first
  try {
    await execa('wrangler', ['pages', 'project', 'list'], {
      stdio: 'pipe',
      timeout: 5000,
      reject: false
    });
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
  wranglerConfig?: any
): Promise<void> {
  // Check if wrangler is available and user is logged in
  const isAuthenticated = await checkWranglerAuth();
  
  if (!isAuthenticated) {
    throw new Error(
      'Wrangler authentication required. Please run "wrangler login" first.'
    );
  }
  
  console.log(chalk.blue(`🔑 Authenticated with Cloudflare`));
  
  // Detect project type
  const projectType = await detectProjectType(wranglerConfig || {});
  console.log(chalk.cyan(`🔍 Detected project type: ${projectType === 'pages' ? 'Cloudflare Pages' : 'Cloudflare Workers'}`));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const envVar of envVars) {
    try {
      console.log(chalk.gray(`  Setting ${envVar.key}...`));
      
      let args: string[];
      
      if (projectType === 'pages') {
        args = ['pages', 'secret', 'put', envVar.key];
        // For Pages, add project name
        args.push('--project-name', projectName);
        
        // Add environment flag for Pages
        if (environment !== 'production') {
          args.push('--environment', environment);
        }
      } else {
        args = ['secret', 'put', envVar.key];
        
        // Add environment flag for Workers
        if (environment !== 'production') {
          args.push('--env', environment);
        }
      }
      
      // Use execa to run wrangler command with input
      await execa('wrangler', args, {
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
  environment?: string
): Promise<string[]> {
  try {
    const args = ['secret', 'list'];
    
    if (environment && environment !== 'production') {
      args.push('--env', environment);
    }
    
    const { stdout } = await execa('wrangler', args, {
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
