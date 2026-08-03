import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';

const renderEmailTemplate = async (data: Record<string, any>): Promise<string> => {
  const templatePath = path.join(__dirname, 'email-templates', `${data.templete}.ejs`);
  return ejs.renderFile(templatePath, data);
};

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private createTransporter() {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, any>,
  ) {
    try {
      const html = await renderEmailTemplate({ templete: templateName, ...data });

      const transporter = this.createTransporter();
      const info = await transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject,
        html,
      });

      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
}