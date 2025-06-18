import Bull from 'bull';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger.js';

let emailQueue;
let transporter;

export function initializeEmailWorker() {
  // Only initialize if email is configured
  if (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) {
    logger.warn('Email not configured, skipping email worker initialization');
    return;
  }

  try {
    // Initialize email service
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    // Initialize queue only if Redis is configured
    if (process.env.REDIS_HOST) {
      emailQueue = new Bull('email-queue', {
        redis: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        }
      });

      emailQueue.process(async (job) => {
        const { to, subject, body, html } = job.data;
        
        try {
          if (process.env.SENDGRID_API_KEY) {
            await sgMail.send({
              to,
              from: process.env.SMTP_USER,
              subject,
              text: body,
              html: html || body
            });
          } else if (transporter) {
            await transporter.sendMail({
              from: process.env.SMTP_USER,
              to,
              subject,
              text: body,
              html: html || body
            });
          }
          
          logger.info(`Email sent successfully to ${to}`);
          return { success: true, to };
        } catch (error) {
          logger.error(`Failed to send email to ${to}:`, error);
          throw error;
        }
      });

      emailQueue.on('completed', (job) => {
        logger.info(`Email job ${job.id} completed`);
      });

      emailQueue.on('failed', (job, err) => {
        logger.error(`Email job ${job.id} failed:`, err);
      });

      logger.info('Email worker initialized successfully');
    } else {
      logger.info('Email service initialized (without queue)');
    }
  } catch (error) {
    logger.error('Failed to initialize email worker:', error);
  }
}

export function sendEmail(emailData, options = {}) {
  if (emailQueue) {
    return emailQueue.add(emailData, options);
  } else {
    // Send directly if no queue
    logger.warn('Sending email without queue');
    // TODO: Implement direct sending
    return Promise.resolve();
  }
}