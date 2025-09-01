const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME || 'appvestra@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'wpxe gscr vskt tuij',
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
  try {
    const filePath = path.join(__dirname, 'emailTemplates', `${templateName}.handlebars`);
    const source = fs.readFileSync(filePath, 'utf8');
    const template = handlebars.compile(source);
    return template(context);
  } catch (err) {
    console.error(`Template ${templateName} not found:`, err);
    return `<p>${context.message || 'No message available'}</p>`;
  }
};


// Send verification email
exports.sendVerificationEmail = async (email, name, code) => {
  try {
    const html = compileTemplate('verification', {
      name,
      code,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Vestra" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending verification email to ${email}:`, error);
    throw new Error('Email sending failed');
  }
};

exports.sendPasswordResetEmail = async (email, name, code) => {
  try {
    const html = compileTemplate('forgotpassword', {
      name,
      code,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Vestra" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Password Reset OTP',
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset OTP email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending password reset OTP email to ${email}:`, error);
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

// Send push notification (placeholder for Firebase or similar service)
exports.sendPushNotification = async (user, notification) => {
  try {
    // Implement push notification logic (e.g., Firebase Cloud Messaging)
    console.log(`Push notification sent to ${user.email}: ${notification.message}`);
    // Example: await firebase.messaging().send({ token: user.pushToken, notification: { title: notification.type, body: notification.message } });
  } catch (error) {
    console.error(`Error sending push notification to ${user.email}:`, error);
    throw new Error('Push notification failed');
  }
};


// Send email notification
exports.sendEmailNotification = async (user, notification) => {
  try {
    const templateMap = {
      follow: 'followNotification',
      mention: 'mentionNotification',
      account_change: 'accountChangeNotification',
      subscription_update: 'subscriptionUpdateNotification',
      system: 'systemNotification',
    };

    const templateName = templateMap[notification.type] || 'genericNotification';
    const html = compileTemplate(templateName, {
      name: user.profile.firstName || 'User',
      message: notification.message,
      year: new Date().getFullYear(),
    });

    const mailOptions = {
      from: `"Vestra" <${process.env.EMAIL_USERNAME}>`,
      to: user.email,
      subject: `New ${notification.type} Notification`,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent to ${user.email} for ${notification.type}`);
  } catch (error) {
    console.error(`Error sending email notification to ${user.email}:`, error);
    throw new Error('Email notification failed');
  }
};