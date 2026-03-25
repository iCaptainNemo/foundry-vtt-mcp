import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface ActiveEffectsToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class ActiveEffectsTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: ActiveEffectsToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'ActiveEffectsTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'get-actor-effects',
        description: 'Get all active effects on an actor, including conditions, buffs, and debuffs.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to get effects for',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to get effects for (alternative to actorId)',
            },
          },
        },
      },
      {
        name: 'add-actor-effect',
        description: 'Add an active effect to an actor. Can include attribute changes, duration, and visual icon.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to add the effect to',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to add the effect to (alternative to actorId)',
            },
            label: {
              type: 'string',
              description: 'Name/label for the effect',
            },
            icon: {
              type: 'string',
              description: 'Icon path for the effect (default: icons/svg/aura.svg)',
            },
            changes: {
              type: 'array',
              description: 'Attribute changes the effect applies',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string', description: 'Attribute path to change (e.g. system.attributes.ac.value)' },
                  mode: { type: 'number', description: 'Change mode: 0=Custom, 1=Multiply, 2=Add, 3=Downgrade, 4=Upgrade, 5=Override' },
                  value: { type: 'string', description: 'Value to apply' },
                  priority: { type: 'number', description: 'Priority for conflict resolution' },
                },
              },
            },
            duration: {
              type: 'object',
              description: 'Duration settings for the effect',
              properties: {
                rounds: { type: 'number', description: 'Duration in rounds' },
                seconds: { type: 'number', description: 'Duration in seconds' },
                turns: { type: 'number', description: 'Duration in turns' },
              },
            },
            disabled: {
              type: 'boolean',
              description: 'Whether the effect starts disabled (default: false)',
              default: false,
            },
          },
          required: ['label'],
        },
      },
      {
        name: 'remove-actor-effect',
        description: 'Remove an active effect from an actor by effect ID.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to remove the effect from',
            },
            actorName: {
              type: 'string',
              description: 'Actor name to remove the effect from (alternative to actorId)',
            },
            effectId: {
              type: 'string',
              description: 'Effect ID to remove',
            },
          },
          required: ['effectId'],
        },
      },
      {
        name: 'toggle-actor-effect',
        description: 'Toggle an active effect on or off for an actor.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID',
            },
            actorName: {
              type: 'string',
              description: 'Actor name (alternative to actorId)',
            },
            effectId: {
              type: 'string',
              description: 'Effect ID to toggle',
            },
          },
          required: ['effectId'],
        },
      },
    ];
  }

  async handleGetActorEffects(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Getting actor effects', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.getActorEffects', {
        actorId: params.actorId,
        actorName: params.actorName,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get actor effects', error);
      throw new Error(
        `Failed to get actor effects: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleAddActorEffect(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      label: z.string(),
      icon: z.string().optional(),
      changes: z.array(z.object({
        key: z.string(),
        mode: z.number(),
        value: z.string(),
        priority: z.number().optional(),
      })).optional(),
      duration: z.object({
        rounds: z.number().optional(),
        seconds: z.number().optional(),
        turns: z.number().optional(),
      }).optional(),
      disabled: z.boolean().default(false),
    });

    const params = schema.parse(args);

    this.logger.info('Adding actor effect', { actorId: params.actorId, actorName: params.actorName, label: params.label });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.addActorEffect', {
        actorId: params.actorId,
        actorName: params.actorName,
        label: params.label,
        icon: params.icon,
        changes: params.changes,
        duration: params.duration,
        disabled: params.disabled,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to add actor effect', error);
      throw new Error(
        `Failed to add actor effect: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRemoveActorEffect(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      effectId: z.string(),
    });

    const params = schema.parse(args);

    this.logger.info('Removing actor effect', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.removeActorEffect', {
        actorId: params.actorId,
        actorName: params.actorName,
        effectId: params.effectId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to remove actor effect', error);
      throw new Error(
        `Failed to remove actor effect: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleToggleActorEffect(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      effectId: z.string(),
    });

    const params = schema.parse(args);

    this.logger.info('Toggling actor effect', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.toggleActorEffect', {
        actorId: params.actorId,
        actorName: params.actorName,
        effectId: params.effectId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to toggle actor effect', error);
      throw new Error(
        `Failed to toggle actor effect: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
