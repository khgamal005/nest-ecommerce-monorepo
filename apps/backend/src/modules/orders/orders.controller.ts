import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { RefundService } from './refund.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrderStatus } from './entities/order-status.enum';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly refundService: RefundService,
  ) {}

  // ----- Customer routes (single-vendor storefront) -----

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMyOrders(@Req() req: any) {
    return this.ordersService.getUserOrders(req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Query('sessionId') sessionId: string) {
    return this.ordersService.getOrderStatus(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine/:id')
  async getMyOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mine/:id/cancel')
  async cancelMyOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.ordersService.cancelOrder(id, req.user?.id, 'user', body?.reason);
  }

  // ----- Refunds (customer) -----

  @UseGuards(JwtAuthGuard)
  @Post('refunds/request')
  async requestRefund(
    @Req() req: any,
    @Body()
    body: {
      orderId: string;
      amount: number;
      reason: string;
      userNotes?: string;
    },
  ) {
    const refund = await this.refundService.requestRefund({
      orderId: body.orderId,
      userId: req.user?.id,
      amount: body.amount,
      reason: body.reason,
      userNotes: body.userNotes,
    });
    return { success: true, message: 'Refund request submitted successfully', refund };
  }

  @UseGuards(JwtAuthGuard)
  @Get('refunds/mine')
  async getMyRefunds(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.refundService.getUserRefunds(
      req.user?.id,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  // ----- Admin routes -----

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return this.ordersService.getAdminOrders();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status?: OrderStatus;
      deliveryStatus?: string;
      paymentStatus?: string;
    },
    @Req() req: any,
  ) {
    return this.ordersService.updateOrderStatus(id, body as any, req.user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.ordersService.cancelOrder(id, 'admin', 'admin', body?.reason);
  }

  // ----- Refunds (admin) -----

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('refunds/all')
  async adminRefunds(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.refundService.getAllRefunds({
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
    });
    return {
      success: true,
      ...result,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('refunds/stats')
  async refundStats() {
    const stats = await this.refundService.getRefundStats();
    return { success: true, stats };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('refunds/:id/approve')
  async approveRefund(
    @Param('id') id: string,
    @Body() body: { adminNotes?: string },
    @Req() req: any,
  ) {
    const refund = await this.refundService.approveRefund(
      id,
      req.user?.id,
      body?.adminNotes,
    );
    return { success: true, message: 'Refund approved successfully', refund };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('refunds/:id/reject')
  async rejectRefund(
    @Param('id') id: string,
    @Body() body: { adminNotes?: string },
    @Req() req: any,
  ) {
    const refund = await this.refundService.rejectRefund(
      id,
      req.user?.id,
      body?.adminNotes || '',
    );
    return { success: true, message: 'Refund rejected successfully', refund };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('refunds/:id/complete')
  async completeRefund(
    @Param('id') id: string,
    @Body() body: { adminNotes?: string },
    @Req() req: any,
  ) {
    const refund = await this.refundService.completeRefund(
      id,
      req.user?.id,
      body?.adminNotes,
    );
    return { success: true, message: 'Refund marked as completed', refund };
  }

}