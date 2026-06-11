import { checkOutlookReplies } from './outlook_checker';
import checkSharePoint from './sharepoint_checker';


async function main() {
  try {
    await checkOutlookReplies();
    await checkSharePoint();
    await checkTeams();
    console.log('work_iq checks complete');
  } catch (err) {
    console.error('work_iq error:', err);
    process.exit(1);
  }
}

if (require.main === module) main();

export default main;
