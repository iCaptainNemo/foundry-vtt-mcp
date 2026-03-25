import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface ChatToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class ChatTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: ChatToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'ChatTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'get-chat-messages',
        description:
          'Read recent Foundry VTT chat messages. Use sinceId to poll for new messages since last read.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of recent messages to return (default: 20)',
              default: 20,
            },
            since: {
              type: 'string',
              description: 'ISO timestamp — only return messages after this time',
            },
            sinceId: {
              type: 'string',
              description: 'Message ID — only return messages after this message (preferred for polling)',
            },
          },
        },
      },
      {
        name: 'send-chat-message',
        description:
          'Post a message to Foundry VTT chat as the GM. Use for narration, scene descriptions, NPC dialogue, and announcements.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Message content (HTML supported)',
            },
            speakerAlias: {
              type: 'string',
              description: 'Display name shown as sender (default: "Dungeon Master")',
            },
            whisperTo: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of player names to whisper to (private message)',
            },
          },
          required: ['content'],
        },
      },
    ];
  }

  async handleGetChatMessages(args: any): Promise<any> {
    const schema = z.object({
      limit: z.number().default(20),
      since: z.string().optional(),
      sinceId: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Getting chat messages', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.getChatMessages', {
        limit: params.limit,
        since: params.since,
        sinceId: params.sinceId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get chat messages', error);
      throw new Error(
        `Failed to get chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleSendChatMessage(args: any): Promise<any> {
    const schema = z.object({
      content: z.string(),
      speakerAlias: z.string().optional(),
      whisperTo: z.array(z.string()).optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Sending chat message', { speakerAlias: params.speakerAlias });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.sendChatMessage', {
        content: params.content,
        speakerAlias: params.speakerAlias,
        whisperTo: params.whisperTo,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to send chat message', error);
      throw new Error(
        `Failed to send chat message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
