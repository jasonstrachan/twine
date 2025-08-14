#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { createServer } from 'net';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PID_FILE = join(PROJECT_ROOT, '.dev-server.pid');
const PORT = 5173; // Default Vite port

// Kill existing dev server if running
function killExistingServer() {
  try {
    if (fs.existsSync(PID_FILE)) {
      const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
      
      try {
        // Check if process exists
        process.kill(pid, 0);
        
        // Send graceful shutdown signal
        console.log(`🔄 Stopping existing dev server (PID: ${pid})...`);
        process.kill(pid, 'SIGTERM');
        
        // Give it a moment to shutdown gracefully
        let attempts = 0;
        while (attempts < 10) {
          try {
            process.kill(pid, 0);
            execSync('sleep 0.1');
            attempts++;
          } catch {
            // Process no longer exists
            break;
          }
        }
        
        // Force kill if still running
        try {
          process.kill(pid, 0);
          process.kill(pid, 'SIGKILL');
          console.log('⚠️  Had to force kill the server');
        } catch {
          // Process already dead
        }
        
      } catch (err) {
        // Process doesn't exist
      }
      
      try {
        fs.unlinkSync(PID_FILE);
      } catch {
        // Ignore if file doesn't exist
      }
    }
    
    // Also check for any orphaned vite processes
    try {
      const result = execSync(`lsof -ti:${PORT} 2>/dev/null || true`, { encoding: 'utf8' });
      const pids = result.trim().split('\n').filter(Boolean);
      
      for (const pid of pids) {
        try {
          console.log(`🔄 Killing orphaned process on port ${PORT} (PID: ${pid})`);
          process.kill(pid, 'SIGTERM');
          
          // Wait for graceful shutdown
          let killed = false;
          for (let i = 0; i < 20; i++) {
            try {
              process.kill(pid, 0);
              execSync('sleep 0.1');
            } catch {
              killed = true;
              break;
            }
          }
          
          if (!killed) {
            process.kill(pid, 'SIGKILL');
          }
        } catch {
          // Ignore errors
        }
      }
    } catch {
      // No processes on port
    }
    
  } catch (error) {
    console.error('Error killing existing server:', error);
  }
}

// Start the dev server
function startDevServer() {
  console.log('🚀 Starting Vite dev server...');
  
  const viteProcess = spawn('npm', ['run', 'vite'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  // Save PID
  fs.writeFileSync(PID_FILE, viteProcess.pid.toString());
  
  // Handle graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n📦 Gracefully shutting down dev server (${signal})...`);
    
    viteProcess.kill('SIGTERM');
    
    // Clean up PID file
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      // Ignore
    }
    
    process.exit(0);
  };
  
  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
  
  // Handle child process exit with auto-restart
  viteProcess.on('exit', (code, signal) => {
    console.log(`Dev server exited with code ${code} and signal ${signal}`);
    
    // Clean up PID file
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      // Ignore
    }
    
    // Auto-restart if it wasn't a deliberate shutdown
    if (signal !== 'SIGTERM' && signal !== 'SIGINT' && signal !== 'SIGHUP') {
      console.log('🔄 Auto-restarting Vite server in 2 seconds...');
      setTimeout(() => {
        killExistingServer();
        setTimeout(() => {
          startDevServer();
        }, 500);
      }, 2000);
    } else {
      process.exit(code || 0);
    }
  });
  
  viteProcess.on('error', (error) => {
    console.error('Failed to start dev server:', error);
    
    // Clean up PID file
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      // Ignore
    }
    
    process.exit(1);
  });
}

// Main execution
console.log('🔧 Twine Dev Server Manager');

// Kill any existing servers first
killExistingServer();

// Wait a bit longer to ensure port is fully freed
setTimeout(() => {
  startDevServer();
}, 500);