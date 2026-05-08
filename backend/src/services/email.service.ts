import nodemailer from 'nodemailer';

// Dev: logs to console + captures via Ethereal (https://ethereal.email)
// Prod: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars
function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Dev fallback: print to console
  return nodemailer.createTransport({ jsonTransport: true });
}

const transport = createTransport();
const FROM = process.env.SMTP_FROM ?? 'noreply@leasing.at';

async function send(to: string, subject: string, html: string): Promise<void> {
  const info = await transport.sendMail({ from: FROM, to, subject, html });

  // When using the JSON transport, info.message contains the raw mail object
  if (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'test') {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL] Preview: ${(info as any).message}`);
  }
}

export async function sendApprovalNotification(
  customerEmail: string,
  customerName: string,
  contractId: string,
  monthlyPayment: number
): Promise<void> {
  await send(
    customerEmail,
    'Your lease application has been approved',
    `<p>Dear ${customerName},</p>
     <p>Your lease application <strong>${contractId}</strong> has been <strong>approved</strong>.</p>
     <p>Monthly payment: <strong>EUR ${monthlyPayment.toFixed(2)}</strong></p>
     <p>Log in to view your contract and download the PDF.</p>
     <p>Austrian Leasing GmbH</p>`
  );
}

export async function sendRejectionNotification(
  customerEmail: string,
  customerName: string,
  contractId: string,
  reason: string
): Promise<void> {
  // §7 VKrG: applicant must be notified of rejection with reason
  await send(
    customerEmail,
    'Your lease application could not be approved',
    `<p>Dear ${customerName},</p>
     <p>We regret to inform you that your lease application <strong>${contractId}</strong>
     has been <strong>rejected</strong>.</p>
     <p>Reason: ${reason}</p>
     <p>If you have questions, please contact us.</p>
     <p>Austrian Leasing GmbH</p>`
  );
}
