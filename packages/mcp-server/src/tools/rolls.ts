import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface NativeRollToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class NativeRollTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: NativeRollToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'NativeRollTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'roll-ability-check',
        description: 'Roll an ability check for an actor using the native D&D 5e system. Returns roll total and formula. Only supported for D&D 5e.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to roll for',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to roll for (alternative to actorId)',
            },
            ability: {
              type: 'string',
              enum: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
              description: 'Ability score to roll',
            },
            flavor: {
              type: 'string',
              description: 'Optional flavor text for the roll',
            },
            postToChat: {
              type: 'boolean',
              description: 'Whether to post the roll to chat (default: true)',
              default: true,
            },
          },
          required: ['ability'],
        },
      },
      {
        name: 'roll-skill-check',
        description: 'Roll a skill check for an actor using the native D&D 5e system. Accepts full skill name (e.g. "perception") or short key (e.g. "prc"). Only supported for D&D 5e.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to roll for',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to roll for (alternative to actorId)',
            },
            skill: {
              type: 'string',
              description: 'Skill name (e.g. "perception", "stealth") or short key (e.g. "prc", "ste")',
            },
            postToChat: {
              type: 'boolean',
              description: 'Whether to post the roll to chat (default: true)',
              default: true,
            },
          },
          required: ['skill'],
        },
      },
      {
        name: 'roll-saving-throw',
        description: 'Roll a saving throw for an actor using the native D&D 5e system. Only supported for D&D 5e.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to roll for',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to roll for (alternative to actorId)',
            },
            ability: {
              type: 'string',
              enum: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
              description: 'Ability score to save with',
            },
            flavor: {
              type: 'string',
              description: 'Optional flavor text for the roll',
            },
            postToChat: {
              type: 'boolean',
              description: 'Whether to post the roll to chat (default: true)',
              default: true,
            },
          },
          required: ['ability'],
        },
      },
      {
        name: 'roll-attack',
        description: 'Roll an attack roll for an actor\'s weapon or spell using the native D&D 5e system. Only supported for D&D 5e.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to roll for',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to roll for (alternative to actorId)',
            },
            itemName: {
              type: 'string',
              description: 'Name of the weapon or spell to attack with',
            },
            postToChat: {
              type: 'boolean',
              description: 'Whether to post the roll to chat (default: true)',
              default: true,
            },
          },
          required: ['itemName'],
        },
      },
      {
        name: 'roll-damage',
        description: 'Roll damage for an actor\'s weapon or spell using the native D&D 5e system. Only supported for D&D 5e.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to roll for',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to roll for (alternative to actorId)',
            },
            itemName: {
              type: 'string',
              description: 'Name of the weapon or spell to roll damage for',
            },
            critical: {
              type: 'boolean',
              description: 'Whether this is a critical hit (default: false)',
              default: false,
            },
            postToChat: {
              type: 'boolean',
              description: 'Whether to post the roll to chat (default: true)',
              default: true,
            },
          },
          required: ['itemName'],
        },
      },
    ];
  }

  async handleRollAbilityCheck(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
      flavor: z.string().optional(),
      postToChat: z.boolean().default(true),
    });

    const params = schema.parse(args);

    this.logger.info('Rolling ability check', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.rollAbilityCheck', {
        actorId: params.actorId,
        actorName: params.actorName,
        ability: params.ability,
        flavor: params.flavor,
        postToChat: params.postToChat,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to roll ability check', error);
      throw new Error(
        `Failed to roll ability check: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRollSkillCheck(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      skill: z.string(),
      postToChat: z.boolean().default(true),
    });

    const params = schema.parse(args);

    this.logger.info('Rolling skill check', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.rollSkillCheck', {
        actorId: params.actorId,
        actorName: params.actorName,
        skill: params.skill,
        postToChat: params.postToChat,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to roll skill check', error);
      throw new Error(
        `Failed to roll skill check: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRollSavingThrow(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
      flavor: z.string().optional(),
      postToChat: z.boolean().default(true),
    });

    const params = schema.parse(args);

    this.logger.info('Rolling saving throw', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.rollSavingThrow', {
        actorId: params.actorId,
        actorName: params.actorName,
        ability: params.ability,
        flavor: params.flavor,
        postToChat: params.postToChat,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to roll saving throw', error);
      throw new Error(
        `Failed to roll saving throw: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRollAttack(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      itemName: z.string(),
      postToChat: z.boolean().default(true),
    });

    const params = schema.parse(args);

    this.logger.info('Rolling attack', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.rollAttack', {
        actorId: params.actorId,
        actorName: params.actorName,
        itemName: params.itemName,
        postToChat: params.postToChat,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to roll attack', error);
      throw new Error(
        `Failed to roll attack: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRollDamage(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      itemName: z.string(),
      critical: z.boolean().default(false),
      postToChat: z.boolean().default(true),
    });

    const params = schema.parse(args);

    this.logger.info('Rolling damage', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.rollDamage', {
        actorId: params.actorId,
        actorName: params.actorName,
        itemName: params.itemName,
        critical: params.critical,
        postToChat: params.postToChat,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to roll damage', error);
      throw new Error(
        `Failed to roll damage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
