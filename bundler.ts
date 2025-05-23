import fs from 'fs'
import path from 'path'
import { watch } from 'fs/promises'

const args = process.argv.slice(2)
const watchMode = args.includes('--watch')

const sourceDir = path.join(import.meta.dir, 'src')
const publicDir = path.join(import.meta.dir, 'public')
const buildDir = path.join(import.meta.dir, 'dist')

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir)
} else {
  fs.rmSync(buildDir, { recursive: true, force: true })
  fs.mkdirSync(buildDir)
}

const copyPublicFiles = (dir: string, targetDir: string) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(dir, entry.name)
    const destPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyPublicFiles(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

copyPublicFiles(publicDir, buildDir)

const buildScripts = async () => {
  const scriptsDir = path.join(sourceDir, 'scripts')
  const tsFiles = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.ts'))

  for (const file of tsFiles) {
    const srcPath = path.join(scriptsDir, file)

    const result = await Bun.build({
      entrypoints: [srcPath],
      outdir: buildDir,
      target: 'browser',
      format: 'esm',
    })

    if (!result.success) {
      console.error(`Failed to build ${file}`)
      process.exit(1)
    }
  }
}

async function runBuild() {
  try {
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true })
    }
    fs.mkdirSync(buildDir, { recursive: true })

    copyPublicFiles(publicDir, buildDir)
    await buildScripts()

    console.log(`Build completed successfully! ${new Date().toLocaleTimeString()}`)
    return true
  } catch (error) {
    console.error('Build failed:', error)
    return false
  }
}

async function watchFiles() {
  console.log('👀 Watching for changes in src/ and public/ directories...')

  const srcWatcher = watch(sourceDir, { recursive: true })
  for await (const event of srcWatcher) {
    if (event.filename && event.filename.endsWith('.ts')) {
      console.log(`🔄 Source file changed: ${event.filename}`)
      await runBuild()
    }
  }

  const publicWatcher = watch(publicDir, { recursive: true })
  for await (const event of publicWatcher) {
    if (event.filename) {
      console.log(`🔄 Public file changed: ${event.filename}`)
      await runBuild()
    }
  }
}

const success = await runBuild()

if (watchMode && success) {
  watchFiles().catch(error => {
    console.error('Watcher error:', error)
    process.exit(1)
  })
} else if (!success) {
  process.exit(1)
}
