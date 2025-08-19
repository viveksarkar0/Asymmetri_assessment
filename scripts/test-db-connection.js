#!/usr/bin/env node

const { drizzle } = require('drizzle-orm/vercel-postgres');
const { sql } = require('@vercel/postgres');

/**
 * Database Connection Test Script
 * Tests the database connection and validates schema
 */

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  try {
    // Initialize database connection
    const db = drizzle(sql);

    // Test basic connection
    console.log('📡 Attempting to connect to database...');
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as db_version`);

    if (result.rows && result.rows.length > 0) {
      console.log('✅ Database connection successful!');
      console.log(`⏰ Current time: ${result.rows[0].current_time}`);
      console.log(`🗄️  Database version: ${result.rows[0].db_version}`);
    }

    // Test table existence
    console.log('\n🔍 Checking database schema...');

    const tables = ['users', 'accounts', 'sessions', 'chats', 'messages'];
    const tableChecks = [];

    for (const table of tables) {
      try {
        const tableExists = await db.execute(
          sql`SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = ${table}
          )`
        );

        tableChecks.push({
          table,
          exists: tableExists.rows[0].exists,
          status: tableExists.rows[0].exists ? '✅' : '❌'
        });
      } catch (error) {
        tableChecks.push({
          table,
          exists: false,
          status: '❌',
          error: error.message
        });
      }
    }

    // Display table status
    console.log('\n📋 Table Status:');
    tableChecks.forEach(({ table, status, exists, error }) => {
      console.log(`  ${status} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
      if (error) {
        console.log(`    Error: ${error}`);
      }
    });

    // Test basic operations
    console.log('\n🧪 Testing basic operations...');

    try {
      // Test users table if it exists
      const usersTableCheck = tableChecks.find(t => t.table === 'users');
      if (usersTableCheck && usersTableCheck.exists) {
        const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
        console.log(`👥 Users in database: ${userCount.rows[0].count}`);
      }

      // Test chats table if it exists
      const chatsTableCheck = tableChecks.find(t => t.table === 'chats');
      if (chatsTableCheck && chatsTableCheck.exists) {
        const chatCount = await db.execute(sql`SELECT COUNT(*) as count FROM chats`);
        console.log(`💬 Chats in database: ${chatCount.rows[0].count}`);
      }

      console.log('✅ Basic operations successful!');

    } catch (operationError) {
      console.log('⚠️  Some operations failed:', operationError.message);
    }

    // Connection pool info
    console.log('\n📊 Connection Information:');
    console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

    const allTablesExist = tableChecks.every(t => t.exists);

    if (allTablesExist) {
      console.log('\n🎉 All checks passed! Database is ready to use.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tables are missing. Run migrations:');
      console.log('   pnpm db:push');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Check your DATABASE_URL in .env.local');
      console.log('   2. Verify database credentials');
      console.log('   3. Ensure database server is running');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Database does not exist. Create it with:');
      console.log('   createdb ai_assistant');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection refused. Check:');
      console.log('   1. Database server is running');
      console.log('   2. Host and port are correct');
      console.log('   3. Network connectivity');
    }

    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('💡 Create .env.local file with DATABASE_URL');
  process.exit(1);
}

// Run the test
testDatabaseConnection().catch(console.error);
