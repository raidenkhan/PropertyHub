// // src/payment/payment.service.spec.ts
// import { Test, TestingModule } from '@nestjs/testing';
// import { PaymentService } from './payment.service';
// import { PaystackService } from './paystack.service';
// import { PrismaService } from '../prisma/prisma.service';
// import { ConfigService } from '@nestjs/config';
// import { NotFoundException, BadRequestException } from '@nestjs/common';

// describe('PaymentService', () => {
//   let service: PaymentService;
//   let prismaService: PrismaService;
//   let paystackService: PaystackService;

//   const mockTransaction = {
//     id: 1,
//     amount: 50000,
//     status: 'PENDING',
//     buyerId: 1,
//     sellerId: 2,
//     propertyId: 1,
//     paystackReference: null,
//     platformFee: 0,
//     netAmount: null,
//     buyer: {
//       id: 1,
//       email: 'buyer@test.com',
//       name: 'Test Buyer',
//       paystackCustomerCode: null,
//     },
//     seller: {
//       id: 2,
//       email: 'seller@test.com',
//       name: 'Test Seller',
//     },
//     property: {
//       id: 1,
//       title: 'Test Property',
//       location: 'Test Location',
//     },
//   };

//   const mockPaystackResponse = {
//     status: true,
//     message: 'Success',
//     data: {
//       authorization_url: 'https://checkout.paystack.com/test',
//       access_code: 'test_access_code',
//       reference: 'TXN_TEST_123',
//     },
//   };

//   const mockCustomerResponse = {
//     status: true,
//     message: 'Customer created',
//     data: {
//       customer_code: 'CUS_test123',
//       email: 'buyer@test.com',
//       id: 12345,
//     },
//   };

//   const mockPayment = {
//     id: 1,
//     reference: 'TXN_TEST_123',
//     amount: 50000,
//     currency: 'NGN',
//     status: 'PENDING',
//     userId: 1,
//     transactionId: 1,
//     paystackResponse: null,
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         PaymentService,
//         {
//           provide: PrismaService,
//           useValue: {
//             transaction: {
//               findUnique: jest.fn(),
//               update: jest.fn(),
//             },
//             payment: {
//               create: jest.fn(),
//               update: jest.fn(),
//               findUnique: jest.fn(),
//               findMany: jest.fn(),
//               count: jest.fn(),
//             },
//             user: {
//               update: jest.fn(),
//             },
//             escrowTransaction: {
//               create: jest.fn(),
//             },
//           },
//         },
//         {
//           provide: PaystackService,
//           useValue: {
//             calculatePlatformFee: jest.fn(),
//             nairaToKobo: jest.fn(),
//             generateReference: jest.fn(),
//             initializePayment: jest.fn(),
//             createCustomer: jest.fn(),
//             verifyPayment: jest.fn(),
//           },
//         },
//         {
//           provide: ConfigService,
//           useValue: {
//             get: jest.fn((key: string) => {
//               if (key === 'ESCROW_AUTO_RELEASE_DAYS') return '30';
//               return 'test_value';
//             }),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<PaymentService>(PaymentService);
//     prismaService = module.get<PrismaService>(PrismaService);
//     paystackService = module.get<PaystackService>(PaystackService);
//   });

//   describe('initializePayment', () => {
//     it('should initialize payment successfully', async () => {
//       // Arrange
//       const initDto = { 
//         transactionId: 1, 
//         metadata: { test: 'data' },
//         callback_url: 'http://localhost:3000/callback'
//       };
//       const userId = 1;

//       // Setup all mocks before calling the method
//       jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(mockTransaction);
//       jest.spyOn(paystackService, 'calculatePlatformFee').mockReturnValue(1250);
//       jest.spyOn(paystackService, 'nairaToKobo').mockReturnValue(5000000);
//       jest.spyOn(paystackService, 'generateReference').mockReturnValue('TXN_TEST_123');
//       jest.spyOn(prismaService.payment, 'create').mockResolvedValue(mockPayment);
//       jest.spyOn(prismaService.transaction, 'update').mockResolvedValue({
//         ...mockTransaction,
//         paystackReference: 'TXN_TEST_123',
//         platformFee: 1250,
//         netAmount: 48750,
//       });

