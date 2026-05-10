// electron/build.js
// Build script for packaging SMS as a desktop app

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const standaloneDir = path.join(rootDir, '.next', 'standalone')

console.log('📦 Step 1: Building Next.js (standalone)...')
execSync('npx next build', { cwd: rootDir, stdio: 'inherit' })

console.log('\n📁 Step 2: Copying static assets...')

// Copy .next/static -> .next/standalone/.next/static
const staticFrom = path.join(rootDir, '.next', 'static')
const staticTo = path.join(standaloneDir, '.next', 'static')
if (fs.existsSync(staticFrom)) {
  if (fs.existsSync(staticTo)) {
    fs.rmSync(staticTo, { recursive: true })
  }
  fs.cpSync(staticFrom, staticTo, { recursive: true })
  console.log('  ✓ Static files copied')
}

// Copy public -> .next/standalone/public
const publicFrom = path.join(rootDir, 'public')
const publicTo = path.join(standaloneDir, 'public')
if (fs.existsSync(publicFrom)) {
  if (fs.existsSync(publicTo)) {
    fs.rmSync(publicTo, { recursive: true })
  }
  fs.cpSync(publicFrom, publicTo, { recursive: true })
  console.log('  ✓ Public files copied')
}

// Copy prisma folder -> .next/standalone/prisma
const prismaFrom = path.join(rootDir, 'prisma')
const prismaTo = path.join(standaloneDir, 'prisma')
if (fs.existsSync(prismaFrom)) {
  if (fs.existsSync(prismaTo)) {
    fs.rmSync(prismaTo, { recursive: true })
  }
  fs.cpSync(prismaFrom, prismaTo, { recursive: true })
  console.log('  ✓ Prisma files copied')
}

// Copy .prisma client -> standalone
const prismaClientFrom = path.join(rootDir, 'node_modules', '.prisma')
const prismaClientTo = path.join(standaloneDir, 'node_modules', '.prisma')
if (fs.existsSync(prismaClientFrom)) {
  if (fs.existsSync(prismaClientTo)) {
    fs.rmSync(prismaClientTo, { recursive: true })
  }
  fs.cpSync(prismaClientFrom, prismaClientTo, { recursive: true })
  console.log('  ✓ Prisma client copied')
}

console.log('\n🔧 Step 3: Building Electron app...')
execSync('npx electron-builder --win portable', { cwd: rootDir, stdio: 'inherit' })

console.log('\n✅ Done! Check the dist-electron folder for your app.')
