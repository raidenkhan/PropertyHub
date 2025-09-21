// src/payments/webhook.controller.ts
import * as common from '@nestjs/common';
import { WebhookService } from './webhook.service';
import express from 'express';

@common.Controller('webhook')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @common.Post('paystack')
  @common.HttpCode(common.HttpStatus.OK)
  async handlePaystackWebhook(@common.Req() req: common.RawBodyRequest<express.Request>, @common.Res() res: express.Response) {
    try {
      // ✅ FIX: Check if rawBody exists
      const rawBody = req.rawBody;
      if (!rawBody) {
        console.error('❌ Raw body not available');
        return res.status(common.HttpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'Raw body not available',
        });
      }

      // Get signature from headers
      const signature = req.headers['x-paystack-signature'] as string;
      
      if (!signature) {
        console.error('❌ Missing Paystack webhook signature');
        return res.status(common.HttpStatus.BAD_REQUEST).json({
          status: 'error',
          message: 'Missing webhook signature',
        });
      }

      // Handle webhook
      const result = await this.webhookService.handleWebhook(
        JSON.parse(rawBody.toString()),
        signature
      );

      // Return 200 OK to Paystack
      return res.status(common.HttpStatus.OK).json(result);
    } catch (error) {
      console.error('❌ Webhook processing failed:', error);
      
      // Return 200 even on error (to prevent Paystack retries)
      return res.status(common.HttpStatus.OK).json({
        status: 'error',
        message: 'Webhook processing failed',
      });
    }
  }
}