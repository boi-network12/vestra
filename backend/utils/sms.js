const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendVerificationSMS = async (phoneNumber, code) => {
  try {
    await client.messages.create({
      body: `Your SocialApp verification code is: ${code}. This code expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`Verification SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error(`Error sending SMS to ${phoneNumber}:`, error);
    throw new Error('SMS sending failed');
  }
};