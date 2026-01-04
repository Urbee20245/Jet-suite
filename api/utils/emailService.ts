import type { VercelRequest, VercelResponse } from '@vercel/node';

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  tempPassword: string;
}

/**
 * Sends a welcome email to a new user with their temporary login credentials.
 * In a production environment, this would integrate with a service like SendGrid or AWS SES.
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const loginUrl = 'https://getjetsuite.com/login';
  
  const emailContent = `
=====================================================
  JETSUITE WELCOME EMAIL (LOGGED TO CONSOLE)
=====================================================
TO: ${data.email}
SUBJECT: Welcome to JetSuite, ${data.firstName}! Your Account is Ready.

Hi ${data.firstName},

Welcome to JetSuite! We are thrilled to have your business, ${data.businessName}, join our platform. Your account is now active, and you can log in immediately to start building your growth foundation.

Here are your temporary login credentials:

-----------------------------------------------------
LOGIN EMAIL: ${data.email}
TEMPORARY PASSWORD: ${data.tempPassword}
LOGIN URL: ${loginUrl}
-----------------------------------------------------

**IMPORTANT NEXT STEP:**
Please log in immediately and change your password in the Account settings for security.

**YOUR FIRST ACTION:**
Once logged in, you will be guided to the Business Details page. Complete your profile and run your first JetBiz analysis to generate your personalized Growth Plan.

If you have any questions, please reply to this email or contact support@getjetsuite.com.

Happy Growing!
The JetSuite Team
`;

  console.log(emailContent);

  // TODO: Production Email Integration Example (Uncomment and configure for live deployment)
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: data.email,
    from: 'welcome@getjetsuite.com',
    subject: 'Welcome to JetSuite! Your Account is Ready.',
    html: \`
      <p>Welcome to JetSuite! Your account for <strong>\${data.businessName}</strong> is ready.</p>
      <p>Your temporary password is: <strong>\${data.tempPassword}</strong></p>
      <p>Please <a href="\${loginUrl}">click here to log in</a> and change your password immediately.</p>
    \`,
  };

  try {
    await sgMail.send(msg);
    console.log('SendGrid email sent successfully');
  } catch (error) {
    console.error('SendGrid Error:', error);
  }
  */
}