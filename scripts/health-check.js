#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function checkHealth() {
  console.log('🏥 Running health checks...\n');
  
  const endpoints = [
    { name: 'API Health', url: '/health' },
    { name: 'Database', url: '/health/db' },
    { name: 'Redis', url: '/health/redis' },
    { name: 'Queues', url: '/health/queues' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.url}`);
      console.log(`✅ ${endpoint.name}: ${response.data.status || 'OK'}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed`);
    }
  }
}

checkHealth().catch(console.error);