/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { ProjectFile, StackInfo, ProjectStack, GeneratedConfig } from '../types';

// Helper to determine if a file is likely text
const isTextFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const textExtensions = [
    'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'md', 'txt', 'yml', 
    'yaml', 'py', 'php', 'env', 'example', 'ini', 'sh', 'xml', 'config', 'gitignore',
    'sql', 'dockerfile', 'toml', 'jsonld'
  ];
  return ext ? textExtensions.includes(ext) : false;
};

// Extract and parse ZIP file contents
export async function analyzeZip(file: File): Promise<{
  files: ProjectFile[];
  detectedStack: StackInfo;
  generatedConfigs: GeneratedConfig[];
}> {
  const zip = new JSZip();
  const arrayBuffer = await file.arrayBuffer();
  const zipContents = await zip.loadAsync(arrayBuffer);
  
  const files: ProjectFile[] = [];
  
  // Extract file list
  for (const [relativePath, zipEntry] of Object.entries(zipContents.files)) {
    // Skip system/hidden MacOS folders
    if (relativePath.includes('__MACOSX') || relativePath.includes('.DS_Store')) {
      continue;
    }
    
    const isDir = zipEntry.dir;
    let content: string | undefined;
    
    const entryAny = zipEntry as any;
    const rawSize = entryAny._data?.uncompressedSize || 0;
    
    // We only load content for text files and limit size to 1MB to prevent crashing the browser
    if (!isDir && isTextFile(relativePath) && rawSize < 1024 * 1024) {
      content = await zipEntry.async('string');
    }
    
    files.push({
      name: relativePath.split('/').pop() || '',
      relativePath,
      isDirectory: isDir,
      content,
      size: rawSize
    });
  }
  
  // Sort files: directories first, then alphabetical
  files.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.relativePath.localeCompare(b.relativePath);
  });
  
  // Detect Stack
  const detectedStack = detectStack(files);
  
  // Generate configuration files
  const generatedConfigs = generateConfigs(detectedStack, files);
  
  return {
    files,
    detectedStack,
    generatedConfigs
  };
}

