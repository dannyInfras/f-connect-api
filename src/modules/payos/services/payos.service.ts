import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

import { CreatePaymentLinkDto } from '../dtos/create-payment-link.dto';
import {
  PayosCreateLinkResponse,
  PayosOrderStatusResponse,
  PayosWebhookPayload,
} from '../interfaces/payos-response.interface';

@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly checksumKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const apiUrl = this.configService.get<string>('PAYOS_API_URL');
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (!apiUrl || !clientId || !apiKey || !checksumKey) {
      throw new Error('Missing required PayOS configuration');
    }

    this.apiUrl = apiUrl;
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.checksumKey = checksumKey;
  }

  private generateSignature(data: Record<string, any>): string {
    const sortedData = Object.keys(data)
      .sort()
      .reduce<Record<string, any>>((obj, key) => {
        if (data[key] !== null && data[key] !== undefined) {
          obj[key] = data[key];
        }
        return obj;
      }, {});

    const signatureString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    this.logger.debug(`Signature string: ${signatureString}`);

    const signature = crypto
      .createHmac('sha256', this.checksumKey)
      .update(signatureString)
      .digest('hex');

    this.logger.debug(`Generated signature: ${signature}`);
    return signature;
  }

  private verifyWebhookSignature(payload: PayosWebhookPayload): boolean {
    const { checksum, ...data } = payload;
    const calculatedChecksum = this.generateSignature(data);
    return checksum === calculatedChecksum;
  }

  async createPaymentLink(
    dto: CreatePaymentLinkDto,
  ): Promise<PayosCreateLinkResponse> {
    try {
      // Prepare request body according to PayOS documentation
      const requestBody = {
        orderCode: dto.orderCode,
        amount: dto.amount,
        description: dto.description,
        returnUrl: dto.returnUrl,
        cancelUrl: dto.cancelUrl,
        signature: '', // Will be filled after generating
      };

      // Generate signature
      const { signature, ...dataToSign } = requestBody;
      requestBody.signature = this.generateSignature(dataToSign);
      console.log(signature);

      this.logger.debug(
        `PayOS Request URL: ${this.apiUrl}/v2/payment-requests`,
      );
      this.logger.debug('PayOS Request Headers:', {
        'x-client-id': this.clientId,
        'x-api-key': '***', // Masked for security
      });
      this.logger.debug('PayOS Request Body:', requestBody);

      const response = await firstValueFrom(
        this.httpService.post<PayosCreateLinkResponse>(
          `${this.apiUrl}/v2/payment-requests`,
          requestBody,
          {
            headers: {
              'x-client-id': this.clientId,
              'x-api-key': this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.debug('PayOS Response:', response.data);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to create payment link: ${error?.message}`,
        error?.stack,
      );
      if (error?.response?.data) {
        this.logger.error('PayOS Error Response:', error.response.data);
      }
      throw error;
    }
  }

  async getPaymentStatus(orderCode: string): Promise<PayosOrderStatusResponse> {
    try {
      const signature = this.generateSignature({ orderCode });

      const response = await firstValueFrom(
        this.httpService.get<PayosOrderStatusResponse>(
          `${this.apiUrl}/v2/payment-requests/${orderCode}`,
          {
            headers: {
              'x-client-id': this.clientId,
              'x-api-key': this.apiKey,
              'x-signature': signature,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to get payment status: ${error?.message}`,
        error?.stack,
      );
      if (error?.response?.data) {
        this.logger.error('PayOS Error Response:', error.response.data);
      }
      throw error;
    }
  }

  handleWebhook(payload: PayosWebhookPayload): void {
    if (!this.verifyWebhookSignature(payload)) {
      throw new Error('Invalid webhook signature');
    }

    // TODO: Handle the webhook payload based on your business logic
    this.logger.log(
      `Received webhook for order ${payload.orderCode} with status ${payload.status}`,
    );
  }
}
