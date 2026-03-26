# Foundry MCP — Mike's Setup

## Git & GitHub

- **Fork**: https://github.com/iCaptainNemo/foundry-vtt-mcp (Mike's fork — this is `origin`)
- **Upstream**: https://github.com/adambdooley/foundry-vtt-mcp (`upstream` remote, for syncing)
- **Commit footer**: Always include only this co-author line — no Happy credits:
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

## Infrastructure

- **Foundry VTT**: `https://dnd.webinge.games` → OVH Docker (Pterodactyl, container `88cfb31f`)
- **MCP Backend**: Runs on Windows desktop (`100.80.179.51` Tailscale IP)
- **nginx on OVH**: Proxies `wss://dnd.webinge.games/foundry-mcp` → `ws://100.80.179.51:31415`
- **Foundry module**: `foundry-mcp-bridge` installed at `/var/lib/pterodactyl/volumes/88cfb31f-c77f-4388-bb85-8667ce6046c7/data/Data/modules/foundry-mcp-bridge/`
- **MCP config**: `.mcp.json` in this directory wires Claude Code to the backend

## Starting the MCP Backend

**At the start of every conversation, check if the backend is running. If not, start it.**

```bash
# Check if running:
netstat -an | grep 31415
# Should show: 0.0.0.0:31415  LISTENING
# If nothing shows, start it:
node packages/mcp-server/dist/backend.js
```

Ports used:
- `31415` — WebSocket server (Foundry module connects here via nginx proxy)
- `31416` — WebRTC signaling (fallback, not currently used)
- `31414` — Internal control socket (Claude Code index.js ↔ backend)

## Rebuilding After Changes

```bash
# Rebuild MCP server (backend tools)
npm run build:server

# Rebuild Foundry module (browser-side JS)
npm run build:foundry

# Deploy updated Foundry module to OVH
scp -r packages/foundry-module/dist/. ovh:/tmp/foundry-mcp-dist/
ssh ovh "sudo cp -r /tmp/foundry-mcp-dist/. /var/lib/pterodactyl/volumes/88cfb31f-c77f-4388-bb85-8667ce6046c7/data/Data/modules/foundry-mcp-bridge/dist/"
# Then hard reload Foundry (Ctrl+Shift+R)
```

## Customizations vs Upstream

- `packages/foundry-module/src/socket-bridge.ts`: Uses `wss://` when page is HTTPS (omits port, routes through nginx)
- `packages/foundry-module/src/settings.ts`: Default connection type changed to `websocket`
- `.mcp.json`: Claude Code MCP server config pointing to local backend

## DM Playstyle

- **Theater of the mind for terrain**: Players declare their actions ("I climb up the shaft", "I duck behind the barrel") and Claude narrates from there. Players describe positioning; Claude adjudicates and narrates. Don't block on visual terrain info you can't see.
- **Private channel**: Mike can message Claude directly in Claude Code chat, or via `/w Gamemaster [message]` whisper in Foundry chat. Claude sees all whispers server-side.
- **Immersion first**: Mike hangs back on DM intervention unless needed. Let the session breathe.

## ComfyUI (Map Generation)

ComfyUI needs to be running locally on the desktop for AI map generation. Backend expects it at `127.0.0.1:8188`. The "stopped" warning in Foundry is harmless when ComfyUI isn't running — all other tools still work.

---

# DSA5 MCP Foundry Fork

## Projekt-Übersicht

Fork von `foundry-vtt-mcp` mit DSA5 (Das Schwarze Auge 5) Support.

**Repository:** https://github.com/frankyh75/foundry-vtt-mcp-dsa
**Upstream:** https://github.com/adambdooley/foundry-vtt-mcp

## Architektur-Prinzip

> **“Adapter, nicht Integration”**

DSA5-Support wird als externe Adapter-Schicht gebaut, NICHT durch Änderungen am Core.

- `data-access.ts` bleibt möglichst nah an Upstream
- DSA5-Logik lebt isoliert in `src/tools/dsa5/`
- Ziel: Merge-Konflikt-freie Coexistenz mit Upstream

## Aktuelle Phase

**Phase 2: DSA5 Adapter Layer aufbauen**

- [x] Phase 1: Git-Cleanup, data-access.ts auf Upstream-Stand
- [ ] Phase 2: DSA5 Import/Export Module erstellen
- [ ] Phase 3: Integration in characters.ts
- [ ] Phase 4: Später - character.ts DSA5-fähig machen

### Aktueller Schritt

Schritt 4: Dateien erstellen in `src/tools/dsa5/`

## Dateistruktur

```
src/
├── data-access.ts          # NICHT ÄNDERN - Upstream-kompatibel halten!
├── tools/
│   ├── characters.ts       # System-Router, minimale DSA5-Integration hier
│   ├── character.ts        # SPÄTER - erst nach stabilem Import/Export
│   └── dsa5/               # <<< DSA5 Adapter Layer
│       ├── types.ts        # MCPCharacter, MCPCharacterUpdate, Dsa5Actor
│       ├── character-import.ts   # fromDsa5Actor(), getDsa5CharacterSummary()
│       ├── character-export.ts   # applyMcpUpdateToDsa5Actor()
│       ├── field-mappings.ts     # Mapping-Konfiguration (optional)
│       └── index.ts              # Public API exports
```

## DSA5 Feld-Mappings (KRITISCH)