// Inspect project files to identify stack/framework
function detectStack(files: ProjectFile[]): StackInfo {
  const fileMap = new Map(files.map(f => [f.relativePath.toLowerCase(), f]));
  
  // 1. Look for package.json
  const packageJsonFile = files.find(f => f.name.toLowerCase() === 'package.json');
  
  if (packageJsonFile && packageJsonFile.content) {
    try {
      const pkg = JSON.parse(packageJsonFile.content);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      
      // Next.js
      if (deps['next']) {
        return {
          type: 'nextjs',
          displayName: 'Next.js Web App',
          icon: 'Globe',
          buildCmd: 'npm install && npm run build',
          startCmd: 'npm start',
          publishDir: '.next',
          envVars: ['DATABASE_URL', 'NEXT_PUBLIC_API_URL'],
          description: 'A React-based fullstack framework with server-side rendering and static export capabilities.'
        };
      }
      
      // React Vite
      if ((deps['vite'] || deps['@tailwindcss/vite']) && deps['react']) {
        return {
          type: 'react-vite',
          displayName: 'Vite React App',
          icon: 'Flame',
          buildCmd: 'npm install && npm run build',
          startCmd: '', // Static Site (no start command needed, just files served from publishDir)
          publishDir: 'dist',
          envVars: ['VITE_API_URL'],
          description: 'A ultra-fast, modern React SPA bundled with Vite. Deploys seamlessly as a Static Site.'
        };
      }
      
      // React CRA (Create React App)
      if (deps['react-scripts']) {
        return {
          type: 'react-cra',
          displayName: 'Create React App',
          icon: 'Layers',
          buildCmd: 'npm install && npm run build',
          startCmd: '', // Static Site
          publishDir: 'build',
          envVars: ['REACT_APP_API_URL'],
          description: 'A classical single-page React application compiled using Webpack (react-scripts).'
        };
      }
      
      // Node/Express Backend
      if (deps['express'] || deps['koa'] || deps['fastify'] || deps['@nestjs/core'] || fileMap.has('server.js') || fileMap.has('server.ts') || fileMap.has('index.js')) {
        let startScript = 'npm start';
        if (pkg.scripts && pkg.scripts.start) {
          startScript = 'npm start';
        } else if (pkg.scripts && pkg.scripts.dev) {
          startScript = 'npm run dev';
        } else {
          startScript = pkg.main ? `node ${pkg.main}` : 'node index.js';
        }
        
        return {
          type: 'nodejs-express',
          displayName: 'Node.js Express Backend',
          icon: 'Server',
          buildCmd: 'npm install',
          startCmd: startScript,
          publishDir: '', // Web Service
          envVars: ['PORT', 'NODE_ENV', 'DATABASE_URL', 'SESSION_SECRET'],
          description: 'A backend server running Node.js. Requires running continuously as a Render Web Service.'
        };
      }
    } catch (e) {
      console.error('Error parsing package.json:', e);
    }
  }
  
  // 2. Look for Python files
  const pythonFiles = files.filter(f => f.name.endsWith('.py'));
  const requirementsTxt = files.find(f => f.name.toLowerCase() === 'requirements.txt');
  const managePy = files.find(f => f.name.toLowerCase() === 'manage.py');
  
  if (pythonFiles.length > 0 || requirementsTxt) {
    if (managePy || files.some(f => f.relativePath.includes('settings.py'))) {
      // Django
      return {
        type: 'python-django',
        displayName: 'Django Python App',
        icon: 'Database',
        buildCmd: 'pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate',
        startCmd: 'gunicorn myproject.wsgi:application',
        publishDir: '',
        envVars: ['SECRET_KEY', 'DEBUG', 'DATABASE_URL', 'ALLOWED_HOSTS'],
        description: 'A robust Python web framework equipped with ORM, auth, and pre-built features.'
      };
    }
    
    // Flask (or FastAPI/General Python)
    const isFastApi = files.some(f => f.content?.includes('FastAPI') || f.content?.includes('fastapi'));
    return {
      type: 'python-flask',
      displayName: isFastApi ? 'FastAPI Python App' : 'Flask Python App',
      icon: 'Shield',
      buildCmd: 'pip install -r requirements.txt',
      startCmd: isFastApi ? 'uvicorn main:app --host 0.0.0.0 --port 10000' : 'gunicorn app:app',
      publishDir: '',
      envVars: ['SECRET_KEY', 'DATABASE_URL', 'FLASK_ENV'],
      description: isFastApi ? 'A modern, high-performance web API built on Python using FastAPI.' : 'A lightweight Python backend built using the Flask web library.'
    };
  }
  
  // 3. PHP Laravel
  const artisan = files.find(f => f.name.toLowerCase() === 'artisan');
  const composerJson = files.find(f => f.name.toLowerCase() === 'composer.json');
  if (artisan || composerJson) {
    return {
      type: 'laravel-php',
      displayName: 'Laravel PHP App',
      icon: 'Coffee',
      buildCmd: 'composer install --no-dev --optimize-autoloader && npm install && npm run build',
      startCmd: 'php artisan serve --host=0.0.0.0 --port=10000',
      publishDir: 'public',
      envVars: ['APP_KEY', 'APP_ENV', 'DB_CONNECTION', 'DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'],
      description: 'A comprehensive PHP framework for building modern web applications.'
    };
  }
  
  // 4. Static HTML/CSS/JS (no active backend required)
  const hasHtml = files.some(f => f.name.toLowerCase().endsWith('.html'));
  if (hasHtml || fileMap.has('index.html')) {
    return {
      type: 'static-html',
      displayName: 'Static Website',
      icon: 'FileCode',
      buildCmd: '', // None
      startCmd: '', // None
      publishDir: '.', // Current dir or root
      envVars: [],
      description: 'A client-side static project of pure HTML, CSS, and vanilla JS. Deploys instantly for free as a Static Site.'
    };
  }
  
  // 5. Generic/Unknown App
  return {
    type: 'generic',
    displayName: 'Custom Project',
    icon: 'Package',
    buildCmd: 'npm install && npm run build',
    startCmd: 'npm start',
    publishDir: 'dist',
    envVars: ['PORT', 'API_KEY'],
    description: 'A custom or polyglot workspace framework. Standard configurations have been pre-filled.'
  };
}

