import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clean existing data
    await cleanDatabase();

    // Create organizations
    const organizations = await createOrganizations();
    console.log(`✓ Created ${organizations.length} organizations`);

    // Create users for each organization
    const users = await createUsers(organizations);
    console.log(`✓ Created ${users.length} users`);

    // Create leads for each organization
    const leads = await createLeads(organizations, users);
    console.log(`✓ Created ${leads.length} leads`);

    // Create campaigns
    const campaigns = await createCampaigns(organizations);
    console.log(`✓ Created ${campaigns.length} campaigns`);

    // Create activities and interactions
    await createActivities(leads, users);
    console.log('✓ Created activities and interactions');

    // Create templates
    await createTemplates(organizations);
    console.log('✓ Created email and SMS templates');

    // Create tags
    await createTags(organizations);
    console.log('✓ Created tags');

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.auditLog.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.call.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.leadTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.leadMetric.deleteMany();
  await prisma.campaignMetric.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.template.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.billingHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

async function createOrganizations() {
  const organizations = [
    {
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      plan: 'ENTERPRISE',
      industry: 'Technology',
      size: '100-500',
      responseTimeSeconds: 30,
      monthlyLeadLimit: 10000,
      monthlyCallLimit: 5000,
      monthlySMSLimit: 20000,
      monthlyEmailLimit: 50000
    },
    {
      name: 'Growth Marketing Agency',
      domain: 'growthagency.io',
      plan: 'PROFESSIONAL',
      industry: 'Marketing',
      size: '10-50',
      responseTimeSeconds: 60,
      monthlyLeadLimit: 5000,
      monthlyCallLimit: 2000,
      monthlySMSLimit: 10000,
      monthlyEmailLimit: 25000
    },
    {
      name: 'StartupHub',
      domain: 'startuphub.co',
      plan: 'STARTER',
      industry: 'Software',
      size: '1-10',
      responseTimeSeconds: 120,
      monthlyLeadLimit: 1000,
      monthlyCallLimit: 500,
      monthlySMSLimit: 2000,
      monthlyEmailLimit: 5000
    }
  ];

  return await prisma.organization.createMany({
    data: organizations,
    skipDuplicates: true
  }).then(() => prisma.organization.findMany());
}

async function createUsers(organizations) {
  const users = [];
  const hashedPassword = await bcrypt.hash('Demo123!', 10);

  for (const org of organizations) {
    // Create admin user
    users.push({
      email: `admin@${org.domain}`,
      name: faker.person.fullName(),
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id,
      emailVerified: true,
      phoneNumber: faker.phone.number(),
      timezone: 'America/New_York'
    });

    // Create manager
    users.push({
      email: `manager@${org.domain}`,
      name: faker.person.fullName(),
      password: hashedPassword,
      role: 'MANAGER',
      organizationId: org.id,
      emailVerified: true,
      phoneNumber: faker.phone.number(),
      timezone: 'America/Los_Angeles'
    });

    // Create SDRs
    for (let i = 1; i <= 3; i++) {
      users.push({
        email: `sdr${i}@${org.domain}`,
        name: faker.person.fullName(),
        password: hashedPassword,
        role: 'SDR',
        organizationId: org.id,
        emailVerified: true,
        phoneNumber: faker.phone.number(),
        timezone: faker.helpers.arrayElement(['America/New_York', 'America/Chicago', 'America/Los_Angeles'])
      });
    }
  }

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true
  });

  return await prisma.user.findMany();
}

