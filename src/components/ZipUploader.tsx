/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, FileArchive, AlertCircle, RefreshCw } from 'lucide-react';

interface UploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  currentFileName: string | null;
  onReset: () => void;
  lang: 'ar' | 'en';
}

export default function ZipUploader({
  onFileSelect,
  isLoading,
  currentFileName,
  onReset,
  lang,
}: UploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      dragTitle: 'Drag & Drop your project ZIP here',
      clickTrigger: 'or browse on your computer',
      supported: 'Supports project folders zipped (.zip) under 100MB',
      invalidFile: 'Please upload a valid .zip file',
      loading: 'Extracting and analyzing codebase...',
      selected: 'Current Project Archive',
      reset: 'Upload different ZIP',
      changeFile: 'Choose another zip file',
    },
    ar: {
      dragTitle: 'اسحب وأفلت ملف الـ ZIP الخاص بمشروعك هنا',
      clickTrigger: 'أو تصفح الملفات على جهازك',
      supported: 'يدعم مجلدات المشاريع المضغوطة بصيغة (.zip) الأقل من 100 ميجابايت',
      invalidFile: 'يرجى رفع ملف مضغوط صالح بصيغة .zip فقط',
      loading: 'جاري استخراج وتحليل ملفات المشروع...',
      selected: 'أرشيف المشروع الحالي',
      reset: 'رفع ملف ZIP آخر',
      changeFile: 'اختر ملف zip آخر',
    },
  }[lang];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError(t.invalidFile);
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div id="zip-uploader-loading" className="flex flex-col items-center justify-center p-12 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl h-64 text-center">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-800 font-medium text-lg leading-relaxed">{t.loading}</p>
        <p className="text-slate-400 text-sm mt-1">Reading package structures & configuring deployment files...</p>
      </div>
    );
  }

  if (currentFileName) {
    return (
      <div id="zip-uploader-active" className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50/50 to-emerald-50/30 rounded-2xl border-2 border-indigo-100/80 shadow-md text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 mb-4 animate-pulse">
          <FileArchive className="w-8 h-8 text-white" />
        </div>
        <p className="text-slate-400 text-xs tracking-wider uppercase font-semibold mb-1">
          {t.selected}
        </p>
        <h4 className="text-slate-800 font-bold text-lg max-w-xs truncate mb-4" dir="ltr">
          {currentFileName}
        </h4>
        <button
          id="btn-upload-reset"
          onClick={onReset}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all duration-200 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t.reset}
        </button>
      </div>
    );
  }

  return (
    <div id="zip-uploader-dropzone" className="relative group">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={`flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 min-h-[16rem] text-center bg-white ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50/30 shadow-indigo-100 scale-[0.99] shadow-inner'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-lg'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleChange}
          className="hidden"
          id="file-zip-input"
        />

        <div className="w-14 h-14 bg-slate-100 group-hover:bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200">
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors duration-200" />
        </div>

        <h3 className="text-slate-800 font-bold text-base md:text-lg mb-2">
          {t.dragTitle}
        </h3>
        <p className="text-indigo-600 font-semibold text-sm mb-4">
          {t.clickTrigger}
        </p>
        <span className="text-slate-400 text-xs max-w-sm px-4">
          {t.supported}
        </span>

        {error && (
          <div id="uploader-error-banner" className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 text-xs font-semibold px-3 py-2 rounded-lg border border-red-100 animate-bounce">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
