import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';
import type { EnvVar } from './main';

export async function findEnvFiles(customFile?: string): Promise<string[]> {
  if (customFile) {
    try {
      await fs.access(customFile);
      return [customFile];
    } catch {
      throw new Error(`Custom env file not found: ${customFile}`);
    }
  }
  
  const possibleFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.preview',
    '.env.development'
  ];
  
  const existingFiles: string[] = [];
  
  for (const file of possibleFiles) {
    try {
      await fs.access(file);
      existingFiles.push(file);
    } catch {
      // File doesn't exist, continue
    }
  }
  
  return existingFiles;
}

export async function parseEnvFile(filePath: string): Promise<EnvVar[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse using dotenv
    const parsed = config({ path: filePath }).parsed || {};
    
    // Also manually parse to handle edge cases
    const lines = content.split('\n');
    const manualParsed: Record<string, string> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          let value = trimmed.substring(equalIndex + 1).trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          manualParsed[key] = value;
        }
      }
    }
    
    // Combine both parsing methods, preferring manual parsing
    const combined = { ...parsed, ...manualParsed };
    
    return Object.entries(combined)
      .filter(([key, value]) => key && value !== undefined)
      .map(([key, value]) => ({
        key,
        value: String(value),
        source: path.basename(filePath)
      }));
      
  } catch (error) {
    throw new Error(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : error}`);
  }
}
