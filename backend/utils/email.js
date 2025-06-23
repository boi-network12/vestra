const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME || 'kamdilichukwu6@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'gtup tobq znth kaei',
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('Email server connection error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Helper function to compile template
const compileTemplate = (templateName, context) => {
  const filePath = path.join(__dirname, 'emailTemplates', `${templateName}.handlebars`);
  const source = fs.readFileSync(filePath, 'utf8');
  const template = handlebars.compile(source);
  return template(context);
};

// Send verification email
exports.sendVerificationEmail = async (email, name, code) => {
  try {
    const templateName = code.length === 6 ? 'forgotpassword' : 'verification';
    const html = compileTemplate(templateName, {
      name,
      code,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Vestra" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: code.length === 6 ? 'Password Reset OTP' : 'Verify Your Email Address',
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new Error('Email sending failed');
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  try {
    const html = compileTemplate('welcome', {
      name,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Vestra" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Welcome to Vestra!',
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
    throw new Error('Email sending failed');
  }
};

exports.sendLoginNotifyEmail = async (email, name, city, country, device, ipAddress, loginTime) => {
  try {
    const html = compileTemplate('loginNotify', {
      name,
      city: city || 'Unknown',
      country: country || 'Unknown',
      device: device || 'Unknown',
      ipAddress: ipAddress || 'Unknown',
      loginTime: loginTime.toLocaleString() || new Date().toLocaleString(),
      year: new Date().getFullYear(),
    })

    const mailOptions = {
      from: `"Vestra" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'New Login to Your Vestra Account',
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Login notification email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending login notification email to ${email}:`, error);
    throw new Error('Email sending failed');
  }
}

// Send password change notification email
exports.sendPasswordChangeEmail = async (email, name) => {
  try {
    const html = compileTemplate('passwordChange', {
      name,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Vestra" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Your Vestra Password Has Been Changed',
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password change notification email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending password change notification email to ${email}:`, error);
    throw new Error('Email sending failed');
  }
};