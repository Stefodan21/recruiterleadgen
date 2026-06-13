import dotenv from 'dotenv';

// Load environment variables from .env (if present)
dotenv.config();

// Defer to main.ts — importing it will execute the script which already calls main()
import('./main').catch(err => {
  console.error('Failed to run main:', err);
  process.exit(1);
});
