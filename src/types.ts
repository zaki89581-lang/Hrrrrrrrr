/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectFile {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  content?: string;
  size: number;
}

export type ProjectStack = 
  | 'react-vite' 
  | 'react-cra' 
  | 'nextjs' 
  | 'nodejs-express' 
  | 'static-html' 
  | 'python-flask' 
  | 'python-django' 
  | 'generic'
  | 'laravel-php';

export interface StackInfo {
  type: ProjectStack;
  displayName: string;
  icon: string; // Lucide icon name
  buildCmd: string;
  startCmd: string;
  publishDir: string;
  envVars: string[];
  description: string;
}

export interface GeneratedConfig {
  filename: string;
  content: string;
  description: string;
  language: string;
}
