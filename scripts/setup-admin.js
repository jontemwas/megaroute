import bcrypt from 'bcryptjs';
import { db } from '../server/db.js';
import { admins, subscriptionPlans } from '../shared/schema.js';

async function setupInitialData() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    await db.insert(admins).values({
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      email: 'admin@hotspot.com',
      role: 'admin'
    }).onConflictDoNothing();
    
    console.log('Admin user created successfully');
    
    // Create sample subscription plans
    const plans = [
      {
        name: 'Basic Plan',
        description: 'Perfect for light browsing and social media',
        price: '50',
        durationHours: 24,
        speedMbps: 5,
        dataLimitGB: 2,
        isActive: true
      },
      {
        name: 'Standard Plan',
        description: 'Great for streaming and work',
        price: '100',
        durationHours: 72,
        speedMbps: 10,
        dataLimitGB: 5,
        isActive: true
      },
      {
        name: 'Premium Plan',
        description: 'Unlimited access for heavy users',
        price: '200',
        durationHours: 168,
        speedMbps: 20,
        dataLimitGB: null,
        isActive: true
      }
    ];
    
    for (const plan of plans) {
      await db.insert(subscriptionPlans).values(plan).onConflictDoNothing();
    }
    
    console.log('Sample subscription plans created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up initial data:', error);
    process.exit(1);
  }
}

setupInitialData();