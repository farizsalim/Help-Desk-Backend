const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

const oldConfig = `const app = express();
const httpServer = createServer(app);
// CORS configuration for local network access
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.56.50:5173",
  // Allow any IP in 192.168.x.x network
  /^http:\/\/192\.168\.\d+\.\d+:5173$/
];`;

const newConfig = `const app = express();
const httpServer = createServer(app);

// ================= CORS CONFIG FROM ENV =================
const defaultOrigin = "https://unmutualized-bryant-preplacental.ngrok-free.dev";
const envOrigins = process.env.ALLOWED_ORIGINS || defaultOrigin;

console.log('=== CORS CONFIG ===');
console.log('ENV ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('Using origin(s):', envOrigins);

// Bisa pasang satu origin atau beberapa koma dipisah (jika dibutuhkan)
const ALLOWED_ORIGINS = envOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log('Parsed origins:', ALLOWED_ORIGINS);
console.log('===================');`;

content = content.replace(oldConfig, newConfig);
fs.writeFileSync('server.js', content, 'utf8');

console.log('✓ server.js updated successfully');
