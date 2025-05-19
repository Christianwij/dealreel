import fetch from 'node-fetch';

const LOCAL_URL = 'http://localhost:3000';
const PROD_URL = 'https://dealreel3.onrender.com';

async function checkEndpoint(url) {
  try {
    console.log(`\nChecking ${url}...`);
    
    // Check health endpoint
    const healthResponse = await fetch(`${url}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);

    // Check main page
    const mainResponse = await fetch(url);
    console.log('Main page status:', mainResponse.status);
    
    return true;
  } catch (error) {
    console.error(`Error checking ${url}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting deployment checks...');
  
  // Check local deployment
  const localStatus = await checkEndpoint(LOCAL_URL);
  console.log('\nLocal deployment status:', localStatus ? '✅ OK' : '❌ Failed');

  // Check production deployment
  const prodStatus = await checkEndpoint(PROD_URL);
  console.log('\nProduction deployment status:', prodStatus ? '✅ OK' : '❌ Failed');
}

main().catch(console.error); 