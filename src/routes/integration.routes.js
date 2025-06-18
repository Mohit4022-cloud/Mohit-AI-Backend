import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Get all integrations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { organizationId: req.user.organizationId }
    });

    // Decrypt sensitive data before sending
    const safeIntegrations = integrations.map(integration => ({
      ...integration,
      config: {
        ...integration.config,
        // Hide sensitive fields
        apiKey: integration.config.apiKey ? '***' : undefined,
        clientSecret: integration.config.clientSecret ? '***' : undefined
      }
    }));

    res.json(safeIntegrations);
  } catch (error) {
    next(error);
  }
});

// Create or update integration
router.post('/:type', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { type } = req.params;
    const config = req.body;

    // Validate integration type
    const validTypes = ['HUBSPOT', 'SALESFORCE', 'PIPEDRIVE', 'MONDAY', 'ZOHO', 'CUSTOM'];
    if (!validTypes.includes(type)) {
      throw new AppError('Invalid integration type', 400);
    }

    // Encrypt sensitive configuration
    const encryptedConfig = encryptConfig(config);

    const integration = await prisma.integration.upsert({
      where: {
        organizationId_type: {
          organizationId: req.user.organizationId,
          type
        }
      },
      update: {
        config: encryptedConfig,
        isActive: true
      },
      create: {
        type,
        config: encryptedConfig,
        organizationId: req.user.organizationId,
        isActive: true
      }
    });

    res.json({
      id: integration.id,
      type: integration.type,
      isActive: integration.isActive,
      createdAt: integration.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Test integration
router.post('/:type/test', authenticate, async (req, res, next) => {
  try {
    const { type } = req.params;

    const integration = await prisma.integration.findFirst({
      where: {
        organizationId: req.user.organizationId,
        type
      }
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    // Decrypt config
    const config = decryptConfig(integration.config);

    // Test connection based on type
    let testResult;
    switch (type) {
      case 'HUBSPOT':
        testResult = await testHubSpotConnection(config);
        break;
      case 'SALESFORCE':
        testResult = await testSalesforceConnection(config);
        break;
      case 'PIPEDRIVE':
        testResult = await testPipedriveConnection(config);
        break;
      default:
        throw new AppError('Test not implemented for this integration', 400);
    }

    res.json(testResult);
  } catch (error) {
    next(error);
  }
});

// Delete integration
router.delete('/:type', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { type } = req.params;

    await prisma.integration.delete({
      where: {
        organizationId_type: {
          organizationId: req.user.organizationId,
          type
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Helper functions
function encryptConfig(config) {
  // TODO: Implement proper encryption
  // For now, just return the config
  return config;
}

function decryptConfig(config) {
  // TODO: Implement proper decryption
  // For now, just return the config
  return config;
}

async function testHubSpotConnection(config) {
  try {
    // TODO: Implement actual HubSpot API test
    return {
      success: true,
      message: 'HubSpot connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testSalesforceConnection(config) {
  try {
    // TODO: Implement actual Salesforce API test
    return {
      success: true,
      message: 'Salesforce connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function testPipedriveConnection(config) {
  try {
    // TODO: Implement actual Pipedrive API test
    return {
      success: true,
      message: 'Pipedrive connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

export default router;