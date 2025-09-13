#!/usr/bin/env node

/**
 * Script to copy PDF.js worker file to public directory
 * This ensures the worker is available for the application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
const targetFile = path.join(__dirname, '../public/pdf.worker.min.js');

try {
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error('❌ PDF.js worker source file not found:', sourceFile);
    console.log('💡 Make sure pdfjs-dist is installed: npm install pdfjs-dist');
    process.exit(1);
  }

  // Ensure public directory exists
  const publicDir = path.dirname(targetFile);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy the worker file
  fs.copyFileSync(sourceFile, targetFile);
  console.log('✅ PDF.js worker copied successfully to:', targetFile);
  
} catch (error) {
  console.error('❌ Error copying PDF.js worker:', error.message);
  process.exit(1);
}
