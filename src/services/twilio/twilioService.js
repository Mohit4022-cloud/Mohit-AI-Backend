import twilio from 'twilio';
import { logger } from '../../utils/logger.js';

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.apiKeySid = process.env.TWILIO_API_KEY_SID;
    this.apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    
    this.client = twilio(this.accountSid, this.authToken);
  }

  async makeCall(to, callbackUrl, options = {}) {
    try {
      const call = await this.client.calls.create({
        to,
        from: this.phoneNumber,
        url: callbackUrl,
        statusCallback: `${process.env.BASE_URL}/api/calls/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true,
        recordingStatusCallback: `${process.env.BASE_URL}/api/calls/twilio/recording`,
        recordingStatusCallbackMethod: 'POST',
        machineDetection: 'DetectMessageEnd',
        asyncAmd: true,
        asyncAmdStatusCallback: `${process.env.BASE_URL}/api/calls/twilio/amd`,
        asyncAmdStatusCallbackMethod: 'POST',
        ...options
      });

      logger.info(`Call initiated: ${call.sid} to ${to}`);
      return call;
    } catch (error) {
      logger.error('Failed to make call:', error);
      throw error;
    }
  }

  async sendSMS(to, body, mediaUrl = null) {
    try {
      const message = await this.client.messages.create({
        to,
        from: this.phoneNumber,
        body,
        ...(mediaUrl && { mediaUrl: [mediaUrl] }),
        statusCallback: `${process.env.BASE_URL}/api/webhooks/twilio/sms-status`
      });

      logger.info(`SMS sent: ${message.sid} to ${to}`);
      return message;
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async getCallDetails(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return call;
    } catch (error) {
      logger.error(`Failed to get call details for ${callSid}:`, error);
      throw error;
    }
  }

  async getRecording(recordingSid) {
    try {
      const recording = await this.client.recordings(recordingSid).fetch();
      return recording;
    } catch (error) {
      logger.error(`Failed to get recording ${recordingSid}:`, error);
      throw error;
    }
  }

  async getTranscription(transcriptionSid) {
    try {
      const transcription = await this.client.transcriptions(transcriptionSid).fetch();
      return transcription;
    } catch (error) {
      logger.error(`Failed to get transcription ${transcriptionSid}:`, error);
      throw error;
    }
  }

  generateAccessToken(identity) {
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(
      this.accountSid,
      this.apiKeySid,
      this.apiKeySecret,
      { identity }
    );

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true
    });

    token.addGrant(voiceGrant);
    return token.toJwt();
  }

  validateWebhookSignature(request) {
    const signature = request.headers['x-twilio-signature'];
    const url = `${process.env.BASE_URL}${request.originalUrl}`;
    const params = request.body;

    return twilio.validateRequest(
      this.authToken,
      signature,
      url,
      params
    );
  }
}

export default new TwilioService();