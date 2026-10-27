import { prisma } from '../src/config/prisma.js';
import { Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util.js';
import { AuditService } from '../src/services/audit.service.js';
import readline from 'readline';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log('   MatchMyJobs - Platform Administrator Provisioning   ');
  console.log('======================================================\n');

  let email = process.env.ADMIN_EMAIL?.trim();
  let password = process.env.ADMIN_PASSWORD?.trim();

  if (!email) {
    email = await prompt('Enter Platform Administrator Email: ');
  }

  if (!password) {
    password = await prompt('Enter Platform Administrator Password: ');
  }

  if (!email || !email.includes('@')) {
    console.error('Error: A valid email address is required.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  console.log(`\nProvisioning Platform Administrator for: ${normalizedEmail}`);

  // Hash password using 12 salt rounds bcrypt
  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      passwordHash,
      role: Role.PLATFORM_ADMIN,
      status: 'ACTIVE',
      isEmailVerified: true,
    },
    create: {
      email: normalizedEmail,
      passwordHash,
      role: Role.PLATFORM_ADMIN,
      status: 'ACTIVE',
      isEmailVerified: true,
      adminPermissions: [
        'MANAGE_COMPANIES',
        'MANAGE_CANDIDATES',
        'MANAGE_JOBS',
        'VIEW_REPORTS',
        'MANAGE_RECRUITMENT',
        'MANAGE_ADS',
        'MANAGE_SETTINGS',
      ],
    },
  });

  await AuditService.log({
    userId: admin.id,
    userEmail: admin.email,
    userRole: admin.role,
    action: 'PLATFORM_SUPER_ADMIN_PROVISIONED',
    resource: 'ADMIN',
    resourceId: admin.id,
    details: {
      provisionedVia: 'CLI_SCRIPT',
      timestamp: new Date().toISOString(),
    },
  });

  console.log('✓ Platform Administrator account successfully provisioned and secured.');
  console.log(`✓ ID: ${admin.id}`);
  console.log(`✓ Role: ${admin.role}`);
  console.log(`✓ Status: ${admin.status}`);
  console.log('✓ Secrets and credentials were not logged.\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Provisioning failed:', err.message);
  process.exit(1);
});
