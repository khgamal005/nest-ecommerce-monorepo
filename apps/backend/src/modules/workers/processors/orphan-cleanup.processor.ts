import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { R2Service } from '../../../common/r2.service';
import { Image } from '../../products/entities/image.entity';
import { ProductVideo } from '../../products/entities/product-video.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { ProductReview } from '../entities/product-review.entity';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { User } from '../../users/entities/user.entity';

const EXCLUDED_PREFIXES = ['temp-videos/', 'trash/', 'chat/', 'raw/'];

export interface KeySourceStats {
  [key: string]: number;
  imagesWithKey: number;
  imagesWithoutKey: number;
  videosWithKey: number;
  videosExtractedFromUrl: number;
  videosUnresolvable: number;
  brands: number;
  reviews: number;
}

const MAX_ORPHAN_KEYS_IN_AUDIT = 10_000;

@Injectable()
@Processor('orphan-cleanup', { concurrency: 1 })
export class OrphanCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger('OrphanCleanupWorker');

  constructor(
    private readonly r2: R2Service,
    @InjectRepository(Image)
    private readonly images: Repository<Image>,
    @InjectRepository(ProductVideo)
    private readonly productVideos: Repository<ProductVideo>,
    @InjectRepository(Brand)
    private readonly brands: Repository<Brand>,
    @InjectRepository(ProductReview)
    private readonly reviews: Repository<ProductReview>,
    @InjectRepository(AdminAuditLog)
    private readonly auditLogs: Repository<AdminAuditLog>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super();
  }

  private isExcluded(key: string): boolean {
    return EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  private urlToR2Key(url: string): string | null {
    if (!url) return null;
    const r2PublicUrl = this.r2.publicUrl;
    if (r2PublicUrl && url.startsWith(r2PublicUrl + '/')) {
      return url.replace(r2PublicUrl + '/', '');
    }
    const r2Match = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)/);
    if (r2Match) return r2Match[1];
    if (!url.startsWith('http')) return url;
    return null;
  }

  private async getAllReferencedR2Keys(
    job?: Job,
  ): Promise<{ keys: Set<string>; stats: KeySourceStats }> {
    const stats: KeySourceStats = {
      imagesWithKey: 0,
      imagesWithoutKey: 0,
      videosWithKey: 0,
      videosExtractedFromUrl: 0,
      videosUnresolvable: 0,
      brands: 0,
      reviews: 0,
    };
    const keys = new Set<string>();

    const dbImages = await this.images.find({ select: { r2_key: true, id: true } });
    for (const img of dbImages) {
      if (img.r2_key) {
        keys.add(img.r2_key);
        stats.imagesWithKey++;
      } else {
        stats.imagesWithoutKey++;
        job?.log(`⚠️ Image ${img.id} has null r2_key — file cannot be protected`);
      }
    }

    const dbVideos = await this.productVideos.find({
      select: { r2_key: true, url: true, id: true },
    });
    for (const vid of dbVideos) {
      if (vid.r2_key) {
        keys.add(vid.r2_key);
        stats.videosWithKey++;
      } else {
        const extracted = this.urlToR2Key(vid.url);
        if (extracted) {
          keys.add(extracted);
          stats.videosExtractedFromUrl++;
        } else {
          stats.videosUnresolvable++;
          job?.log(`⚠️ Video ${vid.id} has no resolvable R2 key — file cannot be protected`);
        }
      }
    }

    const dbBrands = await this.brands.find({ select: { logoR2Key: true } });
    for (const brand of dbBrands) {
      if (brand.logoR2Key) {
        keys.add(brand.logoR2Key);
        stats.brands++;
      }
    }

    const dbReviews = await this.reviews.find({ select: { images: true } });
    for (const review of dbReviews) {
      for (const url of review.images ?? []) {
        const k = this.urlToR2Key(url);
        if (k) {
          keys.add(k);
          stats.reviews++;
        }
      }
    }

    return { keys, stats };
  }

  async process(job: Job) {
    const isDryRun = job.data.dryRun !== false;

    const admin = await this.users.findOne({
      where: { role: 'admin' },
      order: { createdAt: 'ASC' },
      select: { id: true },
    });
    const auditActorId = admin?.id ?? null;
    if (!auditActorId) {
      job.log('⚠️ No admin user found — scan will run but results cannot be saved to AdminAuditLog');
    }

    const scanToken: string | undefined =
      typeof job.data?.scanToken === 'string' ? job.data.scanToken : undefined;

    const persistScanAudit = async (params: {
      action: string;
      dryRun: boolean;
      orphansFound: number;
      orphansDeleted: number;
      orphanKeys: string[];
      totalR2Objects: number;
      totalDbReferences: number;
      stats?: KeySourceStats;
      errorMessage?: string;
    }) => {
      if (!auditActorId) return;
      const keysForMeta =
        params.orphanKeys.length > MAX_ORPHAN_KEYS_IN_AUDIT
          ? params.orphanKeys.slice(0, MAX_ORPHAN_KEYS_IN_AUDIT)
          : params.orphanKeys;
      await this.auditLogs.save(
        this.auditLogs.create({
          action: params.action,
          targetId: auditActorId,
          performedBy: auditActorId,
          metadata: {
            scanToken,
            dryRun: params.dryRun,
            orphansFound: params.orphansFound,
            orphansDeleted: params.orphansDeleted,
            orphanKeys: keysForMeta,
            orphanKeysTotal: params.orphanKeys.length,
            orphanKeysTruncated: params.orphanKeys.length > MAX_ORPHAN_KEYS_IN_AUDIT,
            r2PublicUrl: this.r2.publicUrl || 'not set',
            totalR2Objects: params.totalR2Objects,
            totalDbReferences: params.totalDbReferences,
            stats: params.stats ?? null,
            errorMessage: params.errorMessage,
          },
        }),
      );
    };

    try {
      job.log(`Starting orphaned media scan (${isDryRun ? 'DRY RUN' : 'LIVE MODE'})...`);

      const allR2Keys: string[] = [];
      const totalR2Keys = await this.r2.listAllKeys('products/', async (pageKeys) => {
        allR2Keys.push(...pageKeys.filter((key) => !this.isExcluded(key)));
      });
      job.log(`Found ${totalR2Keys} R2 objects, ${allR2Keys.length} after excluding temp prefixes`);

      const { keys: referencedKeys, stats } = await this.getAllReferencedR2Keys(job);
      job.log(`DB references ${referencedKeys.size} keys`);

      const keysWithProductsPrefix = [...referencedKeys].filter((k) =>
        k.startsWith('products/'),
      );
      job.log(`Protected keys under products/: ${keysWithProductsPrefix.length}`);
      if (keysWithProductsPrefix.length === 0) {
        throw new Error('SAFETY ABORT: Zero referenced keys found under products/ — possible DB failure');
      }

      const orphanKeys = allR2Keys.filter((key) => !referencedKeys.has(key));
      if (!orphanKeys.length) {
        job.log('No orphaned media found');
        await persistScanAudit({
          action: isDryRun ? 'ORPHAN_MEDIA_DRY_RUN' : 'ORPHAN_MEDIA_CLEANUP',
          dryRun: isDryRun,
          orphansFound: 0,
          orphansDeleted: 0,
          orphanKeys: [],
          totalR2Objects: totalR2Keys,
          totalDbReferences: referencedKeys.size,
          stats,
        });
        job.log(`Orphan scan complete`);
        return;
      }

      job.log(`Found ${orphanKeys.length} orphaned keys`);
      job.log(`Sample orphans: ${orphanKeys.slice(0, 10).join(', ')}`);

      if (!isDryRun) {
        await this.r2.deleteMany(orphanKeys);
        job.log(`Deleted ${orphanKeys.length} orphaned R2 objects`);
      } else {
        job.log(`DRY RUN: Would delete ${orphanKeys.length} orphaned objects`);
      }

      await persistScanAudit({
        action: isDryRun ? 'ORPHAN_MEDIA_DRY_RUN' : 'ORPHAN_MEDIA_CLEANUP',
        dryRun: isDryRun,
        orphansFound: orphanKeys.length,
        orphansDeleted: isDryRun ? 0 : orphanKeys.length,
        orphanKeys,
        totalR2Objects: totalR2Keys,
        totalDbReferences: referencedKeys.size,
        stats,
      });

      job.log(`Orphan scan complete`);
    } catch (err: any) {
      job.log(`Orphan scan failed: ${err?.message ?? err}`);
      await persistScanAudit({
        action: 'ORPHAN_MEDIA_SCAN_FAILED',
        dryRun: isDryRun,
        orphansFound: 0,
        orphansDeleted: 0,
        orphanKeys: [],
        totalR2Objects: 0,
        totalDbReferences: 0,
        errorMessage: err?.message ?? String(err),
      });
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error) {
    this.logger.error(`orphan-cleanup job ${job?.id} failed: ${err.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`orphan-cleanup job ${job.id} completed`);
  }
}