//       // Mock customer creation (this was missing!)
//       jest.spyOn(paystackService, 'createCustomer').mockResolvedValue(mockCustomerResponse);
//       jest.spyOn(prismaService.user, 'update').mockResolvedValue({
//         ...mockTransaction.buyer,
//         paystackCustomerCode: 'CUS_test123',
//       });

//       // Mock Paystack payment initialization
//       jest.spyOn(paystackService, 'initializePayment').mockResolvedValue(mockPaystackResponse);
//       jest.spyOn(prismaService.payment, 'update').mockResolvedValue({
//         ...mockPayment,
//         paystackResponse: mockPaystackResponse.data,
//       });

//       // Act
//       const result = await service.initializePayment(initDto, userId);

//       // Assert
//       expect(result).toEqual({
//         payment_id: 1,
//         reference: 'TXN_TEST_123',
//         authorization_url: 'https://checkout.paystack.com/test',
//         access_code: 'test_access_code',
//         amount: 50000,
//         platform_fee: 1250,
//         net_amount: 48750,
//       });

//       // Verify all the expected calls were made
//       expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
//         where: { id: 1 },
//         include: expect.any(Object),
//       });
//       expect(paystackService.createCustomer).toHaveBeenCalledWith({
//         email: 'buyer@test.com',
//         first_name: 'Test',
//         last_name: 'Buyer',
//       });
//       expect(prismaService.user.update).toHaveBeenCalledWith({
//         where: { id: 1 },
//         data: { paystackCustomerCode: 'CUS_test123' },
//       });
//     });

//     it('should handle user with existing customer code', async () => {
//       // Arrange
//       const initDto = { transactionId: 1 };
//       const userId = 1;
//       const transactionWithCustomerCode = {
//         ...mockTransaction,
//         buyer: {
//           ...mockTransaction.buyer,
//           paystackCustomerCode: 'CUS_existing123', // User already has customer code
//         },
//       };

//       // Setup mocks
//       jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(transactionWithCustomerCode);
//       jest.spyOn(paystackService, 'calculatePlatformFee').mockReturnValue(1250);
//       jest.spyOn(paystackService, 'nairaToKobo').mockReturnValue(5000000);
//       jest.spyOn(paystackService, 'generateReference').mockReturnValue('TXN_TEST_123');
//       jest.spyOn(prismaService.payment, 'create').mockResolvedValue(mockPayment);
//       jest.spyOn(prismaService.transaction, 'update').mockResolvedValue(transactionWithCustomerCode);
//       jest.spyOn(paystackService, 'initializePayment').mockResolvedValue(mockPaystackResponse);
//       jest.spyOn(prismaService.payment, 'update').mockResolvedValue(mockPayment);

//       // These should NOT be called since user already has customer code
//       const createCustomerSpy = jest.spyOn(paystackService, 'createCustomer');
//       const updateUserSpy = jest.spyOn(prismaService.user, 'update');

//       // Act
//       await service.initializePayment(initDto, userId);

//       // Assert
//       expect(createCustomerSpy).not.toHaveBeenCalled();
//       expect(updateUserSpy).not.toHaveBeenCalled();
//     });

//     it('should throw error if transaction not found', async () => {
//       // Arrange
//       const initDto = { transactionId: 999 };
//       const userId = 1;
      
//       jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(null);

//       // Act & Assert
//       await expect(service.initializePayment(initDto, userId)).rejects.toThrow(
//         NotFoundException
//       );
//       expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
//         where: { id: 999 },
//         include: expect.any(Object),
//       });
//     });

//     it('should throw error if user is not the buyer', async () => {
//       // Arrange
//       const initDto = { transactionId: 1 };
//       const userId = 999; // Different from buyer ID (1)
      
//       jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(mockTransaction);

//       // Act & Assert
//       await expect(service.initializePayment(initDto, userId)).rejects.toThrow(
//         BadRequestException
//       );
//     });

