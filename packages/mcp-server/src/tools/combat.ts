import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface CombatToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class CombatTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: CombatToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'CombatTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'start-combat',
        description: 'Start combat on the current scene. Optionally add specific tokens as combatants, or add all tokens on the scene.',
        inputSchema: {
          type: 'object',
          properties: {
            tokenIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional list of token IDs to add as combatants',
            },
            addAll: {
              type: 'boolean',
              description: 'If true, add all tokens on the current scene as combatants',
            },
          },
        },
      },
      {
        name: 'end-combat',
        description: 'End and delete the current combat encounter',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get-combat-state',
        description: 'Get the current combat state including round, turn, and all combatants with their initiative, HP, and active status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'next-turn',
        description: 'Advance combat to the next combatant\'s turn',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'previous-turn',
        description: 'Go back to the previous combatant\'s turn',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'roll-initiative',
        description: 'Roll initiative for combatants. Specify tokenIds to roll for specific tokens, rollNPCs to roll for all NPCs, or rollAll to roll for everyone.',
        inputSchema: {
          type: 'object',
          properties: {
            tokenIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Token IDs to roll initiative for',
            },
            rollAll: {
              type: 'boolean',
              description: 'Roll initiative for all combatants',
            },
            rollNPCs: {
              type: 'boolean',
              description: 'Roll initiative for all NPC combatants',
            },
          },
        },
      },
      {
        name: 'set-initiative',
        description: 'Set the initiative value for a specific combatant by tokenId or combatantId',
        inputSchema: {
          type: 'object',
          properties: {
            tokenId: {
              type: 'string',
              description: 'Token ID of the combatant',
            },
            combatantId: {
              type: 'string',
              description: 'Combatant ID (alternative to tokenId)',
            },
            initiative: {
              type: 'number',
              description: 'Initiative value to set',
            },
          },
          required: ['initiative'],
        },
      },
      {
        name: 'add-combatant',
        description: 'Add a token or actor to the current combat encounter. Requires either actorId or tokenId.',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Actor ID to add (will find their token on the active scene)',
            },
            tokenId: {
              type: 'string',
              description: 'Token ID to add directly',
            },
          },
        },
      },
      {
        name: 'remove-combatant',
        description: 'Remove a combatant from the current combat encounter',
        inputSchema: {
          type: 'object',
          properties: {
            combatantId: {
              type: 'string',
              description: 'Combatant ID to remove',
            },
          },
          required: ['combatantId'],
        },
      },
      {
        name: 'set-combatant-defeated',
        description: 'Mark a combatant as defeated or restore them',
        inputSchema: {
          type: 'object',
          properties: {
            combatantId: {
              type: 'string',
              description: 'Combatant ID to update',
            },
            defeated: {
              type: 'boolean',
              description: 'Whether the combatant is defeated',
            },
          },
          required: ['combatantId', 'defeated'],
        },
      },
      {
        name: 'update-combatant',
        description: 'Update a combatant\'s initiative or hidden status',
        inputSchema: {
          type: 'object',
          properties: {
            combatantId: {
              type: 'string',
              description: 'Combatant ID to update',
            },
            initiative: {
              type: 'number',
              description: 'New initiative value',
            },
            hidden: {
              type: 'boolean',
              description: 'Whether the combatant is hidden from players',
            },
          },
          required: ['combatantId'],
        },
      },
    ];
  }

  async handleStartCombat(args: any): Promise<any> {
    const schema = z.object({
      tokenIds: z.array(z.string()).optional(),
      addAll: z.boolean().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Starting combat', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.startCombat', {
        tokenIds: params.tokenIds,
        addAll: params.addAll,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to start combat', error);
      throw new Error(
        `Failed to start combat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleEndCombat(args: any): Promise<any> {
    this.logger.info('Ending combat');

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.endCombat', {});

      return result;
    } catch (error) {
      this.logger.error('Failed to end combat', error);
      throw new Error(
        `Failed to end combat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleGetCombatState(args: any): Promise<any> {
    this.logger.info('Getting combat state');

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.getCombatState', {});

      return result;
    } catch (error) {
      this.logger.error('Failed to get combat state', error);
      throw new Error(
        `Failed to get combat state: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleNextTurn(args: any): Promise<any> {
    this.logger.info('Advancing to next turn');

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.nextTurn', {});

      return result;
    } catch (error) {
      this.logger.error('Failed to advance turn', error);
      throw new Error(
        `Failed to advance to next turn: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handlePreviousTurn(args: any): Promise<any> {
    this.logger.info('Going to previous turn');

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.previousTurn', {});

      return result;
    } catch (error) {
      this.logger.error('Failed to go to previous turn', error);
      throw new Error(
        `Failed to go to previous turn: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRollInitiative(args: any): Promise<any> {
    const schema = z.object({
      tokenIds: z.array(z.string()).optional(),
      rollAll: z.boolean().optional(),
      rollNPCs: z.boolean().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Rolling initiative', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.rollInitiative', {
        tokenIds: params.tokenIds,
        rollAll: params.rollAll,
        rollNPCs: params.rollNPCs,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to roll initiative', error);
      throw new Error(
        `Failed to roll initiative: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleSetInitiative(args: any): Promise<any> {
    const schema = z.object({
      tokenId: z.string().optional(),
      combatantId: z.string().optional(),
      initiative: z.number(),
    });

    const params = schema.parse(args);

    this.logger.info('Setting initiative', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.setInitiative', {
        tokenId: params.tokenId,
        combatantId: params.combatantId,
        initiative: params.initiative,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to set initiative', error);
      throw new Error(
        `Failed to set initiative: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleAddCombatant(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      tokenId: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Adding combatant', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.addCombatant', {
        actorId: params.actorId,
        tokenId: params.tokenId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to add combatant', error);
      throw new Error(
        `Failed to add combatant: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleRemoveCombatant(args: any): Promise<any> {
    const schema = z.object({
      combatantId: z.string(),
    });

    const params = schema.parse(args);

    this.logger.info('Removing combatant', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.removeCombatant', {
        combatantId: params.combatantId,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to remove combatant', error);
      throw new Error(
        `Failed to remove combatant: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleSetCombatantDefeated(args: any): Promise<any> {
    const schema = z.object({
      combatantId: z.string(),
      defeated: z.boolean(),
    });

    const params = schema.parse(args);

    this.logger.info('Setting combatant defeated status', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.setCombatantDefeated', {
        combatantId: params.combatantId,
        defeated: params.defeated,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to set combatant defeated status', error);
      throw new Error(
        `Failed to set combatant defeated: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleUpdateCombatant(args: any): Promise<any> {
    const schema = z.object({
      combatantId: z.string(),
      initiative: z.number().optional(),
      hidden: z.boolean().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Updating combatant', params);

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.updateCombatant', {
        combatantId: params.combatantId,
        initiative: params.initiative,
        hidden: params.hidden,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to update combatant', error);
      throw new Error(
        `Failed to update combatant: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
