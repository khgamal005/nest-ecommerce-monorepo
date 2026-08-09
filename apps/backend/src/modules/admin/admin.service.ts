import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { SiteConfig } from './entities/site-config.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import {
  OrderStatus,
  PaymentStatus,
} from '../orders/entities/order-status.enum';
import { Product } from '../products/entities/product.entity';
import { AddAdminDto } from './dto/add-admin.dto';
import { deleteFromR2, uploadToR2 } from '../upload/r2-storage';

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/webp': '.webp',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

const VALID_ROLES = ['admin', 'seller', 'user'];

const DASHBOARD_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function computePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SiteConfig)
    private readonly siteConfigRepository: Repository<SiteConfig>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const currentPeriodStart = new Date(now.valueOf() - DASHBOARD_PERIOD_MS);
    const previousPeriodStart = new Date(now.valueOf() - DASHBOARD_PERIOD_MS * 2);
    const previousPeriodEnd = currentPeriodStart;

    const activeOrderStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
    ];

    const [
      totalRevenueAgg,
      currentRevenueAgg,
      previousRevenueAgg,
      totalUsers,
      currentUsers,
      previousUsers,
      currentOpenOrders,
      ordersCurrentPeriod,
      ordersPreviousPeriod,
    ] = await Promise.all([
      this.ordersRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.total), 0)', 'sum')
        .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
        .getRawOne<{ sum: number }>(),

      this.ordersRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.total), 0)', 'sum')
        .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
        .andWhere('o.createdAt >= :start AND o.createdAt < :now', {
          start: currentPeriodStart,
          now,
        })
        .getRawOne<{ sum: number }>(),

      this.ordersRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.total), 0)', 'sum')
        .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
        .andWhere('o.createdAt >= :start AND o.createdAt < :end', {
          start: previousPeriodStart,
          end: previousPeriodEnd,
        })
        .getRawOne<{ sum: number }>(),

      this.usersRepository.count({ where: { role: 'user' } }),
      this.usersRepository.count({
        where: {
          role: 'user',
          createdAt: Between(currentPeriodStart, now),
        },
      }),
      this.usersRepository.count({
        where: {
          role: 'user',
          createdAt: Between(previousPeriodStart, previousPeriodEnd),
        },
      }),
      this.ordersRepository.count({
        where: { status: In(activeOrderStatuses) },
      }),
      this.ordersRepository.count({
        where: {
          status: In(activeOrderStatuses),
          createdAt: Between(currentPeriodStart, now),
        },
      }),
      this.ordersRepository.count({
        where: {
          status: In(activeOrderStatuses),
          createdAt: Between(previousPeriodStart, previousPeriodEnd),
        },
      }),
    ]);

    const totalProducts = this.productsRepository.count({
      where: { isDeleted: false },
    });

    const totalRevenue = totalRevenueAgg?.sum || 0;
    const currentRevenue = currentRevenueAgg?.sum || 0;
    const previousRevenue = previousRevenueAgg?.sum || 0;

    return {
      totalRevenue: {
        value: totalRevenue,
        change: computePercentageChange(currentRevenue, previousRevenue),
      },
      totalUsers: {
        value: totalUsers,
        change: computePercentageChange(currentUsers, previousUsers),
      },
      totalProducts: {
        value: await totalProducts,
        change: 0,
      },
      currentOrders: {
        value: currentOpenOrders,
        change: computePercentageChange(
          ordersCurrentPeriod,
          ordersPreviousPeriod,
        ),
      },
    };
  }

  async getAllCustomizations() {
    const config = await this.siteConfigRepository
      .createQueryBuilder('siteConfig')
      .orderBy('siteConfig.createdAt', 'ASC')
      .getOne();

    let bannersArray: any[] = [];
    if (config?.banners) {
      if (Array.isArray(config.banners)) {
        bannersArray = config.banners;
      } else {
        bannersArray = [config.banners];
      }
    }

    return {
      message: 'Customizations fetched successfully',
      categories: config?.categories || [],
      banners: bannersArray,
      logos: config?.logos || [],
      logo: config?.logos?.[0] || null,
    };
  }

  async updateCustomizations(partial: {
    banners?: any[];
    logo?: { fileId?: string; file_Url?: string } | string | any[] | null;
    categories?: any[];
  }) {
    const existing = await this.siteConfigRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    const config = existing[0] ?? this.siteConfigRepository.create();

    if (partial.banners !== undefined) {
      config.banners = Array.isArray(partial.banners)
        ? partial.banners
        : [partial.banners];
    }
    if (partial.categories !== undefined) {
      config.categories = Array.isArray(partial.categories)
        ? partial.categories
        : [partial.categories];
    }
    if (partial.logo !== undefined) {
      if (Array.isArray(partial.logo)) {
        config.logos = partial.logo;
      } else if (partial.logo) {
        config.logos = [partial.logo];
      } else {
        config.logos = [];
      }
    }

    await this.siteConfigRepository.save(config);

    return {
      message: 'Customizations updated successfully',
      banners: config.banners,
      logos: config.logos,
    };
  }

  async uploadBannerImage(fileName: string) {
    if (!fileName) {
      throw new BadRequestException('fileName is required');
    }

    const match = fileName.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
    );
    if (!match) {
      throw new BadRequestException('Invalid image data');
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length) {
      throw new BadRequestException('Empty image data');
    }

    const extension =
      IMAGE_EXTENSION_BY_MIME[contentType] ?? `.${contentType.split('/')[1]}`;
    const fileId = `uploads/admin/banners/${randomUUID()}${extension}`;

    const { url } = await uploadToR2(buffer, fileId, contentType);

    return { file_url: url, fileId };
  }

  async uploadLogoImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const extension = extname(file.originalname) || '.webp';
    const fileId = `uploads/admin/logos/${randomUUID()}${extension}`;

    const { url } = await uploadToR2(file.buffer, fileId, file.mimetype);

    return { file_url: url, fileId };
  }

  async deleteCustomizationImage(fileId: string) {
    if (!fileId) {
      throw new BadRequestException('fileId is required');
    }

    await deleteFromR2(fileId);

    return { success: true, message: 'Image deleted successfully' };
  }

  async getAllUsers() {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return { users };
  }

  async getAllAdmins() {
    const users = await this.usersRepository.find({
      where: [{ role: 'admin' }, { role: 'seller' }],
      order: { createdAt: 'DESC' },
    });
    const admins = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      images: null,
      createdAt: user.createdAt,
    }));
    return { admins };
  }

  async setUserBan(id: string, isBanned: boolean) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.role === 'admin') {
      throw new BadRequestException('Cannot ban an admin user');
    }
    await this.usersRepository.update(id, {
      isBanned,
      bannedAt: isBanned ? new Date() : null,
    });
    return {
      message: isBanned ? 'User banned successfully' : 'User unbanned successfully',
    };
  }

  async addNewAdmin(dto: AddAdminDto, requesterId: string) {
    const { email, role } = dto;

    if (!requesterId) {
      throw new UnauthorizedException('Unauthorized: No user context');
    }

    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    if (role === 'admin') {
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
      if (!superAdminEmail) {
        throw new BadRequestException(
          'Super admin not configured. Set SUPER_ADMIN_EMAIL env var.',
        );
      }
      const superAdmin = await this.usersRepository.findOne({
        where: { email: superAdminEmail },
        select: { id: true, role: true },
      });
      if (requesterId !== superAdmin?.id) {
        throw new UnauthorizedException('Unauthorized: Only the super admin can grant admin role');
      }
    }

    const isUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (!isUser) {
      throw new BadRequestException('User does not exist');
    }

    if (isUser.id === requesterId) {
      throw new BadRequestException('Cannot modify your own role');
    }

    const requester = await this.usersRepository.findOne({
      where: { id: requesterId },
      select: { role: true },
    });

    if (!requester || requester.role !== 'admin') {
      throw new UnauthorizedException('Unauthorized: Only admins can modify roles');
    }

    await this.usersRepository.update({ email }, { role });

    const updateRole = await this.usersRepository.findOne({
      where: { email },
    });

    console.log(
      `[ADMIN AUDIT] Admin ${requesterId} changed role of user ${isUser.id} (${email}) to ${role}`,
    );

    return {
      message: 'User role updated successfully',
      updateRole,
    };
  }
}
