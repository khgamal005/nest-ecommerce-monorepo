import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { AddAdminDto } from './dto/add-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { imageUploadOptions } from '../upload/multer.config';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users')
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admins')
  getAdmins() {
    return this.adminService.getAllAdmins();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('users/:id/ban')
  banUser(@Param('id') id: string, @Body('isBanned') isBanned: boolean) {
    return this.adminService.setUserBan(id, !!isBanned);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('customizations')
  getAllCustomizations() {
    return this.adminService.getAllCustomizations();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('update-customizations')
  updateCustomizations(
    @Body()
    body: {
      banners?: any[];
      logo?: { fileId?: string; file_Url?: string } | string | any[] | null;
      categories?: any[];
    },
  ) {
    return this.adminService.updateCustomizations(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('upload-image-banner')
  uploadBannerImage(@Body('fileName') fileName: string) {
    return this.adminService.uploadBannerImage(fileName);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('upload-image-logo')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  uploadLogoImage(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.uploadLogoImage(file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('delete-image-banner')
  deleteBannerImage(@Body() body: { fileId: string }) {
    return this.adminService.deleteCustomizationImage(body.fileId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('delete-image-logo')
  deleteLogoImage(@Body() body: { fileId: string }) {
    return this.adminService.deleteCustomizationImage(body.fileId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('add-admin')
  addNewAdmin(@Body() dto: AddAdminDto, @CurrentUser() user: any) {
    return this.adminService.addNewAdmin(dto, user?.id);
  }
}
