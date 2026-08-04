import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AddAdminDto } from './dto/add-admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('customizations')
  getAllCustomizations() {
    return this.adminService.getAllCustomizations();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('add-admin')
  addNewAdmin(@Body() dto: AddAdminDto, @CurrentUser() user: any) {
    return this.adminService.addNewAdmin(dto, user?.id);
  }
}
