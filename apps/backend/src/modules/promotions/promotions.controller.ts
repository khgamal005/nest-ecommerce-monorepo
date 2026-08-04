import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  // Admin-ui only writes by default. Adjust per module -- e.g. cart/orders
  // need customer-level write access from user-ui too (use JwtAuthGuard only
  // for those routes instead of RolesGuard).
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Post()
  create(@Body() dto: any) {
    return this.promotionsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.promotionsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
