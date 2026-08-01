import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const mobileDir = path.resolve(rootDir, '../mobile-app');
const targetMobileDist = path.resolve(rootDir, 'dist/mobile');

console.log('1. Building Desktop PWA...');
execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });

if (fs.existsSync(mobileDir)) {
  console.log('2. Building Mobile React PWA...');
  execSync('npm run build', { cwd: mobileDir, stdio: 'inherit' });

  const mobileDist = path.resolve(mobileDir, 'dist');
  if (fs.existsSync(mobileDist)) {
    console.log('3. Copying Mobile PWA to dist/mobile...');
    fs.mkdirSync(targetMobileDist, { recursive: true });
    fs.cpSync(mobileDist, targetMobileDist, { recursive: true });
    console.log('Successfully copied Mobile PWA to dist/mobile');
  }
}

console.log('Build complete!');
