/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Terminal, HardDrive, Download, Clipboard, Check, Lightbulb, 
  HelpCircle, Settings, FileSpreadsheet, ChevronRight, RefreshCw, Layers 
} from 'lucide-react';
import { StackInfo, ProjectStack, GeneratedConfig } from '../types';
import JSZip from 'jszip';

interface DeploymentWizardProps {
  stack: StackInfo;
  configs: GeneratedConfig[];
  onStackOverride: (newStackType: ProjectStack) => void;
  lang: 'ar' | 'en';
}

const SUPPORTED_STACKS: { value: ProjectStack; label: string }[] = [
  { value: 'react-vite', label: 'Vite + React (Static Site)' },
  { value: 'nextjs', label: 'Next.js App (Server-Side Web Service)' },
  { value: 'nodejs-express', label: 'Node.js + Express (Web Service backend)' },
  { value: 'static-html', label: 'Static Site (HTML, CSS, Vanilla JS)' },
  { value: 'python-flask', label: 'Python (Flask / FastAPI Web Service)' },
  { value: 'python-django', label: 'Python (Django + ORM Web Service)' },
  { value: 'laravel-php', label: 'PHP Laravel / Composer' },
  { value: 'generic', label: 'Custom App / Configurable' },
];

export default function DeploymentWizard({
  stack,
  configs,
  onStackOverride,
  lang,
}: DeploymentWizardProps) {
  const [activeTab, setActiveTab] = useState<'git' | 'render' | 'configs'>('git');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedConfigIdx, setSelectedConfigIdx] = useState(0);
  
  // Local checklist state to simulate real progression
  const [gitChecklist, setGitChecklist] = useState({
    init: false,
    add: false,
    commit: false,
    remote: false,
    push: false,
  });

  const [renderChecklist, setRenderChecklist] = useState({
    account: false,
    newSite: false,
    authorized: false,
    configsSet: false,
    secretVars: false,
  });

  // Reset checklists when stack changes
  useEffect(() => {
    setGitChecklist({ init: false, add: false, commit: false, remote: false, push: false });
    setRenderChecklist({ account: false, newSite: false, authorized: false, configsSet: false, secretVars: false });
  }, [stack.type]);

  const t = {
    en: {
      stepGit: 'Step 1: Push to GitHub',
      stepRender: 'Step 2: Deploy to Render',
      stepConfigs: 'Step 3: Setup Files',
      detectedAs: 'Project detected as:',
      wrongDetector: 'Not correct? Override project type:',
      copyBtn: 'Copy',
      copied: 'Copied!',
      downloadBundle: 'Download Config Bundle (ZIP)',
      downloadDesc: 'This downloads a zip containing .gitignore, render.yaml, and DEPLOYMENT_GUIDE.md. Unzip these files directly into your project root folder!',
      recommendedEnv: 'Recommended Environment Variables to configure on Render:',
      gitInstructions: 'Terminal commands to push your project to GitHub:',
      renderInstructions: 'How to deploy your project on Render:',
      noEnv: 'No server-side environment variables required for this static project.',
      fileReview: 'Current file review:',
      hintTitle: 'Did you know?',
      hintText: 'Render automatically triggers a fresh build and deploys your application every single time you push a git commit to GitHub!',
    },
    ar: {
      stepGit: 'الخطوة ١: الرفع على GitHub',
      stepRender: 'الخطوة ٢: الرفع على Render',
      stepConfigs: 'الخطوة ٣: ملفات الإعداد',
      detectedAs: 'تم التعرف على المشروع كـ:',
      wrongDetector: 'النوع غير صحيح؟ غير نوع المشروع يدوياً:',
      copyBtn: 'نسخ الكود',
      copied: 'تم النسخ!',
      downloadBundle: 'تنزيل حزمة الملفات (ZIP)',
      downloadDesc: 'يقوم هذا بتنزيل ملف مضغوط يحتوي على ملفات .gitignore و render.yaml و DEPLOYMENT_GUIDE.md. قم بفك الضغط عنها وضعها في المجلد الرئيسي لمشروعك مباشرة!',
      recommendedEnv: 'متغيرات البيئة (Environment Variables) الموصى بإعدادها على Render:',
      gitInstructions: 'سطور أوامر Terminal لرفع مشروعك وتوصيله بحساب GitHub الخاص بك:',
      renderInstructions: 'خطوات إعداد ورفع المشروع على موقع Render:',
      noEnv: 'لا يحتاج هذا المشروع لمستندات أو متغيرات خادم سرية نظرًا لكونه موقعاً ثابتاً (Static).',
      fileReview: 'مراجعة الكود قبل الاستفادة منه:',
      hintTitle: 'معلومة تهمك:',
      hintText: 'منصة Render ستقوم تلقائياً بإعادة بناء ونشر تعديلات موقعك في كل مرة تقوم فيها بعمل Push للأكواد الجديدة على مستودع GitHub الخاص بك!',
    },
  }[lang];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadConfigs = async () => {
    const zip = new JSZip();
    configs.forEach(cfg => {
      zip.file(cfg.filename, cfg.content);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `render-setup-${stack.type}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleGitItem = (key: keyof typeof gitChecklist) => {
    setGitChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRenderItem = (key: keyof typeof renderChecklist) => {
    setRenderChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Construct copyable GitHub commands list with a dummy git remote address
  const gitCommands = [
    { cmd: 'git init', descAr: 'إنشاء فهرس Git جديد في مجلد مشروعك الحالي', descEn: 'Initialize a clean Git repository inside your current directory' },
    { cmd: 'git add .', descAr: 'إضافة جميع ملفات المشروع لتعقب التعديلات عليها', descEn: 'Add all codebase elements to follow development status' },
    { cmd: 'git commit -m "feat: first push with render deployment configs"', descAr: 'تثبيت وحفظ جميع التعديلات في Commit مع وصف للتغييرات', descEn: 'Commit files locally tracking a build version statement' },
    { cmd: 'git branch -M main', descAr: 'تغيير اسم الفرع الرئيسي ليكون بالاسم القياسي "main"', descEn: 'Set preferred branch configuration to standard "main"' },
    { cmd: 'git remote add origin https://github.com/your-username/your-repository.git', descAr: 'ربط مجلدك المحلي بمستودع الـ GitHub السحابي (استبدل الرابط برابط مستودعك الجديد)', descEn: 'Link local tree with remote cloud GitHub repo (replace URL with your new link)' },
    { cmd: 'git push -u origin main', descAr: 'رفع جميع الملفات والأكواد إلى مستودع GitHub السحابي', descEn: 'Upload the codebase contents to active cloud GitHub stream' }
  ];

  return (
    <div id="deployment-wizard-wrapper" className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
      {/* Dynamic Stack Info card with dropdown override */}
      <div className="p-5 bg-gradient-to-tr from-slate-50 to-slate-100 border-b border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t.detectedAs}
            </span>
            <h2 className="text-slate-800 font-extrabold text-xl flex items-center gap-2 mt-0.5" dir="ltr">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {stack.displayName}
            </h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              {lang === 'ar' ? 'قمنا بتحليل ملفاتك واقتراح الأوامر لتناسب هذا الإطار التكنولوجي تلقائياً.' : stack.description}
            </p>
          </div>

          <div className="shrink-0 bg-white p-2.5 rounded-xl border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {t.wrongDetector}
            </label>
            <select
              id="stack-override-select"
              value={stack.type}
              onChange={(e) => onStackOverride(e.target.value as ProjectStack)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full transition-all duration-200 cursor-pointer"
            >
              {SUPPORTED_STACKS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-100 bg-slate-50/30 p-1.5 gap-1.5">
        <button
          id="btn-tab-git"
          onClick={() => setActiveTab('git')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'git'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800'
          }`}
        >
          <GitBranch className="w-4 h-4 shrink-0" />
          <span>{t.stepGit}</span>
        </button>

        <button
          id="btn-tab-render"
          onClick={() => setActiveTab('render')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'render'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4 shrink-0" />
          <span>{t.stepRender}</span>
        </button>

        <button
          id="btn-tab-configs"
          onClick={() => setActiveTab('configs')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'configs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>{t.stepConfigs}</span>
        </button>
      </div>

      {/* Main Tab Contents */}
      <div className="p-5 md:p-6 min-h-[400px]">
        {/* GIT TAB */}
        {activeTab === 'git' && (
          <div id="tab-content-git" className="space-y-6">
            <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
              <Terminal className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{t.gitInstructions}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'ar' 
                    ? 'افتح نافذة الأوامر Terminal (أو Git Bash) بداخل مجلد مشروعك محلياً وقم بكتابة هذه الأوامر بالتتابع:' 
                    : 'Open a local Command Prompt or Terminal, navigate into your folder, and trigger these commands in sequence:'}
                </p>
              </div>
            </div>

            {/* List of custom Git Commands */}
            <div className="space-y-4">
              {gitCommands.map((item, idx) => (
                <div key={idx} className="bg-slate-50 hover:bg-slate-100/50 p-4 rounded-xl border border-slate-200/60 transition-all duration-150">
                  <div className="flex justify-between items-center gap-3 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                      COMMAND {idx + 1}
                    </span>
                    <button
                      id={`btn-copy-cmd-${idx}`}
                      onClick={() => handleCopy(item.cmd)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 font-semibold text-[10px] rounded-lg transition-all duration-150 flex items-center gap-1"
                    >
                      {copiedText === item.cmd ? <Check className="w-3 h-3 text-emerald-500" /> : <Clipboard className="w-3 h-3" />}
                      <span>{copiedText === item.cmd ? t.copied : t.copyBtn}</span>
                    </button>
                  </div>
                  <code id={`code-cmd-${idx}`} className="block text-xs bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono overflow-x-auto select-all leading-relaxed whitespace-nowrap scrollbar-thin" dir="ltr">
                    {item.cmd}
                  </code>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">
                    {lang === 'ar' ? item.descAr : item.descEn}
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive Progress Checklist */}
            <div className="border-t border-slate-100 pt-5 mt-4">
              <h4 className="font-bold text-slate-800 text-sm mb-3">
                {lang === 'ar' ? 'تتبع خطوات التقدم المحلي لرفع الكود:' : 'Track your local deployment progress:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'init', labelAr: 'مجلد المشروع جاهز ومفتوح', labelEn: 'Local directory opened' },
                  { key: 'add', labelAr: 'تم تعقب الملفات (git add)', labelEn: 'Files tracked (git add)' },
                  { key: 'commit', labelAr: 'تم الحفظ والـ Commit بنجاح', labelEn: 'Code committed locally' },
                  { key: 'remote', labelAr: 'تم إنشاء مستودع فارغ بـ GitHub', labelEn: 'Blank GitHub repo created' },
                  { key: 'push', labelAr: 'تم رفع الكود بالكامل لـ GitHub', labelEn: 'Pushed successfully to remote' },
                ].map((chk) => (
                  <label
                    key={chk.key}
                    onClick={() => toggleGitItem(chk.key as keyof typeof gitChecklist)}
                    className={`flex items-center gap-3 p-3 rounded-xl border select-none cursor-pointer transition-all duration-150 ${
                      gitChecklist[chk.key as keyof typeof gitChecklist]
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 ${
                      gitChecklist[chk.key as keyof typeof gitChecklist]
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {gitChecklist[chk.key as keyof typeof gitChecklist] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs truncate">{lang === 'ar' ? chk.labelAr : chk.labelEn}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RENDER TAB */}
        {activeTab === 'render' && (
          <div id="tab-content-render" className="space-y-6">
            <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
              <HardDrive className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{t.renderInstructions}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar' ? 'خطوة بخطوة لبدء نشر وتشغيل تطبيقك على منصة Render المجانية:' : 'Step by step to release and launch your application on Render:'}
                </p>
              </div>
            </div>

            {/* Config Box Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-inner border border-slate-800">
              <div className="space-y-3.5">
                <h4 className="text-indigo-400 text-xs font-bold tracking-wider uppercase">
                  {lang === 'ar' ? 'تفاصيل البناء المطلوبة في Render:' : 'Render Build Specifications:'}
                </h4>
                
                <div>
                  <span className="block text-[10px] text-indigo-300 font-semibold uppercase">{lang === 'ar' ? 'نوع الخدمة (Instance Type)' : 'Service Type'}</span>
                  <span id="render-val-type" className="text-sm font-extrabold capitalize text-white">
                    {stack.publishDir === '' ? 'Web Service (خادم نشط)' : 'Static Site (موقع ثابت مسبق البناء)'}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] text-indigo-300 font-semibold uppercase">{lang === 'ar' ? 'أمر البناء والتجهيز (Build Command)' : 'Build Command'}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code id="render-val-build-cmd" className="text-xs bg-slate-800 font-mono text-indigo-200 px-2 py-1 rounded border border-slate-700/60 block truncate select-all">{stack.buildCmd || 'echo "Static Site"'}</code>
                    {stack.buildCmd && (
                      <button
                        onClick={() => handleCopy(stack.buildCmd)}
                        className="p-1 hover:bg-slate-800 text-indigo-300 hover:text-white rounded transition-all shrink-0"
                        title={t.copyBtn}
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {stack.publishDir !== '' ? (
                  <div>
                    <span className="block text-[10px] text-indigo-300 font-semibold uppercase">{lang === 'ar' ? 'مجلد النشر النهائي (Publish Path)' : 'Publish Directory'}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code id="render-val-publish" className="text-xs bg-slate-800 font-mono text-indigo-400 px-2 py-1 rounded border border-slate-700/60 block select-all">./{stack.publishDir}</code>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[10px] text-indigo-300 font-semibold uppercase">{lang === 'ar' ? 'أمر التشغيل المباشر (Start Command)' : 'Start Command'}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code id="render-val-start" className="text-xs bg-slate-800 font-mono text-indigo-400 px-2 py-1 rounded border border-slate-700/60 block select-all">{stack.startCmd}</code>
                      <button
                        onClick={() => handleCopy(stack.startCmd)}
                        className="p-1 hover:bg-slate-800 text-indigo-300 hover:text-white rounded transition-all shrink-0"
                        title={t.copyBtn}
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Environment Variables checklist */}
              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-5 space-y-4">
                <h4 className="text-indigo-400 text-xs font-bold tracking-wider uppercase">
                  {t.recommendedEnv}
                </h4>
                {stack.envVars.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {stack.envVars.map((env) => (
                      <div key={env} className="flex justify-between items-center bg-slate-800/80 p-2 rounded-lg border border-slate-700 text-xs" dir="ltr">
                        <span className="font-mono text-indigo-300 font-semibold">{env}</span>
                        <span className="text-[10px] text-slate-400 italic">
                          {env === 'PORT' ? 'Set automatically: 10000' : 'Required setting'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs leading-relaxed">{t.noEnv}</p>
                )}
              </div>
            </div>

            {/* Step List Guide */}
            <div className="space-y-4">
              {[
                { step: '1', titleAr: 'سجل بموقع Render', titleEn: 'Register on Render', descAr: 'قم بزيارة الرابط Render.com وأنشئ حساباً مجانياً باستخدام حساب GitHub الخاص بك لتبسيط عملية الترخيص والبحث عن الأكواد.', descEn: 'Create a free personal profile utilizing your existing GitHub account directly.' },
                { step: '2', titleAr: 'اختر نوع التطبيق في لوحة التحكم', titleEn: 'Select Project Type', descAr: `اضغط على زر "New" بالأعلى، ثم اختر: **"${stack.publishDir === '' ? 'Web Service' : 'Static Site'}"** بناءً على تصنيف مشروعك الحالي.`, descEn: `Navigate dashboard to tap "New" > select **"${stack.publishDir === '' ? 'Web Service' : 'Static Site'}"** to represent this workspace.` },
                { step: '3', titleAr: 'اربط مستودع الـ GitHub', titleEn: 'Link your Repository', descAr: 'سيعرض لك الموقع مستودعاتك السحابية الأخيرة. قم باختيار المستودع الذي رفعته للتو في الخطوة الأولى من الأداة.', descEn: 'Render will request repository list access. Select your newly created repository folder directly.' },
                { step: '4', titleAr: 'املأ تفاصيل البناء والإطلاق', titleEn: 'Provide Stack Directives', descAr: `بشكل تلقائي، تقوم الأداة بتعديل الحقول. فقط قم بنسخ القيم أعلاه في الحقلين **Build Command** وكذلك **${stack.publishDir === '' ? 'Start Command' : 'Publish Directory'}**.`, descEn: 'Fill parameters using our specifications table fields. Review environment variables fields optionally.' },
                { step: '5', titleAr: 'إطلاق وتشغيل موقعك', titleEn: 'Launch deployment stream', descAr: 'اضغط على زر "Create". سيستغرق Render بضع دقائق لبناء الكود وعرض رابط موقعك المباشر في لوحة التحكم بشكل كامل!', descEn: 'Tap "Create" to build, set and open continuous server online. Wait some minutes to scale live!' }
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 border border-indigo-100 text-xs">
                    {item.step}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">
                      {lang === 'ar' ? item.titleAr : item.titleEn}
                    </h5>
                    <p className="text-slate-500 text-xs leading-relaxed mt-1">
                      {lang === 'ar' ? item.descAr : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Persistent UI checklist */}
            <div className="border-t border-slate-100 pt-5 mt-4">
              <h4 className="font-bold text-slate-800 text-sm mb-3">
                {lang === 'ar' ? 'تتبع خطوات الرفع على Render:' : 'Track your active Render dashboard steps:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'account', labelAr: 'تم إنشاء حساب Render', labelEn: 'Render profile active' },
                  { key: 'newSite', labelAr: 'تم إنشاء خدمة جديدة باللوحة', labelEn: 'Created new deployment item' },
                  { key: 'authorized', labelAr: 'تم ربط مستودع GitHub بنجاح', labelEn: 'Linked codebase repository' },
                  { key: 'configsSet', labelAr: 'أمر البناء والإعداد مضبوط', labelEn: 'Configured launch statements' },
                  { key: 'secretVars', labelAr: 'تم تعيين جميع رموز البيئة الـ Env', labelEn: 'Env variables registered' },
                ].map((chk) => (
                  <label
                    key={chk.key}
                    onClick={() => toggleRenderItem(chk.key as keyof typeof renderChecklist)}
                    className={`flex items-center gap-3 p-3 rounded-xl border select-none cursor-pointer transition-all duration-150 ${
                      renderChecklist[chk.key as keyof typeof renderChecklist]
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 ${
                      renderChecklist[chk.key as keyof typeof renderChecklist]
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 bg-white'
                    }`}>
                      {renderChecklist[chk.key as keyof typeof renderChecklist] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs truncate">{lang === 'ar' ? chk.labelAr : chk.labelEn}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONFIGS GENERATOR TAB */}
        {activeTab === 'configs' && (
          <div id="tab-content-configs" className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-100/80">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{t.stepConfigs}</h4>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">{t.downloadDesc}</p>
              
              <button
                id="btn-download-bundle"
                onClick={handleDownloadConfigs}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300/40 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>{t.downloadBundle}</span>
              </button>
            </div>

            {/* Displaying generated files side-by-side with tabs */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 text-white shadow-md">
              {/* Internal config switcher */}
              <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
                {configs.map((cfg, idx) => (
                  <button
                    key={cfg.filename}
                    onClick={() => setSelectedConfigIdx(idx)}
                    className={`px-4 py-3 text-xs font-mono font-bold border-r border-slate-800 shrink-0 transition-colors ${
                      selectedConfigIdx === idx
                        ? 'bg-slate-950 text-indigo-400 border-b-2 border-b-indigo-500'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cfg.filename}
                  </button>
                ))}
              </div>

              {/* Code viewer pane */}
              <div className="p-4 bg-slate-950">
                <div className="flex justify-between items-center gap-3 mb-3">
                  <span className="text-[10px] text-slate-400 italic">
                    {configs[selectedConfigIdx]?.description}
                  </span>
                  <button
                    id="btn-copy-config"
                    onClick={() => handleCopy(configs[selectedConfigIdx]?.content || '')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-[10px] rounded-lg transition-all duration-150 flex items-center gap-1.5"
                  >
                    {copiedText === configs[selectedConfigIdx]?.content ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copiedText === configs[selectedConfigIdx]?.content ? t.copied :'Copy Content'}</span>
                  </button>
                </div>
                
                <pre id="config-code-preview" className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-200 overflow-auto max-h-[350px] leading-relaxed scrollbar-thin select-all whitespace-pre">
                  {configs[selectedConfigIdx]?.content}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbulb educational note */}
      <div className="p-5 bg-gradient-to-tr from-amber-50/50 to-orange-50/20 border-t border-slate-100 flex gap-3.5">
        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold text-slate-800 text-xs md:text-sm">
            {t.hintTitle}
          </h5>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            {t.hintText}
          </p>
        </div>
      </div>
    </div>
  );
}