### Eigenschaften (8 Attribute)

```
system.characteristics.mu.value  → MU (Mut/Courage)
system.characteristics.kl.value  → KL (Klugheit/Cleverness)
system.characteristics.in.value  → IN (Intuition)
system.characteristics.ch.value  → CH (Charisma)
system.characteristics.ff.value  → FF (Fingerfertigkeit/Dexterity)
system.characteristics.ge.value  → GE (Gewandtheit/Agility)
system.characteristics.ko.value  → KO (Konstitution/Constitution)
system.characteristics.kk.value  → KK (Körperkraft/Strength)
```

### Lebenspunkte (ACHTUNG: Invertierte Logik!)

```
system.status.wounds.value  → Aktuelle WUNDEN (nicht HP!)
system.status.wounds.max    → Maximale Lebensenergie

Umrechnung:
  Aktuelle HP = wounds.max - wounds.value
  Neue Wunden = wounds.max - neue_HP
```

### Ressourcen

```
system.status.astralenergy.value/max  → AsP (Astralenergie/Mana)
system.status.karmaenergy.value/max   → KaP (Karmaenergie)
```

### Profil

```
system.details.species.value   → Spezies (Mensch, Elf, Zwerg...)
system.details.culture.value   → Kultur
system.details.career.value    → Profession
system.details.experience.total → Abenteuerpunkte gesamt
```

### Physisch

```
system.status.size.value  → Größe in cm
```

### Skills/Talente

```
Items mit type: "skill" oder "talent"
Wert: item.system.talentValue.value
Probe: item.system.characteristic (z.B. "MU/IN/CH" für 3-Eigenschaften-Probe)
```

## Wichtige Interfaces

### MCPCharacter (System-agnostisch)

```typescript
interface MCPCharacter {
  id: string;
  name: string;
  system: 'dsa5' | 'dnd5e' | 'pf2e';
  attributes: Record<string, number>;
  health: { current: number; max: number; temp?: number };
  resources?: Array<{ name: string; current: number; max: number; type: string }>;
  skills: Array<{ id: string; name: string; value: number; metadata?: any }>;
  profile: { species?: string; culture?: string; profession?: string; experience?: number };
  physical?: { size?: number };
  systemData?: { dsa5?: { /* DSA5-spezifisches */ } };
}
```

### MCPCharacterUpdate (Für Änderungen)

```typescript
interface MCPCharacterUpdate {
  id: string;
  attributes?: Partial<Record<string, number>>;
  health?: { current?: number; max?: number; delta?: number };
  resources?: Array<{ name: string; current?: number; delta?: number }>;
  skills?: Array<{ id: string; value?: number; delta?: number }>;
}
```

## Befehle

```bash
# Build
npm run build

# Lint
npm run lint

# TypeScript Check ohne Build
npx tsc --noEmit

# Symlink für Foundry-Testing (bereits eingerichtet)
# ~/.local/share/FoundryVTT/Data/modules/foundry-mcp -> ./dist
```

## Git-Workflow

### Branches

- `main` - Upstream-kompatibel, DSA5 via Adapter
- `archive/dsa5-monolith-integration` - Alte DSA5-in-Core Arbeit (Archiv)

### Commits

```
feat(dsa5): add type definitions for adapter layer
feat(dsa5): implement character import from Foundry actor
fix(dsa5): correct wound/HP inversion logic
refactor: align data-access.ts with upstream
```

### Upstream Sync

```bash
# Remote hinzufügen (einmalig)
git remote add upstream https://github.com/adambdooley/foundry-vtt-mcp.git

# Sync
git fetch upstream
git merge upstream/main  # Sollte konfliktfrei sein!
```

## Einschränkungen / Don’ts

❌ **NICHT `data-access.ts` ändern** - außer für generische Bugfixes
❌ **NICHT `character.ts` anfassen** - kommt in Phase 4
❌ **KEINE DSA5-Logik außerhalb von `src/tools/dsa5/`**
❌ **KEINE Breaking Changes für DnD5e/PF2e**

## Kontext für AI-Assistenz

Dieses Projekt ist Teil einer “Story Engine, not Rules Engine” Vision:

- KI-unterstützte Spielleiter-Tools für Narrative
- NPC-Erstellung, Weltenbau, Story-Generierung
- NICHT: Regelautomatisierung oder Würfelersatz

DSA5 ist ein deutsches Pen&Paper-RPG mit komplexem Regelwerk.
Die MCP-Integration soll Claude Zugriff auf Foundry-VTT-Daten geben.

## Nächste Schritte

1. [ ] **Git-Sicherung:** Branch `archive/dsa5-monolith-integration` erstellen vom aktuellen Stand
1. [ ] **Upstream Remote** hinzufügen falls noch nicht vorhanden
1. [ ] **Diff analysieren:** `data-access.ts` gegen Upstream vergleichen, DSA5-Teile dokumentieren
1. [ ] `data-access.ts` auf Upstream-Stand zurücksetzen (in neuem Feature-Branch)
1. [ ] `src/tools/dsa5/types.ts` erstellen
1. [ ] `src/tools/dsa5/character-import.ts` implementieren
1. [ ] `src/tools/dsa5/character-export.ts` implementieren
1. [ ] `src/tools/dsa5/index.ts` als Public API
1. [ ] Integration in `characters.ts` (minimal)
1. [ ] End-to-End Test mit echtem DSA5-Actor
