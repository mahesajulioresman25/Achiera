import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Supabase Security Lockdown (RLS Enforcer)...');

    try {
        const result = await prisma.$executeRawUnsafe(`
      DO $$ 
      DECLARE 
          tbl record;
      BEGIN 
          FOR tbl IN 
              SELECT tablename 
              FROM pg_tables 
              WHERE schemaname = 'public' 
          LOOP 
              EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
          END LOOP; 
      END $$;
    `);

        console.log('✅ Success: Row Level Security (RLS) has been enabled on all public tables.');
        console.log('📦 Note: Direct API access is now restricted. Prisma continues to work as expected.');
    } catch (error) {
        console.error('❌ Error executing lockdown script:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
