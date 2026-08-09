import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('session')
  createSession(@Req() req: any, @Body() body: any) {
    return this.paymentsService.createPaymentSession(body, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session/verify')
  verifySession(@Req() req: any, @Query('sessionId') sessionId: string) {
    return this.paymentsService.verifyPaymentSession(sessionId, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('kashier/create')
  createKashier(@Req() req: any, @Body() body: any) {
    return this.paymentsService.createKashierSession(body, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cod')
  createCOD(@Req() req: any, @Body() body: any) {
    return this.paymentsService.createCODOrder({
      ...body,
      userId: body.userId ?? req.user?.id,
    });
  }

  // Public webhook — signature verified inside the service.
  @Post('kashier/webhook-callback')
  async kashierWebhook(@Req() req: any, @Res() res: any) {
    const result = await this.paymentsService.kashierWebhookCreateOrder({
      headers: req.headers,
      body: req.body,
    });
    return res.status(result.statusCode).end();
  }

  // Public redirect after Kashier payment.
  @Get('kashier/redirect-callback')
  async kashierRedirect(@Query() query: any, @Res() res: any) {
    const url = await this.paymentsService.kashierRedirectUser(query);
    return res.redirect(url);
  }
}