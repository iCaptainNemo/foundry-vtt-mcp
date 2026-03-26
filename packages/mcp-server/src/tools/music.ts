import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MUSIC_INDEX_PATH = path.join(__dirname, 'music-index.json');

export interface MusicTrack {
  name: string;
  playlist: string;
  playlistId: string;
  type: 'music' | 'ambience';
  tags: string[];
  description: string;
}

export interface MusicIndex {
  version: string;
  /** Sorted array of "id:name" strings used for change detection */
  fingerprint: string[];
  lastSynced: string;
  tracks: Record<string, MusicTrack>;
}

const SEED_TRACKS: Record<string, MusicTrack> = {
  // ── MG Music (scored tracks) ──────────────────────────────────────────────
  'Are4NVZhzYYrk8O0': {
    name: 'Beyond the Frost Barrier', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['travel', 'wilderness', 'cold', 'exploration', 'atmospheric'],
    description: 'Cold wilderness travel, frost regions',
  },
  'XlBWVyUZyfUoPCro': {
    name: 'Crimson Archers', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['combat', 'battle', 'tension', 'action'],
    description: 'Combat encounter, skirmish',
  },
  '5nfA7mTCx4yEdSah': {
    name: 'Crimson Crow Brimstone Circle', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['dark', 'ritual', 'villain', 'sinister', 'evil'],
    description: 'Dark ritual, villain scene, cult meeting',
  },
  'nfR5XrBSupzf8kzg': {
    name: "Demetrian's Theme", playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['npc', 'emotional', 'character', 'personal', 'dramatic'],
    description: 'NPC personal theme, emotional story moment',
  },
  'u3oRokeso5pSe20s': {
    name: 'Evergreen Everlasting', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['peaceful', 'nature', 'exploration', 'calm', 'serene'],
    description: 'Peaceful nature exploration, calm moment',
  },
  'hZbW4Mox9rZz7Y4L': {
    name: 'Hope', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['emotional', 'resolution', 'victory', 'uplifting', 'positive'],
    description: 'Emotional resolution, victory, hopeful moment',
  },
  'cfKNag22yxkhVRDo': {
    name: 'Kingdoms and Conquerors', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['exploration', 'travel', 'grand', 'epic', 'triumphant'],
    description: 'Grand travel montage, epic exploration',
  },
  'prhCHBvVSeCkoSJu': {
    name: "Paladin's Resolve", playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['heroic', 'dramatic', 'resolve', 'boss', 'climax'],
    description: 'Heroic stand, pre-boss tension, dramatic resolve',
  },
  '6zsf8ZJ1ExO5z8Jv': {
    name: 'Roofs of Lavender', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['town', 'village', 'peaceful', 'daytime', 'calm'],
    description: 'Peaceful town or village scene',
  },
  'zn9AeNRknR2cGfmd': {
    name: 'Taverns of Glaenarm', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['tavern', 'social', 'inn', 'festive', 'relaxed'],
    description: 'Tavern or inn, social gathering, downtime',
  },
  'AI8ogeYUVAYZqt1y': {
    name: 'The Alliance Reforged', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['alliance', 'triumph', 'dramatic', 'meeting', 'political'],
    description: 'Alliance or treaty moment, political triumph',
  },
  'uRfRs3OwatsloFZO': {
    name: 'The Eldritch Creature', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['horror', 'monster', 'creepy', 'tense', 'supernatural'],
    description: 'Monster reveal, eldritch horror, supernatural dread',
  },
  'cl1SR431XvTXzhPg': {
    name: 'The Inn', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['tavern', 'inn', 'cozy', 'social', 'relaxed'],
    description: 'Inn or tavern, cozy rest scene',
  },
  'Fry2TUZjtWNhaQrV': {
    name: 'The Northerner', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['cold', 'wilderness', 'norse', 'travel', 'rugged'],
    description: 'Cold northern wilderness, viking or barbarian tone',
  },
  'YA5c7OzTuhbHvgMv': {
    name: 'The Order of Light and Shadow', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['mysterious', 'secret', 'tense', 'supernatural', 'intrigue'],
    description: 'Secret society, mysterious intrigue, shadowy faction',
  },
  '5H34Vm7obeEk7ZRv': {
    name: 'The Valkyries', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['epic', 'combat', 'climax', 'legendary', 'intense'],
    description: 'Epic climactic battle, legendary encounter',
  },
  'LyhF9uATHRb4DrBK': {
    name: 'War Machine', playlist: 'MG Music', playlistId: 'jP4ebTgT8O6WvTv7', type: 'music',
    tags: ['combat', 'intense', 'battle', 'aggressive', 'urgent'],
    description: 'Intense combat, aggressive fight, urgent danger',
  },

  // ── Michael Ghelfi Ambience ───────────────────────────────────────────────
  'U6Rdm0vwhzGl3aDp': {
    name: 'Jungle', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['jungle', 'outdoor', 'nature', 'wilderness', 'tropical'],
    description: 'Jungle ambience',
  },
  'vXRWEhX5kiEBN5V1': {
    name: 'Arena Crowd', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['crowd', 'arena', 'combat', 'city', 'spectacle'],
    description: 'Crowd noise for arena or gladiatorial combat',
  },
  'mOcd38zVrOakzcZL': {
    name: 'Campfire in Woods', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['campfire', 'woods', 'rest', 'outdoor', 'cozy', 'night'],
    description: 'Campfire rest scene, woods at night',
  },
  'LwH7bc9gu4LhjFCx': {
    name: 'Caverns of Horror', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['cavern', 'horror', 'dungeon', 'underground', 'scary'],
    description: 'Horror-themed cave or dungeon',
  },
  'nEKpqXj5iI0kvUbC': {
    name: 'City Temple', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['temple', 'city', 'religious', 'urban', 'sacred'],
    description: 'City temple or church interior',
  },
  '1lfXHKVG7XfkzqMY': {
    name: "City's Keep", playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['keep', 'city', 'castle', 'urban', 'fortress', 'guard'],
    description: 'Castle keep or city fortress interior',
  },
  'O4LybxDMO87RHsCG': {
    name: 'Cursed Forest', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['forest', 'cursed', 'dark', 'supernatural', 'eerie'],
    description: 'Cursed or haunted forest',
  },
  'U6LifPt6fqAlEHXV': {
    name: 'Cursed Marsh', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['marsh', 'swamp', 'cursed', 'eerie', 'danger'],
    description: 'Cursed swamp or marsh',
  },
  'fr9pKuv8VNaDPwU4': {
    name: 'Darkest Forest', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['forest', 'dark', 'tense', 'outdoor', 'scary', 'night'],
    description: 'Dark threatening forest, dangerous wilderness',
  },
  'ZcxEIZPurgzd7Hxx': {
    name: 'Daytime Forest', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['forest', 'peaceful', 'outdoor', 'nature', 'calm', 'day'],
    description: 'Peaceful daytime forest',
  },
  '5Xhpj7HglJYWSSW8': {
    name: 'Desert', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['desert', 'outdoor', 'arid', 'travel', 'wilderness'],
    description: 'Desert ambience',
  },
  'wdUwSBAjD3noe00Q': {
    name: 'Dimension Gate (alternative)', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['magical', 'portal', 'mysterious', 'supernatural', 'arcane'],
    description: 'Magical portal or dimensional rift',
  },
  'OKCt4XngEmeM8OoQ': {
    name: 'Dinosaur Caravan (jungle)', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['jungle', 'travel', 'exotic', 'outdoor', 'caravan'],
    description: 'Exotic jungle caravan or expedition',
  },
  '16QPTxcWdSHY0hBH': {
    name: 'Dungeon of the Dead Three', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['dungeon', 'undead', 'dark', 'underground', 'horror'],
    description: 'Dark dungeon, undead or death cult atmosphere',
  },
  'T7XfhD76ug7XjQOP': {
    name: 'Fields of Oreskos (no camp)', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['plains', 'outdoor', 'open', 'travel', 'wilderness'],
    description: 'Open plains or fields',
  },
  'IlfOSXa32AbYX2jx': {
    name: 'Generic Dungeon I', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['dungeon', 'underground', 'exploration', 'tension', 'cave'],
    description: 'Generic dungeon exploration',
  },
  'QDbXgGXWz4QKDVQZ': {
    name: 'Hall of Nightmares', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['horror', 'nightmares', 'tense', 'supernatural', 'dark'],
    description: 'Nightmare hall, horror or dreamscape',
  },
  '9BQto3chEGnEnJlS': {
    name: 'Haunted House Cellar', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['haunted', 'cellar', 'horror', 'tense', 'dark', 'ghost'],
    description: 'Haunted cellar or basement',
  },
  's5zsWrFtZuGdycdc': {
    name: 'Haunted House Outdoor', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['haunted', 'outdoor', 'horror', 'tense', 'eerie', 'ghost'],
    description: 'Exterior of haunted building',
  },
  'srlWldJfgQGKmg7b': {
    name: 'Horseback', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['travel', 'outdoor', 'road', 'movement', 'horse'],
    description: 'Horseback travel or road journey',
  },
  'cIcpIjAhqiOmWc5d': {
    name: 'Medieval City', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['city', 'medieval', 'urban', 'busy', 'daytime', 'market'],
    description: 'Busy medieval city streets',
  },
  'vZxPdTbRh2XgWHfm': {
    name: 'Rain and Thunder', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['weather', 'rain', 'storm', 'outdoor', 'dramatic'],
    description: 'Rain and thunder, stormy weather',
  },
  'xxOzroBoO7iOImOt': {
    name: 'Sailing Ship', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['sailing', 'ocean', 'ship', 'travel', 'sea', 'water'],
    description: 'Ocean sailing voyage',
  },
  '0xsnYVh9LnoTUAuw': {
    name: 'Sewers', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['sewers', 'underground', 'city', 'dark', 'dungeon'],
    description: 'City sewers or underground tunnels',
  },
  'ec6z6olDzqy7WvDC': {
    name: 'Simple Cave', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['cave', 'underground', 'exploration', 'quiet', 'natural'],
    description: 'Simple natural cave',
  },
  'kafzAsnXGMlv6W0z': {
    name: 'Slave Miners Desert', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['desert', 'dark', 'grim', 'labor', 'outdoor', 'oppressive'],
    description: 'Grim desert labor scene, oppressive outdoor setting',
  },
  'OeaUijfZQUzpCrzI': {
    name: 'Snowing', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['winter', 'cold', 'outdoor', 'peaceful', 'quiet', 'snow'],
    description: 'Snowing, quiet winter outdoor',
  },
  'Aep90ElzuA9j01bS': {
    name: 'Swamps', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['swamp', 'marsh', 'outdoor', 'eerie', 'nature', 'wet'],
    description: 'Swamp or bog',
  },
  'FSlcWYKxpQqmewj8': {
    name: 'Twilight Forest', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['forest', 'twilight', 'atmospheric', 'outdoor', 'dusk', 'mysterious'],
    description: 'Forest at twilight or dusk',
  },
  '08cg8qURK5lT9qyn': {
    name: 'Village Marketplace', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['village', 'market', 'social', 'busy', 'daytime', 'town'],
    description: 'Village or town marketplace',
  },
  '9hpVL1kmlsBGIvXl': {
    name: 'Wild West Tradepost', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['tradepost', 'social', 'frontier', 'busy', 'indoor', 'merchant'],
    description: 'Frontier trade post or merchant hall',
  },
  'zhCEzVaHeF4QjApH': {
    name: 'Wolf Forest (stream)', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['forest', 'stream', 'outdoor', 'nature', 'atmospheric', 'water'],
    description: 'Forest with stream sounds, natural ambience',
  },
  'GssKrkhZzk5B9bNR': {
    name: "World's End (with monsters)", playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['combat', 'epic', 'monsters', 'horror', 'intense', 'apocalyptic'],
    description: 'Apocalyptic monster-filled battlefield',
  },
  'Dc0nhHKUhuJGM4Z1': {
    name: 'Caverns of Trials', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['dungeon', 'underground', 'challenge', 'tension', 'trial'],
    description: 'Trial dungeon or challenge cavern',
  },
  '17F7FzG8fS2pD4l6': {
    name: 'Craftsmen Guild', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['guild', 'urban', 'crafting', 'social', 'indoor', 'workshop'],
    description: 'Craftsmen guild hall or workshop',
  },
  'wydrJlwNT9s4IjsZ': {
    name: 'Inside the AI', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['mechanical', 'futuristic', 'strange', 'alien', 'supernatural'],
    description: 'Strange mechanical or otherworldly ambience',
  },
  '8YrYzMa1Lwwh88yM': {
    name: "Precursors' Hall", playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['ancient', 'hall', 'mysterious', 'exploration', 'grand', 'ruins'],
    description: 'Ancient grand hall or ruins',
  },
  'DFiqYxr4uktocrqy': {
    name: 'Sci Fi Ground Battle', playlist: 'Michael Ghelfi Ambience', playlistId: '8DCxsUNOWxQOwE0V', type: 'ambience',
    tags: ['battle', 'combat', 'intense', 'chaotic', 'war'],
    description: 'Large-scale ground battle, war zone',
  },
};

