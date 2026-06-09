const nodemailer = require('nodemailer');

let transporter = null;

// Initialize transporter (called once on server start)
const initEmailTransporter = async () => {
  // If SMTP credentials are provided in .env, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail = process.env.SMTP_HOST.includes('gmail');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: isGmail ? 465 : (parseInt(process.env.SMTP_PORT) || 587),
      secure: isGmail ? true : false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`📧 Email: Using configured SMTP server (${isGmail ? 'Gmail Secure' : 'Standard'})`);
  } else {
    // Auto-generate Ethereal test account (no config needed)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Email: Using Ethereal test account');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Preview URL: https://ethereal.email`);
  }
};

// Send email helper with timeout to prevent hanging the server
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.warn('⚠️ Email transporter not initialized');
    return null;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'EduFlow <noreply@eduflow.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''), // Strip HTML as fallback
    };

    // 10 second timeout for email sending so it never hangs the API
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout exceeded')), 10000)
    );

    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      timeoutPromise
    ]);

    console.log(`✉️ Email sent to ${to}: "${subject}"`);

    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Email preview: ${previewUrl}`);
      }
    }

    return info;
  } catch (error) {
    console.error(`❌ Email send error to ${to}:`, error.message);
    return null;
  }
};

// Email templates
const emailTemplates = {
  welcome: (name, role, institution = '') => ({
    subject: `Welcome to EduFlow${institution ? ` – ${institution}` : ''}!`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">EduFlow</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Educational Management Platform</p>
        </div>
        <div style="background: #0F172A; padding: 30px; border-radius: 0 0 12px 12px; color: #E2E8F0;">
          <h2 style="color: #60A5FA;">Welcome, ${name}! 👋</h2>
          <p>Your <strong>${role}</strong> account has been created successfully${institution ? ` for ${institution}` : ''}.</p>
          <p>You can now log in to the EduFlow platform and start exploring.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
               style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Login to EduFlow
            </a>
          </div>
          <p style="color: #64748B; font-size: 14px;">If you did not create this account, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  approvalPending: (name) => ({
    subject: 'EduFlow – Account Pending Approval',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">EduFlow</h1>
        </div>
        <div style="background: #0F172A; padding: 30px; border-radius: 0 0 12px 12px; color: #E2E8F0;">
          <h2 style="color: #FBBF24;">Account Under Review ⏳</h2>
          <p>Hi ${name},</p>
          <p>Your account registration has been received and is <strong>pending admin approval</strong>.</p>
          <p>You will receive a notification once your account is approved. This usually takes 1-2 business days.</p>
        </div>
      </div>
    `,
  }),

  accountApproved: (name) => ({
    subject: 'EduFlow – Your Account Has Been Approved! 🎉',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">EduFlow</h1>
        </div>
        <div style="background: #0F172A; padding: 30px; border-radius: 0 0 12px 12px; color: #E2E8F0;">
          <h2 style="color: #34D399;">Account Approved! ✅</h2>
          <p>Hi ${name},</p>
          <p>Your EduFlow account has been <strong>approved</strong>. You can now log in and access the platform.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
               style="background: linear-gradient(135deg, #10B981, #3B82F6); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Login Now
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  substitutionAssigned: (substituteName, courseName, section, date, startTime, room, lastTopic) => ({
    subject: `Class Substitution Assignment – ${courseName} (${date})`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E03131, #EF4444); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">EduFlow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Substitution Assignment</p>
        </div>
        <div style="background: #0F172A; padding: 30px; border-radius: 0 0 12px 12px; color: #E2E8F0;">
          <h2 style="color: #FCD34D;">Substitution Request 📋</h2>
          <p>Hi ${substituteName},</p>
          <p>You have been assigned to cover a class:</p>
          <div style="background: #1E293B; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Course:</strong> ${courseName} – Section ${section}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${startTime}</p>
            <p><strong>Room:</strong> ${room || 'TBD'}</p>
            ${lastTopic ? `<p><strong>Last Topic:</strong> ${lastTopic}</p>` : ''}
          </div>
          <p>Please log in to accept or decline this substitution request.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/faculty/substitutions"
               style="background: linear-gradient(135deg, #E03131, #EF4444); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View Request
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  lowAttendanceAlert: (studentName, courseName, percentage, required) => ({
    subject: `⚠️ Attendance Alert – ${courseName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">EduFlow</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Attendance Alert</p>
        </div>
        <div style="background: #0F172A; padding: 30px; border-radius: 0 0 12px 12px; color: #E2E8F0;">
          <h2 style="color: #F87171;">Low Attendance Warning ⚠️</h2>
          <p>Hi ${studentName},</p>
          <p>Your attendance in <strong>${courseName}</strong> has dropped to <strong style="color: #EF4444;">${percentage}%</strong>.</p>
          <p>The minimum required attendance is <strong>${required}%</strong>.</p>
          <p>Please attend classes regularly to avoid academic consequences.</p>
        </div>
      </div>
    `,
  }),
  /**
   * Sent after institutional email + password are generated.
   * Goes to the student/faculty's PERSONAL contact email.
   */
  welcomeWithCredentials: (name, role, institutionalEmail, defaultPassword, institution = 'SRET') => ({
    subject: `Your ${institution} EduFlow Account is Ready — Login Credentials Inside`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #E03131, #C92A2A); padding: 28px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-family: Georgia, serif; letter-spacing: -0.3px;">EduFlow — ${institution}</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Institutional Academic Platform</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px; color: #E2E8F0;">
          <h2 style="color: #E03131; margin: 0 0 8px; font-size: 18px;">Welcome, ${name}! 🎓</h2>
          <p style="color: #94A3B8; margin: 0 0 24px; font-size: 14px;">
            Your <strong style="color: #E2E8F0;">${role}</strong> account has been created at ${institution}.
            Use the credentials below to access the EduFlow student portal.
          </p>

          <!-- Credentials box -->
          <div style="background: #1E293B; border: 1px solid #3A4558; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; font-weight: 700;">Your Institutional Login</p>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
              <span style="font-size: 12px; color: #64748B; width: 70px; flex-shrink: 0;">Email</span>
              <code style="background: #0F172A; color: #E03131; padding: 6px 14px; border-radius: 4px; font-size: 15px; letter-spacing: 0.04em; font-family: 'Courier New', monospace; flex: 1;">${institutionalEmail}</code>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 12px; color: #64748B; width: 70px; flex-shrink: 0;">Password</span>
              <code style="background: #0F172A; color: #FF8787; padding: 6px 14px; border-radius: 4px; font-size: 15px; letter-spacing: 0.06em; font-family: 'Courier New', monospace; flex: 1;">${defaultPassword}</code>
            </div>
          </div>

          <!-- Warning -->
          <div style="background: rgba(234, 67, 53, 0.1); border: 1px solid rgba(234, 67, 53, 0.3); border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #FCA5A5;">
              ⚠️ <strong>Important:</strong> This is a temporary default password. You <u>must</u> change it after your first login from your profile settings.
            </p>
          </div>

          <!-- Login button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
               style="display: inline-block; background: #E03131; color: #1C2333; padding: 12px 36px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.02em;">
              Login to EduFlow →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #3A4558; margin: 24px 0;" />
          <p style="color: #475569; font-size: 12px; margin: 0; text-align: center;">
            If you did not register for this account, please contact your institution administrator immediately.<br />
            ${institution} · Powered by EduFlow
          </p>
        </div>
      </div>
    `,
  }),

  passwordReset: (name, resetUrl) => ({
    subject: 'EduFlow — Password Reset Request',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #E03131, #C92A2A); padding: 28px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-family: Georgia, serif;">EduFlow</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Password Reset</p>
        </div>
        <div style="padding: 32px; color: #E2E8F0;">
          <h2 style="color: #E03131; margin: 0 0 16px; font-size: 18px;">Reset Your Password</h2>
          <p style="color: #94A3B8; margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
            Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
            This link will expire in <strong>30 minutes</strong>.
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #E03131; color: #1C2333; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
              Reset Password →
            </a>
          </div>
          <p style="color: #475569; font-size: 12px; margin: 0 0 8px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          <hr style="border: none; border-top: 1px solid #3A4558; margin: 24px 0;" />
          <p style="color: #475569; font-size: 11px; margin: 0; text-align: center;">
            If the button doesn't work, copy and paste this URL into your browser:<br/>
            <span style="color: #64748B; word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      </div>
    `,
  }),

  activationCredentials: (name, rollNo, password, institutionName) => ({
    subject: `Your EduFlow access is ready — ${institutionName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #E03131, #C92A2A); padding: 28px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-family: Georgia, serif; letter-spacing: -0.3px;">EduFlow</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px; color: #E2E8F0;">
          <h2 style="color: #E03131; margin: 0 0 16px; font-size: 20px;">Welcome to ${institutionName}</h2>
          <p style="color: #94A3B8; margin: 0 0 24px; font-size: 15px; line-height: 1.5;">
            Your account has been activated by your institution administrator. Use the credentials below to sign in.
          </p>

          <!-- Credentials box -->
          <div style="background: #1E293B; border: 1px solid #3A4558; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
              <span style="font-size: 13px; color: #64748B; width: 100px; flex-shrink: 0;">Portal:</span>
              <code style="background: #0F172A; color: #4A90D9; padding: 6px 14px; border-radius: 4px; font-size: 14px; font-family: 'Courier New', monospace; flex: 1;">${process.env.FRONTEND_URL || 'http://localhost:5173'}/login</code>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
              <span style="font-size: 13px; color: #64748B; width: 100px; flex-shrink: 0;">Roll No / ID:</span>
              <code style="background: #0F172A; color: #E03131; padding: 6px 14px; border-radius: 4px; font-size: 15px; font-family: 'Courier New', monospace; flex: 1;">${rollNo}</code>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 13px; color: #64748B; width: 100px; flex-shrink: 0;">Password:</span>
              <code style="background: #0F172A; color: #FF8787; padding: 6px 14px; border-radius: 4px; font-size: 15px; font-family: 'Courier New', monospace; flex: 1;">${password}</code>
            </div>
          </div>

          <!-- Warning -->
          <p style="margin: 0 0 24px; font-size: 13px; color: #FCA5A5;">
            For security, please change your password after your first login.
          </p>

          <hr style="border: none; border-top: 1px solid #3A4558; margin: 24px 0;" />
          <p style="color: #475569; font-size: 12px; margin: 0; text-align: center;">
            This is an automated message from EduFlow. Do not reply to this email.
          </p>
        </div>
      </div>
    `,
  }),

  leaveStatusUpdate: (studentName, dateRange, status, remarks = '') => ({
    subject: `EduFlow — Leave Request ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, ${status === 'approved' ? '#10B981, #059669' : '#EF4444, #DC2626'}); padding: 28px 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px; font-family: Georgia, serif;">EduFlow</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">Leave Request Update</p>
        </div>
        <div style="padding: 32px; color: #E2E8F0;">
          <h2 style="color: ${status === 'approved' ? '#34D399' : '#F87171'}; margin: 0 0 16px; font-size: 18px;">
            Leave ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}
          </h2>
          <p style="color: #94A3B8; margin: 0 0 12px; font-size: 14px;">Hi ${studentName},</p>
          <p style="color: #94A3B8; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
            Your leave request for <strong style="color: #E2E8F0;">${dateRange}</strong> has been
            <strong style="color: ${status === 'approved' ? '#34D399' : '#F87171'};">${status}</strong>.
          </p>
          ${remarks ? `
          <div style="background: #1E293B; border: 1px solid #3A4558; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; font-weight: 700;">Reviewer Remarks</p>
            <p style="margin: 0; font-size: 14px; color: #CBD5E1;">${remarks}</p>
          </div>
          ` : ''}
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/leaves"
               style="display: inline-block; background: ${status === 'approved' ? '#10B981' : '#EF4444'}; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
              View My Leaves
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #3A4558; margin: 24px 0;" />
          <p style="color: #475569; font-size: 12px; margin: 0; text-align: center;">This is an automated message from EduFlow.</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { initEmailTransporter, sendEmail, emailTemplates };

