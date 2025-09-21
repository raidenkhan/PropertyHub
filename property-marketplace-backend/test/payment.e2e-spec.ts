// test/payment.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Payment System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let buyerToken: string;
  let adminToken: string;
  let transactionId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  describe('/payments (Payment Flow)', () => {
    it('should initialize payment successfully', async () => {
      return request(app.getHttpServer())
        .post('/payments/initialize')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          transactionId: transactionId,
          metadata: { test: 'e2e_test' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('payment_id');
          expect(res.body).toHaveProperty('reference');
          expect(res.body).toHaveProperty('authorization_url');
          expect(res.body.amount).toBe(50000);
          expect(res.body.platform_fee).toBe(1250);
          expect(res.body.net_amount).toBe(48750);
        });
    });

    it('should reject payment initialization by non-buyer', async () => {
      return request(app.getHttpServer())
        .post('/payments/initialize')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: transactionId,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Only the buyer can initiate payment');
        });
    });

    it('should get payment history for buyer', async () => {
      return request(app.getHttpServer())
        .get('/payments/history?page=1&limit=10')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('payments');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.payments)).toBe(true);
        });
    });

    it('should allow admin to view all payments', async () => {
      return request(app.getHttpServer())
        .get('/payments/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('payments');
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should reject unauthorized access to admin endpoint', async () => {
      return request(app.getHttpServer())
        .get('/payments/admin/all')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });
  });

  describe('/payments/webhook (Webhook Processing)', () => {
    it('should process webhook with valid signature', async () => {
      const webhookPayload = {
        event: 'charge.success',
        data: {
          id: 123456,
          reference: 'TXN_TEST_WEBHOOK',
          amount: 5000000,
          status: 'success',
          paid_at: '2024-01-01T12:00:00.000Z',
          channel: 'card',
        },
      };

      // Note: In real testing, you'd generate a proper HMAC signature
      return request(app.getHttpServer())
        .post('/payments/webhook')
        .set('x-paystack-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test users
    const buyer = await prisma.user.create({
      data: {
        email: 'buyer-e2e@test.com',
        name: 'E2E Buyer',
        password: 'hashedpassword',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'seller-e2e@test.com',
        name: 'E2E Seller',
        password: 'hashedpassword',
        role: 'SELLER',
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin-e2e@test.com',
        name: 'E2E Admin',
        password: 'hashedpassword',
        role: 'ADMIN',
      },
    });

    // Create test property
    const property = await prisma.property.create({
      data: {
        title: 'E2E Test Property',
        description: 'Test property for E2E tests',
        price: 50000,
        type: 'SALE',
        location: 'Test Location',
        ownerId: seller.id,
      },
    });

    // Create test transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: 50000,
        status: 'PENDING',
        propertyId: property.id,
        buyerId: buyer.id,
        sellerId: seller.id,
      },
    });

    transactionId = transaction.id;

    // Generate JWT tokens (simplified - in real app, use proper auth)
    buyerToken = 'buyer_jwt_token_here'; // You'd generate this properly
    adminToken = 'admin_jwt_token_here'; // You'd generate this properly
  }

  async function cleanupTestData() {
    await prisma.payment.deleteMany({
      where: { user: { email: { contains: 'e2e@test.com' } } },
    });
    await prisma.transaction.deleteMany({
      where: { buyer: { email: { contains: 'e2e@test.com' } } },
    });
    await prisma.property.deleteMany({
      where: { owner: { email: { contains: 'e2e@test.com' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'e2e@test.com' } },
    });
  }
});