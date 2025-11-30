import { testConnection, getJobs } from './lib/db/apitable';

async function test() {
  console.log('🔍 Testing Apitable connection...\n');
  
  try {
    const connected = await testConnection();
    console.log('Connection:', connected ? '✅ SUCCESS' : '❌ FAILED');
    
    if (connected) {
      console.log('\n📊 Fetching jobs...');
      const jobs = await getJobs();
      console.log(`Found ${jobs.length} active jobs\n`);
      
      if (jobs.length > 0) {
        console.log('First job:');
        console.log('  Title:', jobs[0].title);
        console.log('  Company:', jobs[0].company);
        console.log('  Type:', jobs[0].type);
        console.log('  Status:', jobs[0].status);
        if (jobs[0].salary) {
          console.log('  Salary:', `${jobs[0].salary.currency} ${jobs[0].salary.min}-${jobs[0].salary.max}/${jobs[0].salary.unit}`);
        }
      }
    } else {
      console.log('\n❌ Connection failed. Please check:');
      console.log('  1. Apitable is running (docker-compose ps)');
      console.log('  2. APITABLE_TOKEN is set in .env.local');
      console.log('  3. APITABLE_DATASHEET_ID is correct');
      console.log('  4. API URL is accessible');
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

test();