//     it('should throw error if transaction is not pending', async () => {
//       // Arrange
//       const initDto = { transactionId: 1 };
//       const userId = 1;
//       const completedTransaction = { ...mockTransaction, status: 'COMPLETED' };
      
//       jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(completedTransaction);

//       // Act & Assert
//       await expect(service.initializePayment(initDto, userId)).rejects.toThrow(
//         BadRequestException
//       );
//     });
//   });

//   describe('verifyPayment', () => {
//     const mockPaymentWithTransaction = {
//       id: 1,
//       reference: 'TXN_TEST_123',
//       userId: 1,
//       transactionId: 1,
//       status: 'PENDING',
//       transaction: mockTransaction,
//     };

//     const mockPaystackVerification = {
//       status: true,
//       data: {
//         id: 123456,
//         status: 'success',
//         reference: 'TXN_TEST_123',
//         amount: 5000000,
//         paid_at: '2024-01-01T12:00:00.000Z',
//         channel: 'card',
//         authorization: {
//           last4: '1234',
//           brand: 'visa',
//         },
//       },
//     };

//     it('should verify payment successfully and move to escrow', async () => {
//       // Arrange
//       const verifyDto = { reference: 'TXN_TEST_123' };
      
//       jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPaymentWithTransaction as any);
//       jest.spyOn(paystackService, 'verifyPayment').mockResolvedValue(mockPaystackVerification);
//       jest.spyOn(prismaService.payment, 'update').mockResolvedValue({
//         ...mockPaymentWithTransaction,
//         status: 'SUCCESSFUL',
//       } as any);
//       jest.spyOn(prismaService.escrowTransaction, 'create').mockResolvedValue({} as any);
//       jest.spyOn(prismaService.transaction, 'update').mockResolvedValue({} as any);

//       // Act
//       const result = await service.verifyPayment(verifyDto);

//       // Assert
//       expect(result.success).toBe(true);
//       expect(prismaService.payment.update).toHaveBeenCalledWith({
//         where: { id: 1 },
//         data: expect.objectContaining({
//           status: 'SUCCESSFUL',
//           paidAt: expect.any(Date),
//           paymentMethod: 'card',
//           cardLast4: '1234',
//           cardBrand: 'visa',
//         }),
//       });
//       expect(prismaService.escrowTransaction.create).toHaveBeenCalled();
//       expect(prismaService.transaction.update).toHaveBeenCalledWith({
//         where: { id: 1 },
//         data: { status: 'ESCROW' },
//       });
//     });

//     it('should handle failed payment verification', async () => {
//       // Arrange
//       const verifyDto = { reference: 'TXN_TEST_123' };
//       const failedVerification = {
//         ...mockPaystackVerification,
//         data: { ...mockPaystackVerification.data, status: 'failed' },
//       };
      
//       jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPaymentWithTransaction as any);
//       jest.spyOn(paystackService, 'verifyPayment').mockResolvedValue(failedVerification);
//       jest.spyOn(prismaService.payment, 'update').mockResolvedValue({} as any);
//       jest.spyOn(prismaService.transaction, 'update').mockResolvedValue({} as any);

//       // Act
//       const result = await service.verifyPayment(verifyDto);

//       // Assert
//       expect(result.success).toBe(false);
//       expect(prismaService.payment.update).toHaveBeenCalledWith({
//         where: { id: 1 },
//         data: expect.objectContaining({
//           status: 'FAILED',
//           failedAt: expect.any(Date),
//         }),
//       });
//       expect(prismaService.transaction.update).toHaveBeenCalledWith({
//         where: { id: 1 },
//         data: { status: 'CANCELLED' },
//       });
//     });

//     it('should throw error if payment not found', async () => {
//       // Arrange
//       const verifyDto = { reference: 'NON_EXISTENT' };
      
//       jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(null);

//       // Act & Assert
//       await expect(service.verifyPayment(verifyDto)).rejects.toThrow(NotFoundException);
//     });
//   });
// });