async function createLeads(organizations, users) {
  const leads = [];
  const statuses = ['NEW', 'CONTACTED', 'QUALIFYING', 'QUALIFIED', 'NURTURE', 'CLOSED_WON', 'CLOSED_LOST'];
  const sources = ['Website', 'LinkedIn', 'Referral', 'Cold Outreach', 'Event', 'Content Download', 'Demo Request'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  for (const org of organizations) {
    const orgUsers = users.filter(u => u.organizationId === org.id && u.role === 'SDR');
    
    // Create 20-50 leads per organization
    const leadCount = faker.number.int({ min: 20, max: 50 });
    
    for (let i = 0; i < leadCount; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const company = faker.company.name();
      
      leads.push({
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number(),
        company,
        jobTitle: faker.person.jobTitle(),
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
        website: faker.internet.url(),
        source: faker.helpers.arrayElement(sources),
        sourceDetails: {
          utm_source: faker.helpers.arrayElement(['google', 'linkedin', 'facebook', 'direct']),
          utm_medium: faker.helpers.arrayElement(['cpc', 'organic', 'social', 'email']),
          utm_campaign: faker.helpers.arrayElement(['summer-2024', 'product-launch', 'webinar-series'])
        },
        status: faker.helpers.arrayElement(statuses),
        score: faker.number.int({ min: 0, max: 100 }),
        priority: faker.helpers.arrayElement(priorities),
        organizationId: org.id,
        assignedToId: faker.helpers.arrayElement(orgUsers).id,
        customData: {
          budget: faker.helpers.arrayElement(['< $10k', '$10k-$50k', '$50k-$100k', '> $100k']),
          timeline: faker.helpers.arrayElement(['Immediate', '1-3 months', '3-6 months', '6+ months']),
          competitors: faker.helpers.arrayElements(['Competitor A', 'Competitor B', 'Competitor C'], 2)
        }
      });
    }
  }

  await prisma.lead.createMany({
    data: leads,
    skipDuplicates: true
  });

  return await prisma.lead.findMany();
}

async function createCampaigns(organizations) {
  const campaigns = [];
  const campaignTypes = ['EMAIL', 'SMS', 'MULTI_CHANNEL', 'NURTURE'];
  const campaignStatuses = ['ACTIVE', 'SCHEDULED', 'COMPLETED'];

  for (const org of organizations) {
    campaigns.push({
      name: 'Summer Product Launch',
      description: 'Multi-channel campaign for new product launch',
      type: 'MULTI_CHANNEL',
      status: 'ACTIVE',
      targetAudience: {
        industry: ['Technology', 'Finance'],
        companySize: ['50-200', '200-1000'],
        jobTitles: ['CTO', 'VP Engineering', 'Director of IT']
      },
      budget: 50000,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      organizationId: org.id
    });

    campaigns.push({
      name: 'Lead Nurture Sequence',
      description: 'Automated nurture campaign for cold leads',
      type: 'NURTURE',
      status: 'ACTIVE',
      targetAudience: {
        leadStatus: ['NURTURE', 'UNQUALIFIED'],
        scoreRange: { min: 20, max: 60 }
      },
      organizationId: org.id
    });

    campaigns.push({
      name: 'Webinar Follow-up',
      description: 'Follow-up sequence for webinar attendees',
      type: 'EMAIL',
      status: 'SCHEDULED',
      startDate: new Date('2024-07-15'),
      organizationId: org.id
    });
  }

  await prisma.campaign.createMany({
    data: campaigns,
    skipDuplicates: true
  });

  return await prisma.campaign.findMany();
}

async function createActivities(leads, users) {
  const activities = [];
  const activityTypes = [
    'INBOUND_RECEIVED',
    'CALL_INITIATED',
    'CALL_COMPLETED',
    'SMS_SENT',
    'EMAIL_SENT',
    'STATUS_CHANGED',
    'NOTE_ADDED'
  ];

  // Create 3-10 activities per lead
  for (const lead of leads.slice(0, 50)) { // Limit to first 50 leads for performance
    const activityCount = faker.number.int({ min: 3, max: 10 });
    const leadUsers = users.filter(u => u.organizationId === lead.organizationId);
    
    for (let i = 0; i < activityCount; i++) {
      const activityType = faker.helpers.arrayElement(activityTypes);
      let description = '';
      let data = {};

      switch (activityType) {
        case 'INBOUND_RECEIVED':
          description = `Inbound inquiry from ${lead.source}`;
          data = { channel: faker.helpers.arrayElement(['website', 'email', 'phone']) };
          break;
        case 'CALL_COMPLETED':
          description = 'Completed discovery call';
          data = { 
            duration: faker.number.int({ min: 300, max: 3600 }),
            outcome: faker.helpers.arrayElement(['Interested', 'Not ready', 'No budget'])
          };
          break;
        case 'EMAIL_SENT':
          description = faker.helpers.arrayElement(['Sent follow-up email', 'Sent proposal', 'Sent case study']);
          data = { 
            subject: faker.lorem.sentence(),
            opened: faker.datatype.boolean(),
            clicked: faker.datatype.boolean()
          };
          break;
        case 'STATUS_CHANGED':
          description = `Status changed to ${lead.status}`;
          data = { 
            previousStatus: 'NEW',
            newStatus: lead.status,
            reason: faker.lorem.sentence()
          };
          break;
        default:
          description = faker.lorem.sentence();
      }

      activities.push({
        type: activityType,
        description,
        data,
        leadId: lead.id,
        userId: faker.helpers.arrayElement(leadUsers).id,
        createdAt: faker.date.recent({ days: 30 })
      });
    }
  }

  await prisma.activity.createMany({
    data: activities,
    skipDuplicates: true
  });
}

async function createTemplates(organizations) {
  const templates = [];

  for (const org of organizations) {
    // Email templates
    templates.push({
      name: 'Initial Outreach',
      type: 'EMAIL',
      subject: 'Quick question about {{company}}',
      content: `Hi {{firstName}},

I noticed that {{company}} is growing rapidly in the {{industry}} space. Many companies at your stage struggle with {{pain_point}}.

We've helped similar companies like {{similar_company}} achieve {{result}}.

Would you be open to a brief 15-minute call to discuss how we might help {{company}}?

Best regards,
{{sender_name}}`,
      variables: ['firstName', 'company', 'industry', 'pain_point', 'similar_company', 'result', 'sender_name'],
      organizationId: org.id
    });

    templates.push({
      name: 'Follow-up #1',
      type: 'EMAIL',
      subject: 'Re: Quick question about {{company}}',
      content: `Hi {{firstName}},

I wanted to follow up on my previous email. I understand you're busy, so I'll keep this brief.

We recently helped {{case_study_company}} reduce their {{metric}} by {{percentage}}%.

Would this type of improvement be valuable for {{company}}?

If not, I'll stop reaching out. Just let me know either way.

Thanks,
{{sender_name}}`,
      variables: ['firstName', 'company', 'case_study_company', 'metric', 'percentage', 'sender_name'],
      organizationId: org.id
    });

    // SMS templates
    templates.push({
      name: 'SMS Follow-up',
      type: 'SMS',
      content: 'Hi {{firstName}}, this is {{sender_name}} from {{company_name}}. I sent you an email about {{topic}}. Is this still a priority for you?',
      variables: ['firstName', 'sender_name', 'company_name', 'topic'],
      organizationId: org.id
    });

    // Voicemail script
    templates.push({
      name: 'Voicemail Script',
      type: 'SCRIPT',
      content: `Hi {{firstName}}, this is {{sender_name}} from {{company_name}}.

I'm reaching out because we help companies in {{industry}} with {{value_prop}}.

I'd love to share how we helped {{similar_company}} achieve {{result}}.

Please give me a call back at {{callback_number}} or feel free to email me at {{email}}.

Thanks, and have a great day!`,
      variables: ['firstName', 'sender_name', 'company_name', 'industry', 'value_prop', 'similar_company', 'result', 'callback_number', 'email'],
      organizationId: org.id
    });
  }

  await prisma.template.createMany({
    data: templates,
    skipDuplicates: true
  });
}

async function createTags(organizations) {
  const tags = [];
  const tagNames = [
    { name: 'Hot Lead', color: '#FF0000' },
    { name: 'Enterprise', color: '#0000FF' },
    { name: 'SMB', color: '#00FF00' },
    { name: 'Decision Maker', color: '#FF00FF' },
    { name: 'Technical Buyer', color: '#FFFF00' },
    { name: 'Economic Buyer', color: '#00FFFF' },
    { name: 'Champion', color: '#FFA500' },
    { name: 'Competitor User', color: '#800080' },
    { name: 'Referral', color: '#008000' },
    { name: 'Partner Lead', color: '#000080' }
  ];

  for (const org of organizations) {
    for (const tag of tagNames) {
      tags.push({
        ...tag,
        organizationId: org.id
      });
    }
  }

  await prisma.tag.createMany({
    data: tags,
    skipDuplicates: true
  });
}

// Run the seed function
seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});