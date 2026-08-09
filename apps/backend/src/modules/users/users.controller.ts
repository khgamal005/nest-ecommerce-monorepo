import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AddAddressDto } from './dto/add-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin-ui only: customer management list.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('addresses')
  async addAddress(@CurrentUser() user: any, @Body() dto: AddAddressDto) {
    const address = await this.usersService.addAddress(user?.id, dto);
    return {
      success: true,
      message: 'Address added successfully',
      address,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('addresses/:addressId')
  async deleteAddress(@CurrentUser() user: any, @Param('addressId') addressId: string) {
    await this.usersService.deleteAddress(user?.id, addressId);
    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('addresses/:addressId')
  async getAddress(@Param('addressId') addressId: string) {
    const address = await this.usersService.getAddressById(addressId);
    return { address };
  }

  @UseGuards(JwtAuthGuard)
  @Get('addresses')
  async getUserAddresses(@CurrentUser() user: any) {
    const addresses = await this.usersService.getUserAddresses(user?.id);
    return {
      success: true,
      message: 'User addresses fetched successfully',
      addresses,
    };
  }
}
