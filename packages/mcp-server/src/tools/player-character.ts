import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface PlayerCharacterToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class PlayerCharacterTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: PlayerCharacterToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'PlayerCharacterTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'create-player-character',
        description: 'Create a new D&D 5e player character actor in Foundry VTT with class, race, background, abilities, and calculated HP',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Character name',
            },
            race: {
              type: 'string',
              description: 'Character race, e.g. "Hill Dwarf", "Human", "High Elf", "Wood Elf", "Lightfoot Halfling"',
            },
            class: {
              type: 'string',
              description: 'Character class, e.g. "Fighter", "Wizard", "Cleric", "Rogue", "Ranger"',
            },
            level: {
              type: 'number',
              description: 'Character level (1-20, default 1)',
              default: 1,
              minimum: 1,
              maximum: 20,
            },
            abilities: {
              type: 'object',
              description: 'Ability scores',
              properties: {
                str: { type: 'number', description: 'Strength' },
                dex: { type: 'number', description: 'Dexterity' },
                con: { type: 'number', description: 'Constitution' },
                int: { type: 'number', description: 'Intelligence' },
                wis: { type: 'number', description: 'Wisdom' },
                cha: { type: 'number', description: 'Charisma' },
              },
              required: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
            },
            background: {
              type: 'string',
              description: 'Character background, e.g. "Folk Hero", "Sage", "Criminal", "Acolyte", "Outlander"',
            },
            gold: {
              type: 'number',
              description: 'Starting gold (gp), default 0',
              default: 0,
            },
            biography: {
              type: 'string',
              description: 'Character biography / backstory',
            },
            portrait: {
              type: 'string',
              description: 'Portrait image path (e.g. "systems/dnd5e/tokens/heroes/Fighter.webp"). Auto-assigned by class if omitted.',
            },
            token: {
              type: 'string',
              description: 'Token image path. Defaults to portrait if omitted.',
            },
          },
          required: ['name', 'race', 'class', 'abilities'],
        },
      },
      {
        name: 'update-character-stats',
        description: 'Update ability scores, level, HP, gold, name, biography, or portrait/token image on an existing D&D 5e character actor',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'Foundry actor ID of the character to update',
            },
            actorName: {
              type: 'string',
              description: 'Name of the actor to update (alternative to actorId)',
            },
            abilities: {
              type: 'object',
              description: 'Ability scores to update (any subset of str, dex, con, int, wis, cha)',
              properties: {
                str: { type: 'number' },
                dex: { type: 'number' },
                con: { type: 'number' },
                int: { type: 'number' },
                wis: { type: 'number' },
                cha: { type: 'number' },
              },
            },
            level: {
              type: 'number',
              description: 'New character level',
            },
            gold: {
              type: 'number',
              description: 'Set gp directly to this value',
            },
            hp: {
              type: 'object',
              description: 'HP values to update',
              properties: {
                current: { type: 'number', description: 'Current HP value' },
                max: { type: 'number', description: 'Maximum HP value' },
              },
            },
            name: {
              type: 'string',
              description: 'New character name',
            },
            biography: {
              type: 'string',
              description: 'New biography text',
            },
            portrait: {
              type: 'string',
              description: 'Portrait image path (sets the actor img field)',
            },
            token: {
              type: 'string',
              description: 'Token image path (sets prototypeToken.texture.src)',
            },
          },
        },
      },
    ];
  }

  async handleCreatePlayerCharacter(args: any): Promise<any> {
    const schema = z.object({
      name: z.string(),
      race: z.string(),
      class: z.string(),
      level: z.number().int().min(1).max(20).default(1),
      abilities: z.object({
        str: z.number(),
        dex: z.number(),
        con: z.number(),
        int: z.number(),
        wis: z.number(),
        cha: z.number(),
      }),
      background: z.string().optional(),
      gold: z.number().default(0),
      biography: z.string().optional(),
      portrait: z.string().optional(),
      token: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Creating player character', { name: params.name, class: params.class, race: params.race, level: params.level });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.createPlayerCharacter', params);
      return result;
    } catch (error) {
      this.logger.error('Failed to create player character', error);
      throw new Error(`Failed to create player character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleUpdateCharacterStats(args: any): Promise<any> {
    const schema = z.object({
      actorId: z.string().optional(),
      actorName: z.string().optional(),
      abilities: z.object({
        str: z.number().optional(),
        dex: z.number().optional(),
        con: z.number().optional(),
        int: z.number().optional(),
        wis: z.number().optional(),
        cha: z.number().optional(),
      }).optional(),
      level: z.number().int().min(1).max(20).optional(),
      gold: z.number().optional(),
      hp: z.object({
        current: z.number().optional(),
        max: z.number().optional(),
      }).optional(),
      name: z.string().optional(),
      biography: z.string().optional(),
      portrait: z.string().optional(),
      token: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Updating character stats', { actorId: params.actorId, actorName: params.actorName });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.updateCharacterStats', params);
      return result;
    } catch (error) {
      this.logger.error('Failed to update character stats', error);
      throw new Error(`Failed to update character stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
