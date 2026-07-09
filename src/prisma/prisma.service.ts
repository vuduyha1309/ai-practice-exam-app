import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prismaGlobal: PrismaClient | null = null;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prismaClient: PrismaClient | null = null;

  async onModuleInit(): Promise<void> {
    if (!prismaGlobal) {
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // Create a PostgreSQL connection pool
      const pool = new Pool({ connectionString });
      
      // Create Prisma adapter for PostgreSQL
      const adapter = new PrismaPg(pool);

      // Initialize PrismaClient with the adapter
      prismaGlobal = new PrismaClient({ adapter });

      try {
        await prismaGlobal.$connect();
        console.log('✅ Database connected successfully');
      } catch (error) {
        console.error('Failed to connect to database:', error);
        throw error;
      }
    }
    this.prismaClient = prismaGlobal;
  }

  async onModuleDestroy(): Promise<void> {
    if (prismaGlobal) {
      try {
        await prismaGlobal.$disconnect();
      } catch (error) {
        console.error('Failed to disconnect from database:', error);
      }
      prismaGlobal = null;
    }
  }

  get client(): PrismaClient {
    if (!this.prismaClient) {
      throw new Error('Prisma client not initialized');
    }
    return this.prismaClient;
  }
}
