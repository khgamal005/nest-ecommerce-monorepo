import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const renderEmailTemplate = async (data: Record<string, any>): Promise<string> => {
  const isProd = process.env.NODE_ENV === 'production';
  const templetePath = path.join(
    process.cwd(),
    isProd ? 'dist' : 'apps/backend/src',
    'modules',
    'mail',
    'email-templates',
    `${data.templete}.ejs`,
  );
  return ejs.renderFile(templetePath, data);
};

@Injectable()
export class MailService {
  async sendMail(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, any>,
  ) {
    try {
      const html = await renderEmailTemplate({ templete: templateName, ...data });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
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
