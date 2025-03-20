// Script to create an admin user in Supabase
// Usage: node create-admin.js

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get environment variables from .env file
dotenv.config();

// Path handling for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(dirname(__dirname));

// Try to load .env file manually if needed
let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  try {
    const envPath = `${rootDir}/.env`;
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      const envVars = envFile.split('\n').reduce((acc, line) => {
        const match = line.match(/^(NEXT_PUBLIC_SUPABASE_[A-Z_]+)=(.*)$/);
        if (match) {
          acc[match[1]] = match[2].trim();
        }
        return acc;
      }, {});
      
      SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
      SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase environment variables.');
  console.error('Please create or update your .env file with the following variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdminUser() {
  return new Promise((resolve) => {
    console.log('\n=== ZarcFit Admin User Creation ===\n');
    console.log('This script will create an admin user with email: admin@zarcfit.com');
    
    rl.question('Enter a password for the admin user (min 8 chars, must include number and special char): ', async (password) => {
      if (password.length < 8 || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        console.error('Password must be at least 8 characters and include a number and special character.');
        rl.close();
        resolve(false);
        return;
      }

      try {
        // Admin user details
        const email = 'admin@zarcfit.com';
        const firstName = 'Admin';
        const lastName = 'User';
        
        // Try to sign up the admin user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: {
              firstName,
              lastName,
              isAdmin: true
            }
          }
        });
        
        if (error) {
          console.error('Error creating admin user:', error.message);
          if (error.message.includes('already registered')) {
            console.log('\nAn account with email admin@zarcfit.com already exists.');
            console.log('If you need to reset the password, use the forgot password feature on the login page.');
          }
          resolve(false);
        } else {
          console.log('\n✅ Admin user registration successful!');
          console.log(`Email: ${email}`);
          console.log('Password: [The password you entered]');
          
          if (data?.user?.identities?.length === 0) {
            console.log('\nNOTE: This email is already registered. If you need to change the password, use the forgot password feature.');
          } else {
            console.log('\nIMPORTANT: Check the email inbox for admin@zarcfit.com to confirm the account.');
            console.log('After confirming, you can log in to the admin dashboard at /admin');
          }
          
          // Now try to create a profile entry
          try {
            if (data?.user?.id) {
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert([{
                  id: data.user.id,
                  first_name: firstName,
                  last_name: lastName,
                  bio: 'Admin user',
                  height_cm: 180
                }]);
                
              if (profileError) {
                console.warn('\nWarning: Could not create profile entry automatically.');
                console.warn('Error:', profileError.message);
                console.warn('\nYou might need to manually add a profile entry or check your database schema.');
              } else {
                console.log('\n✅ User profile entry created successfully!');
              }
            }
          } catch (profileErr) {
            console.warn('\nWarning: Error while creating profile entry:', profileErr.message);
          }
          
          resolve(true);
        }
      } catch (err) {
        console.error('Unexpected error:', err.message);
        resolve(false);
      } finally {
        rl.close();
      }
    });
  });
}

// Run the script
createAdminUser()
  .then((success) => {
    if (success) {
      console.log('\nAdmin user setup completed successfully!');
    } else {
      console.log('\nAdmin user setup failed or was cancelled.');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error in admin user creation script:', err);
    process.exit(1);
  }); 