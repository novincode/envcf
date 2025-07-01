import { execa } from 'execa';
import chalk from 'chalk';
import type { EnvVar } from './main.js';

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

export async function pushToCloudflare(
  projectName: string, 
  environment: string, 
  envVars: EnvVar[]
): Promise<void> {
  // Check if wrangler is available and user is logged in
  const isAuthenticated = await checkWranglerAuth();
  
  if (!isAuthenticated) {
    throw new Error(
      'Wrangler authentication required. Please run "wrangler login" first.'
    );
  }
  
  console.log(chalk.blue(`🔑 Authenticated with Cloudflare`));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const envVar of envVars) {
    try {
      console.log(chalk.gray(`  Setting ${envVar.key}...`));
      
      const args = ['secret', 'put', envVar.key];
      
      // Add environment flag if not production
      if (environment !== 'production') {
        args.push('--env', environment);
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
