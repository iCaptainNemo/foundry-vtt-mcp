import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface SceneToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class SceneTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: SceneToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'SceneTools' });
  }

  /**
   * Tool definitions for scene operations
   */
  getToolDefinitions() {
    return [
      {
        name: 'get-current-scene',
        description: 'Get information about the currently active scene, including tokens and layout',
        inputSchema: {
          type: 'object',
          properties: {
            includeTokens: {
              type: 'boolean',
              description: 'Whether to include detailed token information (default: true)',
              default: true,
            },
            includeHidden: {
              type: 'boolean',
              description: 'Whether to include hidden tokens and elements (default: false)',
              default: false,
            },
          },
        },
      },
      {
        name: 'play-playlist',
        description: 'Start playing a Foundry VTT playlist by name or ID',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the playlist to play',
            },
            id: {
              type: 'string',
              description: 'ID of the playlist to play (alternative to name)',
            },
          },
        },
      },
      {
        name: 'stop-playlist',
        description: 'Stop a Foundry VTT playlist by name or ID, or stop all playlists',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the playlist to stop',
            },
            id: {
              type: 'string',
              description: 'ID of the playlist to stop (alternative to name)',
            },
            stopAll: {
              type: 'boolean',
              description: 'If true, stop all currently playing playlists',
            },
          },
        },
      },
      {
        name: 'get-world-info',
        description: 'Get basic information about the Foundry world and system',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get-scene-screenshot',
        description: 'Capture a scaled-down screenshot of the current Foundry canvas for visual inspection of the map layout, terrain, and token positions',
        inputSchema: {
          type: 'object',
          properties: {
            scale: {
              type: 'number',
              description: 'Scale factor for the screenshot (0.1–1.0, default 0.33 for ~1/3 resolution)',
              default: 0.33,
            },
            quality: {
              type: 'number',
              description: 'JPEG quality (0.1–1.0, default 0.75)',
              default: 0.75,
            },
          },
        },
      },
    ];
  }

  async handleGetCurrentScene(args: any): Promise<any> {
    const schema = z.object({
      includeTokens: z.boolean().default(true),
      includeHidden: z.boolean().default(false),
    });

    const { includeTokens, includeHidden } = schema.parse(args);

    this.logger.info('Getting current scene information', { includeTokens, includeHidden });

    try {
      const sceneData = await this.foundryClient.query('foundry-mcp-bridge.getActiveScene');

      this.logger.debug('Successfully retrieved scene data', {
        sceneId: sceneData.id,
        sceneName: sceneData.name,
        tokenCount: sceneData.tokens?.length || 0,
      });

      return this.formatSceneResponse(sceneData, includeTokens, includeHidden);

    } catch (error) {
      this.logger.error('Failed to get current scene', error);
      throw new Error(`Failed to get current scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleGetWorldInfo(_args: any): Promise<any> {
    this.logger.info('Getting world information');

    try {
      const worldData = await this.foundryClient.query('foundry-mcp-bridge.getWorldInfo');

      this.logger.debug('Successfully retrieved world data', {
        worldId: worldData.id,
        system: worldData.system,
      });

      return this.formatWorldResponse(worldData);

    } catch (error) {
      this.logger.error('Failed to get world information', error);
      throw new Error(`Failed to get world information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handlePlayPlaylist(args: any): Promise<any> {
    const schema = z.object({
      name: z.string().optional(),
      id: z.string().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Playing playlist', { name: params.name, id: params.id });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.playPlaylist', {
        name: params.name,
        id: params.id,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to play playlist', error);
      throw new Error(
        `Failed to play playlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleStopPlaylist(args: any): Promise<any> {
    const schema = z.object({
      name: z.string().optional(),
      id: z.string().optional(),
      stopAll: z.boolean().optional(),
    });

    const params = schema.parse(args);

    this.logger.info('Stopping playlist', { name: params.name, id: params.id, stopAll: params.stopAll });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.stopPlaylist', {
        name: params.name,
        id: params.id,
        stopAll: params.stopAll,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to stop playlist', error);
      throw new Error(
        `Failed to stop playlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async handleGetSceneScreenshot(args: any): Promise<any> {
    const schema = z.object({
      scale: z.number().min(0.1).max(1.0).default(0.33),
      quality: z.number().min(0.1).max(1.0).default(0.75),
    });

    const { scale, quality } = schema.parse(args);

    this.logger.info('Capturing scene screenshot', { scale, quality });

    try {
      const result = await this.foundryClient.query('foundry-mcp-bridge.getSceneScreenshot', { scale, quality });

      if (!result?.imageData) {
        throw new Error('No image data returned from Foundry');
      }

      // Strip the data URL prefix if present, keep only base64
      const base64 = result.imageData.replace(/^data:image\/\w+;base64,/, '');

      return {
        _imageContent: {
          type: 'image',
          data: base64,
          mimeType: 'image/jpeg',
        },
        sceneName: result.sceneName,
        dimensions: result.dimensions,
        capturedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to capture scene screenshot', error);
      throw new Error(
        `Failed to capture scene screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private formatSceneResponse(sceneData: any, includeTokens: boolean, includeHidden: boolean): any {
    const response: any = {
      id: sceneData.id,
      name: sceneData.name,
      active: sceneData.active,
      dimensions: {
        width: sceneData.width,
        height: sceneData.height,
        padding: sceneData.padding,
      },
      hasBackground: !!sceneData.background,
      navigation: sceneData.navigation,
      elements: {
        walls: sceneData.walls || 0,
        lights: sceneData.lights || 0,
        sounds: sceneData.sounds || 0,
        notes: sceneData.notes?.length || 0,
      },
    };

    if (includeTokens && sceneData.tokens) {
      response.tokens = this.formatTokens(sceneData.tokens, includeHidden);
      response.tokenSummary = this.createTokenSummary(sceneData.tokens, includeHidden);
    }

    if (sceneData.notes && sceneData.notes.length > 0) {
      response.notes = sceneData.notes.map((note: any) => ({
        id: note.id,
        text: this.truncateText(note.text, 100),
        position: { x: note.x, y: note.y },
      }));
    }

    return response;
  }

  private formatTokens(tokens: any[], includeHidden: boolean): any[] {
    return tokens
      .filter(token => includeHidden || !token.hidden)
      .map(token => ({
        id: token.id,
        name: token.name,
        position: {
          x: token.x,
          y: token.y,
        },
        size: {
          width: token.width,
          height: token.height,
        },
        actorId: token.actorId,
        disposition: this.getDispositionName(token.disposition),
        hidden: token.hidden,
        hasImage: !!token.img,
      }));
  }

  private createTokenSummary(tokens: any[], includeHidden: boolean): any {
    const visibleTokens = includeHidden ? tokens : tokens.filter(t => !t.hidden);
    
    const summary = {
      total: visibleTokens.length,
      byDisposition: {
        friendly: 0,
        neutral: 0,
        hostile: 0,
        unknown: 0,
      },
      hasActors: 0,
      withoutActors: 0,
    };

    visibleTokens.forEach(token => {
      // Count by disposition
      const disposition = this.getDispositionName(token.disposition);
      if (disposition in summary.byDisposition) {
        summary.byDisposition[disposition as keyof typeof summary.byDisposition]++;
      } else {
        summary.byDisposition.unknown++;
      }

      // Count actor association
      if (token.actorId) {
        summary.hasActors++;
      } else {
        summary.withoutActors++;
      }
    });

    return summary;
  }

  private formatWorldResponse(worldData: any): any {
    return {
      id: worldData.id,
      title: worldData.title,
      system: {
        id: worldData.system,
        version: worldData.systemVersion,
      },
      foundry: {
        version: worldData.foundryVersion,
      },
      users: {
        total: worldData.users?.length || 0,
        active: worldData.users?.filter((u: any) => u.active).length || 0,
        gms: worldData.users?.filter((u: any) => u.isGM).length || 0,
        players: worldData.users?.filter((u: any) => !u.isGM).length || 0,
      },
      activeUsers: worldData.users
        ?.filter((u: any) => u.active)
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          isGM: u.isGM,
        })) || [],
    };
  }

  private getDispositionName(disposition: number): string {
    switch (disposition) {
      case -1:
        return 'hostile';
      case 0:
        return 'neutral';
      case 1:
        return 'friendly';
      default:
        return 'unknown';
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}