import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig } from './entities/site-config.entity';
import { User } from '../users/entities/user.entity';
import { AddAdminDto } from './dto/add-admin.dto';

const VALID_ROLES = ['admin', 'seller', 'user'];

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(SiteConfig)
    private readonly siteConfigRepository: Repository<SiteConfig>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

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
      logo: config?.logos || [],
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