function buildFingerprint(tracks: Array<{ id: string; name: string }>): string[] {
  return tracks
    .map(t => `${t.id}:${t.name}`)
    .sort();
}

function loadIndex(): MusicIndex {
  if (fs.existsSync(MUSIC_INDEX_PATH)) {
    try {
      const raw = fs.readFileSync(MUSIC_INDEX_PATH, 'utf-8');
      return JSON.parse(raw) as MusicIndex;
    } catch {
      // Fall through to seed
    }
  }
  return {
    version: '1.0.0',
    fingerprint: [],
    lastSynced: '',
    tracks: SEED_TRACKS,
  };
}

function saveIndex(index: MusicIndex): void {
  fs.writeFileSync(MUSIC_INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
}

/** Infer basic tags from a track name when a new track is discovered via sync */
function inferTagsFromName(name: string): string[] {
  const lower = name.toLowerCase();
  const tags: string[] = [];
  if (/tavern|inn/.test(lower)) tags.push('tavern', 'social');
  if (/battle|combat|war|fight|archer/.test(lower)) tags.push('combat', 'battle');
  if (/forest|woods|wood/.test(lower)) tags.push('forest', 'outdoor');
  if (/dungeon|cavern|cave|underground/.test(lower)) tags.push('dungeon', 'underground');
  if (/horror|haunted|nightmare|cursed/.test(lower)) tags.push('horror', 'dark');
  if (/city|town|village|market/.test(lower)) tags.push('urban', 'social');
  if (/desert|sand/.test(lower)) tags.push('desert', 'outdoor');
  if (/jungle|tropical/.test(lower)) tags.push('jungle', 'outdoor');
  if (/ship|sail|ocean|sea/.test(lower)) tags.push('sailing', 'sea');
  if (/snow|winter|frost|cold/.test(lower)) tags.push('cold', 'outdoor');
  if (/swamp|marsh/.test(lower)) tags.push('swamp', 'outdoor');
  if (/travel|road|journey/.test(lower)) tags.push('travel', 'outdoor');
  if (/temple|church|shrine/.test(lower)) tags.push('temple', 'religious');
  if (/epic|legend|valkyrie/.test(lower)) tags.push('epic', 'dramatic');
  if (tags.length === 0) tags.push('general');
  return tags;
}

export interface MusicToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class MusicTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: MusicToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'MusicTools' });
  }

  getToolDefinitions() {
    return [
      {
        name: 'suggest-music',
        description:
          'Query the local music index to find tracks matching a mood or scene context. ' +
          'Returns compact results without calling Foundry. Use play-playlist with the returned playlistId and trackId to play a track.',
        inputSchema: {
          type: 'object',
          properties: {
            context: {
              type: 'string',
              description: 'Scene or mood description, e.g. "tense combat", "cozy tavern", "dark forest exploration"',
            },
            type: {
              type: 'string',
              enum: ['music', 'ambience', 'both'],
              description: 'Filter by track type (default: both)',
            },
            limit: {
              type: 'number',
              description: 'Maximum results to return (default: 5)',
            },
          },
          required: ['context'],
        },
      },
      {
        name: 'sync-music-index',
        description:
          'Sync the local music index against live Foundry playlists. ' +
          'Detects added or removed tracks using fingerprint comparison. ' +
          'New tracks get auto-inferred tags from their names. You should fill in their descriptions after.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async handleSuggestMusic(args: any): Promise<any> {
    const schema = z.object({
      context: z.string(),
      type: z.enum(['music', 'ambience', 'both']).optional().default('both'),
      limit: z.number().int().min(1).max(20).optional().default(5),
    });

    const params = schema.parse(args);
    this.logger.info('Suggesting music', { context: params.context, type: params.type });

    const index = loadIndex();
    const tokens = params.context.toLowerCase().split(/\W+/).filter(Boolean);

    type ScoredTrack = { id: string; score: number } & MusicTrack;

    const scored: ScoredTrack[] = Object.entries(index.tracks)
      .filter(([, track]) => params.type === 'both' || track.type === params.type)
      .map(([id, track]) => {
        const haystack = [
          ...track.tags,
          ...track.description.toLowerCase().split(/\W+/),
          track.name.toLowerCase(),
        ];
        const score = tokens.reduce((acc, token) => {
          return acc + haystack.filter(h => h.includes(token)).length;
        }, 0);
        return { id, score, ...track };
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, params.limit);

    if (scored.length === 0) {
      return {
        success: true,
        context: params.context,
        results: [],
        message: 'No matching tracks found. Try different keywords or run sync-music-index if you have new tracks.',
      };
    }

    return {
      success: true,
      context: params.context,
      results: scored.map(t => ({
        id: t.id,
        playlistId: t.playlistId,
        name: t.name,
        playlist: t.playlist,
        type: t.type,
        tags: t.tags,
        description: t.description,
        score: t.score,
      })),
    };
  }

  async handleSyncMusicIndex(_args: any): Promise<any> {
    this.logger.info('Syncing music index against Foundry playlists');

    const liveData = await this.foundryClient.query('foundry-mcp-bridge.listPlaylists');

    if (!liveData?.success || !Array.isArray(liveData.playlists)) {
      throw new Error('Failed to fetch playlists from Foundry');
    }

    // Flatten all tracks from all playlists
    type LiveTrack = { id: string; name: string; playlist: string; playlistId: string };
    const liveTracks: LiveTrack[] = [];
    for (const pl of liveData.playlists) {
      for (const track of pl.tracks ?? []) {
        liveTracks.push({ id: track.id, name: track.name, playlist: pl.name, playlistId: pl.id });
      }
    }

    const liveFingerprint = buildFingerprint(liveTracks);
    const index = loadIndex();

    const added: string[] = [];
    const removed: string[] = [];

    // Find new tracks
    const existingIds = new Set(Object.keys(index.tracks));
    for (const lt of liveTracks) {
      if (!existingIds.has(lt.id)) {
        const inferredType: 'music' | 'ambience' =
          lt.playlist.toLowerCase().includes('ambience') ? 'ambience' : 'music';
        index.tracks[lt.id] = {
          name: lt.name,
          playlist: lt.playlist,
          playlistId: lt.playlistId,
          type: inferredType,
          tags: inferTagsFromName(lt.name),
          description: '',
        };
        added.push(lt.name);
      }
    }

    // Find removed tracks
    const liveIds = new Set(liveTracks.map(t => t.id));
    for (const id of existingIds) {
      if (!liveIds.has(id)) {
        removed.push(index.tracks[id].name);
        delete index.tracks[id];
      }
    }

    index.fingerprint = liveFingerprint;
    index.lastSynced = new Date().toISOString();
    saveIndex(index);

    const unchanged = added.length === 0 && removed.length === 0;
    return {
      success: true,
      status: unchanged ? 'up-to-date' : 'updated',
      totalTracks: Object.keys(index.tracks).length,
      added: added.length > 0 ? added : undefined,
      removed: removed.length > 0 ? removed : undefined,
      message: unchanged
        ? `Index is up to date (${Object.keys(index.tracks).length} tracks).`
        : `Added ${added.length} track(s), removed ${removed.length} track(s). Fill in descriptions for new tracks.`,
    };
  }
}
