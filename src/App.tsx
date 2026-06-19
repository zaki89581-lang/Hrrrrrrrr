/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileArchive, Globe, Terminal, Cpu, FileText, Download, HelpCircle, 
  Sparkles, CheckCircle2, ChevronRight, Play, RefreshCw, Layers 
} from 'lucide-react';
import { ProjectFile, StackInfo, GeneratedConfig, ProjectStack } from './types';
import { analyzeZip } from './utils/analyzer';
import ZipUploader from './components/ZipUploader';
import FileExplorer from './components/FileExplorer';
import DeploymentWizard from './components/DeploymentWizard';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar'); // Default to Arabic as requested in user prompt
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Analyzed data state
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [detectedStack, setDetectedStack] = useState<StackInfo | null>(null);
  const [generatedConfigs, setGeneratedConfigs] = useState<GeneratedConfig[]>([]);
  
  // Selected file for code preview
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [copiedFile, setCopiedFile] = useState(false);

  const t = {
    en: {
      appName: 'GitHub & Render Deployer',
      subtitle: 'Analyze your project zip, prepare it for Git, and set up Render cloud hosting in seconds.',
      introTitle: 'Upload & Prepare Your Project',
      introDesc: 'Drag into the panel your project directory zipped (.zip) or load our workspace demo below to review how our setup configures everything for render.',
      loadDemoReact: 'Load Demo React App Workspace',
      loadDemoNode: 'Load Demo Node.js Express Backend',
      exploreTitle: 'Extracted Files Explorer',
      codePreview: 'Code Previewer',
      selectToPreview: 'Select any text file in the explorer tree to review its source code directly.',
      sizeLabel: 'Size',
      copyFile: 'Copy Code',
      copied: 'Copied!',
      backToTop: 'Upload different file',
      whyTitle: 'Why Render & GitHub?',
      whyGitTitle: 'Version Control',
      whyGitDesc: 'GitHub keeps a pristine record of your development and secures code from sudden computer failures.',
      whyRenderTitle: 'Instant Free Hosting',
      whyRenderDesc: 'Render links with Git to build your dynamic sites or web servers on the web on every commit instantly.',
    },
    ar: {
      appName: 'مساعد الرفع على GitHub و Render',
      subtitle: 'ارفع ملف مشروعك الـ ZIP، وحلله يدوياً، واستخرج تفاصيل البناء وأوامر الـ Git الجاهزة في ثوانٍ معدودة.',
      introTitle: 'ارفع كود مشروعك للتحليل والإعداد',
      introDesc: 'قم بسحب وإفلات مجلد مشروعك المضغوط بصيغة (.zip) في المساحة المخصصة، أو جرب أحد المشاريع التجريبية الجاهزة بالأسفل لمعاينة طريقة عمل المساعد:',
      loadDemoReact: 'تجربة محاكاة مشروع React جاهز',
      loadDemoNode: 'تجربة محاكاة خادم Node.js Express',
      exploreTitle: 'مستكشف الملفات المرفقة للمشروع',
      codePreview: 'عارض محتويات الملفات المفتوحة',
      selectToPreview: 'اختر أي ملف نصي من شجرة مستكشف الملفات الجانبية لقراءة سطور برمجياته مباشرة.',
      sizeLabel: 'الحجم',
      copyFile: 'نسخ محتويات الملف',
      copied: 'تم النسخ!',
      backToTop: 'تحميل ملف مضغوط آخر',
      whyTitle: 'لماذا منصة GitHub وموقع Render تحديداً؟',
      whyGitTitle: 'إدارة وإصدارات الأكواد',
      whyGitDesc: 'يحفظ GitHub مستندات مشروعك سحابياً بشكل منظم، لتبسيط التعاون وتأمين الكود من الضياع أو التلف.',
      whyRenderTitle: 'استضافة سحابية سريعة ومجانية',
      whyRenderDesc: 'موقع Render يتصل مباشرة بـ GitHub لبناء الأكواد وتشغيل المواقع الثابتة والخوادم سحابياً بشكل مجاني مع كل تحديث.',
    }
  }[lang];

  // Handles real ZIP file processing
  const handleFileSelect = async (selectedFile: File) => {
    setIsLoading(true);
    setFile(selectedFile);
    
    try {
      const result = await analyzeZip(selectedFile);
      setFiles(result.files);
      setDetectedStack(result.detectedStack);
      setGeneratedConfigs(result.generatedConfigs);
      
      // Auto-select package.json or index.html if found
      const defaultPreview = result.files.find(
        f => f.name.toLowerCase() === 'package.json' || f.name.toLowerCase() === 'index.html'
      ) || result.files.find(f => !f.isDirectory && f.content);
      
      if (defaultPreview) {
        setSelectedFile(defaultPreview);
      } else {
        setSelectedFile(null);
      }
    } catch (e) {
      console.error('Error analyzing zip bundle:', e);
      alert(lang === 'ar' ? 'فشل تحليل ملف zip. يرجى التأكد من أنه أرشيف صالح وغير معطوب.' : 'Failed to parse ZIP folder. Please make sure the archive is valid.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loads customized mocked Demo project structure
  const loadDemo = (type: 'react' | 'node') => {
    setIsLoading(true);
    setFile(new File(['demo'], type === 'react' ? 'my-react-app-workspace.zip' : 'express-backend-project.zip'));
    
    setTimeout(() => {
      let demoFiles: ProjectFile[] = [];
      let demoStack: StackInfo;
      
      if (type === 'react') {
        demoFiles = [
          { name: 'package.json', relativePath: 'package.json', isDirectory: false, size: 450, content: `{
  "name": "my-react-vite-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.2"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}` },
          { name: 'index.html', relativePath: 'index.html', isDirectory: false, size: 280, content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>React App Demo</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>` },
          { name: 'src', relativePath: 'src', isDirectory: true, size: 0 },
          { name: 'main.tsx', relativePath: 'src/main.tsx', isDirectory: false, size: 210, content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);` },
          { name: 'App.tsx', relativePath: 'src/App.tsx', isDirectory: false, size: 340, content: `export default function App() {
  return (
    <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
      <h1 className="text-3xl font-bold">Hello World from React+Vite!</h1>
    </div>
  );
}` },
          { name: 'vite.config.ts', relativePath: 'vite.config.ts', isDirectory: false, size: 210, content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});` }
        ];

        demoStack = {
          type: 'react-vite',
          displayName: 'Vite React App (المحاكاة تجريبية)',
          icon: 'Flame',
          buildCmd: 'npm install && npm run build',
          startCmd: '',
          publishDir: 'dist',
          envVars: ['VITE_API_URL', 'VITE_FIREBASE_KEY'],
          description: 'A React workspace bundled with Vite. Setup utilizes Static Site rendering on Render.'
        };
      } else {
        demoFiles = [
          { name: 'package.json', relativePath: 'package.json', isDirectory: false, size: 380, content: `{
  "name": "express-backend-app",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}` },
          { name: 'server.js', relativePath: 'server.js', isDirectory: false, size: 520, content: `const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
  res.json({ status: "alive", timestamp: new Date() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server is running on port ' + PORT);
});` },
          { name: '.env.example', relativePath: '.env.example', isDirectory: false, size: 90, content: `PORT=3000
DATABASE_URL=
JWT_SECRET=your_jwt_secret_token` }
        ];

        demoStack = {
          type: 'nodejs-express',
          displayName: 'Node.js Express Backend (المحاكاة تجريبية)',
          icon: 'Server',
          buildCmd: 'npm install',
          startCmd: 'node server.js',
          publishDir: '',
          envVars: ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'CORS_ALLOWED_ORIGINS'],
          description: 'A pure Node.js Express backend API applet. Needs continuous execution Web Service on Render.'
        };
      }

      // Generate configuration files for this demo
      const configs = [
        {
          filename: 'render.yaml',
          content: `# Render IaC config for ${type === 'react' ? 'React app' : 'Express backend'}
services:
  - type: ${type === 'react' ? 'static' : 'web'}
    name: ${type === 'react' ? 'my-react-vite-app' : 'express-backend-service'}
    env: ${type === 'react' ? 'static' : 'node'}
    plan: free
    buildCommand: "${demoStack.buildCmd}"
    ${type === 'react' ? `publishPath: "./dist"` : `startCommand: "node server.js"\n    envVars:\n      - key: PORT\n        value: 10000`}
`,
          description: 'Render blueprint Infrastructure as Code definition.',
          language: 'yaml'
        },
        {
          filename: '.gitignore',
          content: `node_modules/
dist/
.env
.DS_Store
`,
          description: 'Standard safe gitignores to secure secrets.',
          language: 'plaintext'
        },
        {
          filename: 'DEPLOYMENT_GUIDE.md',
          content: `# Custom manual for ${demoStack.displayName}
1. run \`git init\` inside your folder.
2. commit codes and push to GitHub.
3. host service on Render!
`,
          description: 'Bespoke step-by-step local workspace checklist.',
          language: 'markdown'
        }
      ];

      setFiles(demoFiles);
      setDetectedStack(demoStack);
      setGeneratedConfigs(configs);
      setSelectedFile(demoFiles[0]);
      setIsLoading(false);
    }, 700);
  };

  // Handles manual overrides from user dropdown
  const handleStackOverride = (newType: ProjectStack) => {
    if (!detectedStack) return;
    
    // Quick custom map of build/run specifications matching chosen override type
    const overrides: Record<ProjectStack, Partial<StackInfo>> = {
      'react-vite': {
        displayName: 'Vite React App',
        buildCmd: 'npm install && npm run build',
        startCmd: '',
        publishDir: 'dist',
        envVars: ['VITE_API_URL'],
        description: 'React SPA hosted securely as a high-performance static page directly on CDN.'
      },
      'react-cra': {
        displayName: 'Create React App',
        buildCmd: 'npm install && npm run build',
        startCmd: '',
        publishDir: 'build',
        envVars: ['REACT_APP_API_URL'],
        description: 'Traditional CRA static architecture served using Render Static Site.'
      },
      nextjs: {
        displayName: 'Next.js Web App',
        buildCmd: 'npm install && npm run build',
        startCmd: 'npm start',
        publishDir: '',
        envVars: ['DATABASE_URL', 'NEXT_PUBLIC_API_URL'],
        description: 'Multi-threaded server-rendering Next.js ecosystem deployment plan.'
      },
      'nodejs-express': {
        displayName: 'Node.js Express Backend',
        buildCmd: 'npm install',
        startCmd: 'npm start',
        publishDir: '',
        envVars: ['PORT', 'NODE_ENV', 'DATABASE_URL'],
        description: 'Server environment built using Node JS backend framework APIs.'
      },
      'static-html': {
        displayName: 'Static Website',
        buildCmd: '',
        startCmd: '',
        publishDir: '.',
        envVars: [],
        description: 'Serverless website composed of index.html, custom CSS files, and layouts.'
      },
      'python-flask': {
        displayName: 'Flask Python App',
        buildCmd: 'pip install -r requirements.txt',
        startCmd: 'gunicorn app:app',
        publishDir: '',
        envVars: ['SECRET_KEY', 'DATABASE_URL'],
        description: 'Python Flask or FastAPI micro-framework lightweight dynamic service.'
      },
      'python-django': {
        displayName: 'Django Python App',
        buildCmd: 'pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate',
        startCmd: 'gunicorn myproject.wsgi:application',
        publishDir: '',
        envVars: ['SECRET_KEY', 'DATABASE_URL', 'ALLOWED_HOSTS'],
        description: 'MVT Python fullscale system including ORM, schemas, and live database migrations.'
      },
      'laravel-php': {
        displayName: 'Laravel PHP App',
        buildCmd: 'composer install --no-dev --optimize-autoloader && npm install && npm run build',
        startCmd: 'php artisan serve --host=0.0.0.0 --port=10000',
        publishDir: 'public',
        envVars: ['APP_KEY', 'APP_ENV', 'DB_CONNECTION', 'DB_HOST', 'DB_DATABASE'],
        description: 'Modern PHP Laravel framework deployment configuration.'
      },
      generic: {
        displayName: 'Custom Project',
        buildCmd: 'npm run build',
        startCmd: 'npm start',
        publishDir: 'dist',
        envVars: ['PORT', 'API_KEY'],
        description: 'Configurable build environment setup matching customized guidelines.'
      }
    };

    const targetOverride = overrides[newType];
    const updatedStack: StackInfo = {
      ...detectedStack,
      type: newType,
      displayName: targetOverride.displayName || 'Custom File',
      buildCmd: targetOverride.buildCmd ?? '',
      startCmd: targetOverride.startCmd ?? '',
      publishDir: targetOverride.publishDir ?? '',
      envVars: targetOverride.envVars ?? [],
      description: targetOverride.description ?? '',
    };

    setDetectedStack(updatedStack);

    // Re-generate configs according to the overridden stack
    const isWebService = updatedStack.publishDir === '' || ['nodejs-express', 'python-flask', 'python-django', 'nextjs', 'generic'].includes(newType);
    
    // render.yaml
    let renderYaml = `# Dynamic Render Infrastructure-as-Code Setup
services:
  - type: ${isWebService ? 'web' : 'static'}
    name: ${updatedStack.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
    env: ${isWebService ? 'node' : 'static'}
    plan: free
    buildCommand: "${updatedStack.buildCmd || 'echo \"Static Site\"'}"
`;
    if (isWebService) {
      renderYaml += `    startCommand: "${updatedStack.startCmd}"\n`;
    } else {
      renderYaml += `    publishPath: "./${updatedStack.publishDir}"\n`;
    }

    if (updatedStack.envVars.length > 0) {
      renderYaml += `    envVars:\n`;
      updatedStack.envVars.forEach(v => {
        renderYaml += `      - key: ${v}\n        sync: false\n`;
      });
    }

    // gitignore
    const gitignoreContent = `node_modules/\ndist/\nbuild/\n.env\n.DS_Store\n`;
    
    // readme
    const readmeContent = `# ${updatedStack.displayName} Deployment System

Configure this blueprint folder to link your workspace direct with GitHub and scale on Render.

## Git directives:
\`\`\`bash
git init
git add .
git commit -m "feat: render ready configurations"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
\`\`\`
`;

    setGeneratedConfigs([
      { filename: 'render.yaml', content: renderYaml, description: 'Automates Render deployments using Infrastructure-as-code.', language: 'yaml' },
      { filename: '.gitignore', content: gitignoreContent, description: 'Avoids exposing node_modules and secrets to git.', language: 'plaintext' },
      { filename: 'DEPLOYMENT_GUIDE.md', content: readmeContent, description: 'Copyable Git commands instructions manual.', language: 'markdown' }
    ]);
  };

  const handleCopyFileContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const resetAll = () => {
    setFile(null);
    setFiles([]);
    setDetectedStack(null);
    setGeneratedConfigs([]);
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Visual Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-150 shrink-0">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-extrabold text-slate-900 leading-tight">
                {t.appName}
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500 leading-none mt-0.5 font-medium">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Bilingual Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              id="btn-lang-ar"
              onClick={() => setLang('ar')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
                lang === 'ar'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              العربية
            </button>
            <button
              id="btn-lang-en"
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
                lang === 'en'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* LANDING SECTION (No file loaded yet) */}
        {!detectedStack && (
          <div id="landing-hero" className="max-w-3xl mx-auto space-y-8 py-4 text-center">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-indigo-50 border border-indigo-150 rounded-full text-indigo-700 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'أداة الإعداد والرفع بلمسة واحدة' : 'Seamless deployment configurator'}
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {t.introTitle}
              </h2>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
                {t.introDesc}
              </p>
            </div>

            {/* ZIP Upload target */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-lg shadow-slate-100/50">
              <ZipUploader
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
                currentFileName={file ? file.name : null}
                onReset={resetAll}
                lang={lang}
              />
            </div>

            {/* Demos section */}
            <div className="pt-2">
              <span className="block text-slate-400 text-xs uppercase font-bold tracking-widest mb-3.5">
                {lang === 'ar' ? 'أو ابدأ فوراً بالتجربة التفاعلية:' : 'Or accelerate with demo sandboxes:'}
              </span>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="btn-load-demo-react"
                  onClick={() => loadDemo('react')}
                  className="w-full sm:w-auto px-5 py-3 hover:bg-slate-100 border border-slate-200 bg-white rounded-2xl flex items-center justify-center gap-2.5 shadow-sm text-xs md:text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  {t.loadDemoReact}
                </button>
                <button
                  id="btn-load-demo-node"
                  onClick={() => loadDemo('node')}
                  className="w-full sm:w-auto px-5 py-3 hover:bg-slate-100 border border-slate-200 bg-white rounded-2xl flex items-center justify-center gap-2.5 shadow-sm text-xs md:text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {t.loadDemoNode}
                </button>
              </div>
            </div>

            {/* Education features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8 border-t border-slate-200/80">
              <div className="p-5 bg-white rounded-2xl border border-slate-150 shadow-sm text-right">
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold mb-3">
                  <Terminal className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-base mb-1.5">{t.whyGitTitle}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{t.whyGitDesc}</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-150 shadow-sm text-right">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold mb-3">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-base mb-1.5">{t.whyRenderTitle}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{t.whyRenderDesc}</p>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE MODE (When project is active) */}
        {detectedStack && (
          <div id="active-workspace" className="space-y-6 animate-fade-in">
            
            {/* Quick reset/re-upload top bar */}
            <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileArchive className="w-5 h-5 text-indigo-500 shrink-0" />
                <span className="text-xs md:text-sm text-slate-400 font-medium truncate" dir="ltr">
                  {file?.name}
                </span>
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-[10px] rounded-lg text-indigo-700 font-bold shrink-0 uppercase leading-none">
                  {detectedStack.type}
                </span>
              </div>
              <button
                id="btn-workspace-reset"
                onClick={resetAll}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs rounded-xl transition-colors duration-150 shrink-0"
              >
                {lang === 'ar' ? 'رفع مشروع آخر' : t.backToTop}
              </button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (Files & Directory explorer) - Span 5 */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* File Explorer tree */}
                <FileExplorer
                  files={files}
                  selectedFile={selectedFile}
                  onSelectFile={(f) => setSelectedFile(f)}
                  lang={lang}
                />

                {/* Live file source pre-viewer */}
                <div id="file-editor-box" className="bg-slate-950 text-white rounded-2xl border border-slate-800/80 overflow-hidden shadow-md flex flex-col min-h-[350px]">
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-xs font-mono font-bold text-slate-200 truncate" dir="ltr">
                        {selectedFile ? selectedFile.relativePath : t.codePreview}
                      </span>
                    </div>
                    {selectedFile && selectedFile.content && (
                      <button
                        id="btn-copy-editor-file"
                        onClick={() => handleCopyFileContent(selectedFile.content || '')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-[10px] transition-all duration-150 flex items-center gap-1 shrink-0"
                      >
                        {copiedFile ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copiedFile ? t.copied : t.copyFile}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 p-4 overflow-auto bg-slate-950">
                    {selectedFile && selectedFile.content ? (
                      <pre className="text-[11px] md:text-xs font-mono text-slate-200 leading-relaxed scrollbar-thin overflow-auto select-all whitespace-pre-wrap">
                        {selectedFile.content}
                      </pre>
                    ) : selectedFile ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                        <FileArchive className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
                        <span className="text-xs">{lang === 'ar' ? 'الملف المحدد كبير جداً أو بصيغة ثنائية' : 'Selected file is too large or binary'}</span>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <HelpCircle className="w-8 h-8 text-slate-700 mb-2" />
                        <span className="text-xs max-w-xs">{t.selectToPreview}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (Deployment wizard & instructions) - Span 7 */}
              <div className="lg:col-span-7">
                <DeploymentWizard
                  stack={detectedStack}
                  configs={generatedConfigs}
                  onStackOverride={handleStackOverride}
                  lang={lang}
                />
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Humble visual footer bar */}
      <footer className="border-t border-slate-200 bg-white/40 py-6 text-center px-4">
        <p className="text-slate-400 text-[11px] md:text-xs">
          © {new Date().getFullYear()} {lang === 'ar' ? 'مساعد التجهيز ورفع البرمجيات إلى Render المجاني' : 'GitHub and Render Deployment Helper'}. {lang === 'ar' ? 'مصمم بكل حب لمساعدة مطوري المشاريع في رفع أعمالهم البرمجية بشكل احترافي.' : 'Crafted to help engineers deploy works seamlessly.'}
        </p>
      </footer>
    </div>
  );
}
