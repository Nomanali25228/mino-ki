import mongoose from 'mongoose';
import FAQ from '../models/faq.model.js';
import User from '../models/user.model.js';
import sampleFAQs from '../data/sampleFAQs.js';
import { connectDB } from '../lib/db.js';

const seedFAQs = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log('🗑️ Cleared existing FAQs');

    // Add sample FAQs
    const faqPromises = sampleFAQs.map(faqData => {
      return new FAQ({
        ...faqData,
        createdBy: adminUser._id
      }).save();
    });

    const createdFAQs = await Promise.all(faqPromises);
    console.log(`✅ Created ${createdFAQs.length} sample FAQs`);

    // Display created FAQs
    createdFAQs.forEach((faq, index) => {
      console.log(`${index + 1}. ${faq.title}`);
    });

    console.log('🎉 FAQ seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding FAQs:', error);
    process.exit(1);
  }
};

// Run the seeder if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedFAQs();
}

export default seedFAQs;
