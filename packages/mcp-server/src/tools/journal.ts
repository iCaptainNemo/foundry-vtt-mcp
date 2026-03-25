import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface JournalToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class JournalTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: JournalToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'JournalTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'create-journal-page',
        description: 'Create a new page within an existing journal entry.',
        inputSchema: {
          type: 'object',
          properties: {
            journalId: {
              type: 'string',
              description: 'Journal entry ID to add the page to',
            },
            name: {
              type: 'string',
              description: 'Name of the new page',
            },
            type: {
              type: 'string',
              enum: ['text', 'image', 'pdf', 'video'],
              description: 'Page type (default: text)',
              default: 'text',
            },
            content: {
              type: 'string',
              description: 'Page content (HTML for text pages, URL for image/video/pdf)',
            },
          },
          required: ['journalId', 'name'],
        },
      },
      {
        name: 'update-journal-page',
        description: 'Update an existing page within a journal entry.',
        inputSchema: {
          type: 'object',
          properties: {
            journalId: {
              type: 'string',
              description: 'Journal entry ID containing the page',
            },
            pageId: {
              type: 'string',
              description: 'Page ID to update',
            },
            name: {
              type: 'string',
              description: 'New name for the page',
            },
            content: {
              type: 'string',
              description: 'New content for the page (HTML)',
            },
          },
          required: ['journalId', 'pageId'],
        },
      },
      {
        name: 'delete-journal-page',
        description: 'Delete a specific page from a journal entry.',
        inputSchema: {
          type: 'object',
          properties: {
            journalId: {
              type: 'string',
              description: 'Journal entry ID containing the page',
            },
            pageId: {
              type: 'string',
              description: 'Page ID to delete',
            },
          },
          required: ['journalId', 'pageId'],
        },
      },
      {
        name: 'delete-journal',
        description: 'Delete an entire journal entry and all its pages.',
        inputSchema: {
          type: 'object',
          properties: {
            journalId: {
              type: 'string',
              description: 'Journal entry ID to delete',
            },
          },
          required: ['journalId'],
        },
      },
    ];
  }

  async handleCreateJournalPage(args: any): Promise<any> {
    const schema = z.object({
      journalId: z.string(),
      name: z.string(),
      type: z.enum(['text', 'image', 'pdf', 'video']).default('text'),
      content: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Creating journal page', { journalId: params.journalId, name: params.name, type: params.type });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.createJournalPage', {
        journalId: params.journalId,
        name: params.name,
        type: params.type,
        content: params.content,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to create journal page', error);
      throw new Error(
        `Failed to create journal page: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleUpdateJournalPage(args: any): Promise<any> {
    const schema = z.object({
      journalId: z.string(),
      pageId: z.string(),
      name: z.string().optional(),
      content: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Updating journal page', { journalId: params.journalId, pageId: params.pageId });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.updateJournalPage', {
        journalId: params.journalId,
        pageId: params.pageId,
        name: params.name,
        content: params.content,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to update journal page', error);
      throw new Error(
        `Failed to update journal page: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleDeleteJournalPage(args: any): Promise<any> {
    const schema = z.object({
      journalId: z.string(),
      pageId: z.string(),
    });

    const params = schema.parse(args);

    this.logger.info('Deleting journal page', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.deleteJournalPage', {
        journalId: params.journalId,
        pageId: params.pageId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to delete journal page', error);
      throw new Error(
        `Failed to delete journal page: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleDeleteJournal(args: any): Promise<any> {
    const schema = z.object({
      journalId: z.string(),
    });

    const params = schema.parse(args);

    this.logger.info('Deleting journal', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.deleteJournal', {
        journalId: params.journalId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to delete journal', error);
      throw new Error(
        `Failed to delete journal: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
