import { run } from './email_sender';

run().catch(err => {
  console.error('Fatal error in comms:', err?.message || err);
  process.exit(1);
});

export default run;