// Generate configuration files based on the stack detected
function generateConfigs(stack: StackInfo, files: ProjectFile[]): GeneratedConfig[] {
  const configs: GeneratedConfig[] = [];
  const isWebService = stack.publishDir === '' || ['nodejs-express', 'python-flask', 'python-django', 'nextjs', 'generic'].includes(stack.type);
  
  // 1. Generate render.yaml
  let renderYaml = `# Dynamic Render Infrastructure-as-Code Setup
# Place this at the root of your repository, and import it into Render.
# For more info: https://render.com/docs/yaml-spece

services:
  - type: ${isWebService ? 'web' : 'static'}
    name: ${stack.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
    env: ${isWebService ? 'node' : 'static'}
    plan: free
    buildCommand: "${stack.buildCmd || 'echo \"Static Site No-Build\"'}"
`;

  if (isWebService) {
    renderYaml += `    startCommand: "${stack.startCmd}"
`;
  } else {
    renderYaml += `    publishPath: "./${stack.publishDir}"
`;
  }
  
  if (stack.envVars.length > 0) {
    renderYaml += `    envVars:
`;
    stack.envVars.forEach(v => {
      if (v === 'PORT') {
        renderYaml += `      - key: PORT
        value: 10000
`;
      } else if (v === 'NODE_ENV' || v === 'APP_ENV') {
        renderYaml += `      - key: ${v}
        value: production
`;
      } else {
        renderYaml += `      - key: ${v}
        sync: false # Set value in Render UI
`;
      }
    });
  }
  
  configs.push({
    filename: 'render.yaml',
    content: renderYaml,
    description: 'Automates Render deployments using Infrastructure-as-code.',
    language: 'yaml'
  });
  
  // 2. Generate custom .gitignore if not present, or optimized variant
  const hasGitignore = files.some(f => f.name === '.gitignore');
  let gitignoreContent = '';
  
  if (['react-vite', 'react-cra', 'nextjs', 'nodejs-express', 'generic'].includes(stack.type)) {
    gitignoreContent = `# Dependency directories
node_modules/
jspm_packages/

# Logs
logs/
*.log
npm-debug.log*

# Build directories
dist/
build/
.next/
out/

# Environment variables (Crucial for Render/Git safety!)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# System Files 
.DS_Store
Thumbs.db
`;
  } else if (stack.type.startsWith('python')) {
    gitignoreContent = `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Distribution / packaging
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/

# Environments
.env
.venv
env/
venv/
ENV/

# Database files (local db should NOT go to Git)
*.sqlite3
`;
  } else {
    gitignoreContent = `node_modules/
dist/
build/
.env
.DS_Store
`;
  }
  
  configs.push({
    filename: '.gitignore',
    content: gitignoreContent,
    description: hasGitignore 
      ? 'Optimized gitignore structure. Verify your project includes these limits so secrets or large directories DO NOT push to Git.' 
      : 'Auto-generated .gitignore to stop exposing secret key data and massive package files to GitHub.',
    language: 'plaintext'
  });

  // 3. Generate a robust README.md packed with deployment guidelines
  const readmeContent = `# ${stack.displayName} Deployment System

This folder houses the deployment blueprint configured to link your local codebase with GitHub and scale on **Render.com**.

## 🚀 Easy 3-Step Setup

### Step 1: Initialize Git and Push to GitHub
If you haven't uploaded your code to GitHub yet, launch your terminal in the project directory and invoke:

\`\`\`bash
# Initialize a new git index
git init

# Track all project files
git add .

# Save with a descriptive commit
git commit -m "feat: design render ready system"

# Connect with your remote GitHub target (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Set active branch to main
git branch -M main

# Stream the files up
git push -u origin main
\`\`\`

### Step 2: Set up on Render.com
1. Register or Log in at [Render.com](https://render.com).
2. Tap **"New"** (top-right corner) and select **"Blueprint"** (or select **"Web Service"** / **"Static Site"** matching your type).
3. Authorize or input your GitHub Repository URL.
4. Render will read your root \`render.yaml\` automatically and set up:
   * **Instance Type**: ${isWebService ? 'Web Service (Free tier)' : 'Static Site (Free tier)'}
   * **Build Command**: \`${stack.buildCmd || 'None'}\`
   * **${isWebService ? 'Start Command' : 'Publish Directory'}**: \`${isWebService ? stack.startCmd : stack.publishDir}\`

### Step 3: Populate Environment Keys
${stack.envVars.length > 0 
  ? `This system requires configuration parameters. Enter the Render Dashboard, browse to the **Environment** Tab, and fill:
${stack.envVars.map(v => `* \`${v}\`: (e.g. your connection keys)`).join('\n')}`
  : 'This project is client-only static which doesn\'t require database keys or environment configurations.'}

---
*Created by the Google AI Studio Deployment Architect.*
`;

  configs.push({
    filename: 'DEPLOYMENT_GUIDE.md',
    content: readmeContent,
    description: 'Detailed interactive manual showing git commands and setups tailored to your codebase.',
    language: 'markdown'
  });

  return configs;
}
