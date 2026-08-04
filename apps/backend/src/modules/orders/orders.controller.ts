import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // Admin-ui only writes by default. Adjust per module -- e.g. cart/orders
  // need customer-level write access from user-ui too (use JwtAuthGuard only
  // for those routes instead of RolesGuard).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Post()
  create(@Body() dto: any) {
    return this.ordersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.ordersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
