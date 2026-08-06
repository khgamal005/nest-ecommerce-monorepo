import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductAnalytics } from '../entities/product-analytics.entity';
import { StockDeductionFailure } from '../entities/stock-deduction-failure.entity';

interface StockDeductJob {
  sku: string;
  quantity: number;
  variantId?: string;
}

@Injectable()
@Processor('stock-deduct', { concurrency: 5 })
export class StockDeductProcessor extends WorkerHost {
  private readonly logger = new Logger('StockDeductWorker');

  constructor(
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductAnalytics)
    private readonly productAnalytics: Repository<ProductAnalytics>,
    @InjectRepository(StockDeductionFailure)
    private readonly failures: Repository<StockDeductionFailure>,
  ) {
    super();
  }

  async process(job: Job<StockDeductJob>): Promise<{ success: boolean; sku: string; quantity: number; variantId: string }> {
    const { sku, quantity } = job.data;

    this.logger.log(`Processing job ${job.id} for SKU: ${sku}, quantity: ${quantity}`);

    try {
      const variant = await this.variants.findOne({
        where: { sku: sku.trim() },
        relations: { product: true },
      });

      if (!variant) {
        throw new Error(`Variant with SKU ${sku} not found`);
      }

      if (variant.stock < quantity) {
        throw new Error(
          `Insufficient stock for SKU ${sku}. Available: ${variant.stock}, Requested: ${quantity}`,
        );
      }

      variant.stock = variant.stock - quantity;
      variant.isActive = variant.stock > 0;
      await this.variants.save(variant);

      await this.products.increment({ id: variant.productId }, 'totalSales', quantity);

      const existingAnalytics = await this.productAnalytics.findOne({
        where: { productId: variant.productId },
      });
      if (existingAnalytics) {
        await this.productAnalytics.update(
          { id: existingAnalytics.id },
          { purchases: () => `"purchases" + ${quantity}`, lastVisited: new Date() },
        );
      } else {
        await this.productAnalytics.save(
          this.productAnalytics.create({
            productId: variant.productId,
            purchases: quantity,
            lastVisited: new Date(),
          }),
        );
      }

      this.logger.log(
        `Job ${job.id} completed. SKU: ${sku}, deducted: ${quantity}, new stock: ${variant.stock}`,
      );

      return { success: true, sku, quantity, variantId: variant.id };
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error?.message}`);

      try {
        await this.failures.save(
          this.failures.create({
            sku: sku.trim(),
            quantity,
            variantId: job.data.variantId ?? null,
            errorReason: error?.message ?? 'Unknown error',
            retryStatus: 'pending',
          }),
        );
      } catch (persistError) {
        this.logger.error(`Failed to persist failure: ${persistError}`);
      }

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<StockDeductJob>) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<StockDeductJob> | undefined, err: Error) {
    this.logger.error(`Job ${job?.id} failed after retries: ${err.message}`);
  }
}