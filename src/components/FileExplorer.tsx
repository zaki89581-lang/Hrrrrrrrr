/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Folder, FolderOpen, File, FileCode, FileText, Search, ChevronRight, ChevronDown 
} from 'lucide-react';
import { ProjectFile } from '../types';

interface FileExplorerProps {
  files: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  lang: 'ar' | 'en';
}

interface TreeItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  size: number;
  children: TreeItem[];
  originalFileRef?: ProjectFile;
}

export default function FileExplorer({
  files,
  selectedFile,
  onSelectFile,
  lang,
}: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const t = {
    en: {
      searchPlaceholder: 'Search project files...',
      emptyFiles: 'No project files to check. Upload a zip file above.',
      title: 'Project Files Structure',
      clickToView: 'Click any text file to view its source code.',
      noMatch: 'No matching files found.',
    },
    ar: {
      searchPlaceholder: 'ابحث في ملفات المشروع...',
      emptyFiles: 'لا توجد ملفات. قم برفع ملف zip في الأعلى للبدء.',
      title: 'هيكل ملفات المشروع',
      clickToView: 'اختر أي ملف نصي لعرض سطور الكود الخاصة به.',
      noMatch: 'لا توجد ملفات تطابق بحثك.',
    },
  }[lang];

  // Convert flat files array to a hierarchical tree
  const fileTree = useMemo(() => {
    const root: TreeItem = { id: 'root', name: 'Root', path: '', isFolder: true, size: 0, children: [] };
    
    // Filter files based on search term
    const filteredFiles = files.filter(f => 
      f.relativePath.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredFiles.forEach(file => {
      const parts = file.relativePath.split('/');
      // Remove trailing slash if it exists
      if (parts[parts.length - 1] === '') {
        parts.pop();
      }
      
      let current = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;
        const isFolder = !isLast || file.isDirectory;

        let existing = current.children.find(child => child.name === part);

        if (!existing) {
          existing = {
            id: currentPath,
            name: part,
            path: currentPath,
            isFolder,
            size: isLast ? file.size : 0,
            children: [],
            originalFileRef: isLast && !file.isDirectory ? file : undefined,
          };
          current.children.push(existing);
        }
        current = existing;
      });
    });

    // Sort function: Folders first, then alphabetically
    const sortTree = (item: TreeItem) => {
      item.children.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      item.children.forEach(sortTree);
    };

    sortTree(root);
    return root.children;
  }, [files, searchTerm]);

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
      case 'yml':
      case 'yaml':
      case 'config':
        return <FileCode className="w-4 h-4 text-amber-500" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'php':
        return <FileCode className="w-4 h-4 text-indigo-500" />;
      case 'html':
      case 'css':
        return <FileCode className="w-4 h-4 text-emerald-500" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Tree Node Renderer Component
  const renderNode = (item: TreeItem, depth = 0) => {
    const isExpanded = expandedFolders[item.path] ?? depth < 1; // Auto-expand first level
    const isSelected = selectedFile?.relativePath === item.path;

    if (item.isFolder) {
      return (
        <div key={item.id} className="select-none">
          <div
            id={`folder-node-${item.id}`}
            onClick={(e) => toggleFolder(item.path, e)}
            style={{ paddingLeft: `${depth * 0.75 + 0.5}rem` }}
            className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700 text-sm font-medium transition-colors duration-150"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-indigo-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className="truncate" dir="ltr">{item.name}</span>
          </div>
          
          {isExpanded && item.children.length > 0 && (
            <div id={`folder-children-${item.id}`} className="transition-all duration-200">
              {item.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        id={`file-node-${item.id}`}
        key={item.id}
        onClick={() => item.originalFileRef && onSelectFile(item.originalFileRef)}
        style={{ paddingLeft: `${depth * 0.75 + 1.25}rem` }}
        className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer text-sm transition-all duration-150 group ${
          isSelected
            ? 'bg-indigo-550/10 text-indigo-700 font-semibold border-l-2 border-indigo-600 pl-[calc(depth*0.75+1.125rem)] bg-indigo-50'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0" dir="ltr">
          {getFileIcon(item.name)}
          <span className="truncate">{item.name}</span>
        </div>
        {item.size > 0 && (
          <span className="text-[10px] text-slate-400 font-mono group-hover:text-slate-500 transition-colors shrink-0 px-1 ml-2">
            {formatSize(item.size)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div id="file-explorer-container" className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-sm tracking-wide mb-1 flex items-center gap-2">
          {t.title}
        </h3>
        <p className="text-slate-400 text-xs">
          {t.clickToView}
        </p>
      </div>

      {/* Search Input */}
      {files.length > 0 && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="explorer-search"
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-slate-700"
            />
          </div>
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-3 min-h-[300px]">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <Folder className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-400 text-xs max-w-xs">{t.emptyFiles}</p>
          </div>
        ) : fileTree.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <span className="text-slate-400 text-xs font-mono">{t.noMatch}</span>
          </div>
        ) : (
          <div id="explorer-tree" className="space-y-1">
            {fileTree.map(node => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}
