// FAQ System Test Script
// This script tests the FAQ endpoints to ensure everything is working

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

const testFAQSystem = async () => {
  console.log('🧪 Testing FAQ System...\n');

  try {
    // Test 1: Get all active FAQs (public endpoint)
    console.log('1️⃣ Testing public FAQ endpoint...');
    const publicResponse = await fetch(`${API_BASE}/faqs/active`);
    
    if (publicResponse.ok) {
      const activeFAQs = await publicResponse.json();
      console.log(`✅ Public endpoint working - Found ${activeFAQs.length} active FAQs`);
      
      if (activeFAQs.length > 0) {
        console.log(`   First FAQ: "${activeFAQs[0].title}"`);
      }
    } else {
      console.log(`❌ Public endpoint failed - Status: ${publicResponse.status}`);
    }

    // Test 2: Try to access admin endpoint without auth (should fail)
    console.log('\n2️⃣ Testing admin endpoint without authentication...');
    const adminResponse = await fetch(`${API_BASE}/faqs`);
    
    if (adminResponse.status === 401) {
      console.log('✅ Admin endpoint properly protected - Returns 401 without auth');
    } else {
      console.log(`❌ Admin endpoint not properly protected - Status: ${adminResponse.status}`);
    }

    // Test 3: Test CORS headers
    console.log('\n3️⃣ Testing CORS headers...');
    const corsHeaders = publicResponse.headers.get('access-control-allow-origin');
    if (corsHeaders) {
      console.log(`✅ CORS headers present: ${corsHeaders}`);
    } else {
      console.log('⚠️ No CORS headers found');
    }

    console.log('\n🎉 FAQ System test completed!');
    console.log('\n📋 Manual Testing Checklist:');
    console.log('   • Admin Panel: Login as admin and visit /admin/faqs');
    console.log('   • Seller View: Login as seller and visit /seller/faqs');
    console.log('   • Create FAQs: Test adding, editing, and deleting FAQs');
    console.log('   • Search: Test search functionality in both interfaces');
    console.log('   • Responsive: Test on mobile and desktop devices');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure the backend server is running on port 5000');
    console.log('   • Check that MongoDB is connected');
    console.log('   • Verify FAQ routes are properly loaded');
  }
};

// Export for use in other scripts
export default testFAQSystem;

// Run if executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  testFAQSystem();
}
