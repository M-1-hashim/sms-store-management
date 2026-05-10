// Auto-backup service — checks settings and creates backups periodically
// This service connects to the main Next.js app's backup API

const CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const API_BASE = 'http://localhost:3000'

async function checkAndCreateBackup() {
  try {
    const res = await fetch(`${API_BASE}/api/backup?action=auto`)
    const json = await res.json()

    if (json.success && json.data?.created) {
      console.log(`[${new Date().toISOString()}] Auto-backup created: ${json.data.filename} (${json.data.size})`)
    } else if (json.success) {
      console.log(`[${new Date().toISOString()}] Auto-backup check: ${json.data?.reason || 'skipped'}`)
    } else {
      console.log(`[${new Date().toISOString()}] Auto-backup error: ${json.error}`)
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Connection error to Next.js app. Is the main server running?`)
  }
}

// Start
console.log(`Auto-backup service started`)
console.log(`Check interval: every ${CHECK_INTERVAL / 60000} minutes`)
console.log(`API target: ${API_BASE}`)

// Run immediately
checkAndCreateBackup()

// Schedule periodic checks
setInterval(checkAndCreateBackup, CHECK_INTERVAL)

// Keep alive
process.on('SIGTERM', () => {
  console.log('Shutting down...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Shutting down...')
  process.exit(0)
})
