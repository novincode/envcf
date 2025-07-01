import fs from 'fs/promises';
import path from 'path';
import toml from '@iarna/toml';
import { parse as parseJsonc } from 'jsonc-parser';

export interface WranglerConfig {
  name?: string;
  compatibility_date?: string;
  [key: string]: any;
}

export async function findWranglerConfig(): Promise<string | null> {
  const possibleFiles = [
    'wrangler.toml',
    'wrangler.jsonc',
    'wrangler.json'
  ];
  
  for (const file of possibleFiles) {
    try {
      await fs.access(file);
      return path.resolve(file);
    } catch {
      // File doesn't exist, continue
    }
  }
  
  return null;
}

export async function parseWranglerConfig(configPath: string): Promise<WranglerConfig> {
  const content = await fs.readFile(configPath, 'utf-8');
  const ext = path.extname(configPath);
  
  try {
    if (ext === '.toml') {
      return toml.parse(content) as WranglerConfig;
    } else if (ext === '.jsonc' || ext === '.json') {
      const parsed = parseJsonc(content);
      return parsed as WranglerConfig;
    }
    
    throw new Error(`Unsupported config file format: ${ext}`);
  } catch (error) {
    throw new Error(`Failed to parse ${path.basename(configPath)}: ${error instanceof Error ? error.message : error}`);
  }
}
