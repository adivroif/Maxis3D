import { TextureSet } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Recognised map-type keywords → TextureSet field
// ─────────────────────────────────────────────────────────────────────────────
const MAP_TYPE_MAP: Record<string, keyof Omit<TextureSet, 'id' | 'targets'>> = {
  basecolor:  'baseColor',
  albedo:     'baseColor',
  diffuse:    'baseColor',
  color:      'baseColor',
  bc:         'baseColor',
  d:          'baseColor',
  alb:        'baseColor',
  col:        'baseColor',
  normal:     'normal',
  nrm:        'normal',
  nml:        'normal',
  nor:        'normal',
  n:          'normal',
  metalness:  'metalness',
  metallic:   'metalness',
  metal:      'metalness',
  met:        'metalness',
  m:          'metalness',
  roughness:  'roughness',
  rough:      'roughness',
  rog:        'roughness',
  r:          'roughness',
  alpha:      'alpha',
  opacity:    'alpha',
  opac:       'alpha',
  a:          'alpha',
  emissive:   'emissive',
  emission:   'emissive',
  glow:       'emissive',
  e:          'emissive',
  ao:         'ao',
  occlusion:  'ao',
  ambient:    'ao',
  ao_map:     'ao',
  height:     'height',
  displacement: 'height',
  disp:       'height',
  bump:       'height',
  h:          'height',
  specular:   'roughness',
  spec:       'roughness',
  s:          'roughness',
  glos:       'roughness',
  gloss:      'roughness',
  glossiness: 'roughness',
};

/**
 * Extracts a filename from a URL, handling query parameters and decoding URL-encoded characters.
 */
function getFilenameFromUrl(url: string): string {
  try {
    if (url.includes('?')) {
      const parts = url.split('?');
      const params = new URLSearchParams(parts[1]);
      
      // Try common query parameters first
      for (const k of ['fileName', 'filename', 'key', 'file', 'name']) {
        const val = params.get(k);
        if (val) {
          return decodeURIComponent(val).split('/').pop() || '';
        }
      }
      
      // If none of those matches, check if any parameter value looks like a filename with extension
      for (const [, value] of params.entries()) {
        if (/\.(png|jpg|jpeg|tga|dds|webp|exr|hdr)$/i.test(value)) {
          return decodeURIComponent(value).split('/').pop() || '';
        }
      }
    }
  } catch (e) {}
  
  const base = url.split('/').pop() || '';
  return decodeURIComponent(base.split('?')[0]);
}

/**
 * Given a filename (with or without path), returns the detected map type key
 * or null if it cannot be identified.
 */
function detectMapType(
  filename: string
): keyof Omit<TextureSet, 'id' | 'targets'> | null {

  const cleanName = getFilenameFromUrl(filename);
  if (!cleanName || cleanName.endsWith('/')) return null;

  const base = cleanName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/\s+/g, '');

  if (base.includes('basecolor')) return 'baseColor';
  if (base.includes('albedo')) return 'baseColor';
  if (base.includes('diffuse')) return 'baseColor';

  if (base.includes('normal')) return 'normal';

  if (base.includes('metalness')) return 'metalness';
  if (base.includes('metallic')) return 'metalness';

  if (base.includes('roughness')) return 'roughness';

  if (base.includes('opacity')) return 'alpha';
  if (base.includes('alpha')) return 'alpha';

  if (base.includes('emissive')) return 'emissive';

  if (base.includes('ao')) return 'ao';

  if (base.includes('height')) return 'height';

  return null;
}

/**
 * Derive a material/mesh target name from a filename, ignoring any digits/numbers.
 */
function deriveTarget(filename: string, prefix = ''): string {
  let base = getFilenameFromUrl(filename);

  // Remove extension(s) and any numeric suffix patterns like .1002.png
  base = base.replace(/(\.\d+)?\.[^.]+$/, '');
  
  // Strip all digits 0-9 completely from the filename base
  base = base.replace(/\d+/g, '');

  if (prefix) {
    const cleanPrefix = prefix.replace(/\d+/g, '');
    const re = new RegExp(`^${cleanPrefix}_?`, 'i');
    base = base.replace(re, '');
  }

  // Normalize common word spelling typos
  base = base.toLowerCase()
    .replace(/handel/g, 'handle')
    .replace(/middel/g, 'middle');

  // Normalize common multi-word map types to single-word keywords before splitting
  base = base
    .replace(/\bbase\s+color\b/g, 'basecolor')
    .replace(/\bbase_color\b/g, 'basecolor')
    .replace(/\bbase-color\b/g, 'basecolor')
    .replace(/\bdiffuse\s+color\b/g, 'basecolor')
    .replace(/\bdiffuse_color\b/g, 'basecolor')
    .replace(/\bdiffuse-color\b/g, 'basecolor')
    .replace(/\bnormal\s+map\b/g, 'normal')
    .replace(/\bnormal_map\b/g, 'normal')
    .replace(/\bnormal-map\b/g, 'normal')
    .replace(/\broughness\s+map\b/g, 'roughness')
    .replace(/\broughness_map\b/g, 'roughness')
    .replace(/\broughness-map\b/g, 'roughness')
    .replace(/\bmetalness\s+map\b/g, 'metalness')
    .replace(/\bmetalness_map\b/g, 'metalness')
    .replace(/\bmetalness-map\b/g, 'metalness')
    .replace(/\bambient\s+occlusion\b/g, 'ao')
    .replace(/\bambient_occlusion\b/g, 'ao')
    .replace(/\bambient-occlusion\b/g, 'ao')
    .replace(/\bao\s+map\b/g, 'ao')
    .replace(/\bao_map\b/g, 'ao')
    .replace(/\bao-map\b/g, 'ao')
    .replace(/\bheight\s+map\b/g, 'height')
    .replace(/\bheight_map\b/g, 'height')
    .replace(/\bheight-map\b/g, 'height')
    .replace(/\bdisplacement\s+map\b/g, 'height')
    .replace(/\bdisplacement_map\b/g, 'height')
    .replace(/\bdisplacement-map\b/g, 'height')
    .replace(/\bopacity\s+map\b/g, 'opacity')
    .replace(/\bopacity_map\b/g, 'opacity')
    .replace(/\bopacity-map\b/g, 'opacity')
    .replace(/\balpha\s+map\b/g, 'alpha')
    .replace(/\balpha_map\b/g, 'alpha')
    .replace(/\balpha-map\b/g, 'alpha');

  const parts = base.split(/[\s_.-]+/).map(p => p.trim()).filter(p => p !== '');
  for (let i = parts.length - 1; i >= 0; i--) {
    if (MAP_TYPE_MAP[parts[i].toLowerCase()]) {
      parts.splice(i, 1);
      break; 
    }
  }

  // Join back and clean up multiple underscores or trailing/leading underscores
  let result = parts.join('_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!result && prefix) {
    result = prefix.toLowerCase()
      .replace(/handel/g, 'handle')
      .replace(/middel/g, 'middle')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  return result;
}


/**
 * Normalizes a target token for matching against FBX mesh/material names.
 * Examples: eyes1 -> eyes, heads -> head, Shadow Eyes -> shadow_eyes.
 */
function normalizeTargetToken(token: string): string {
  let value = token
    .toLowerCase()
    .trim()
    .replace(/\d+$/g, '')
    .replace(/handel/g, 'handle')
    .replace(/middel/g, 'middle')
    .replace(/colour/g, 'color');

  // Conservative singularization for common part names.
  if (value === 'eyes') value = 'eye';
  else if (value === 'heads') value = 'head';
  else if (value === 'hands') value = 'hand';
  else if (value === 'feet') value = 'foot';
  else if (value === 'shoes') value = 'shoe';

  return value;
}

function getTargetTokens(target: string): string[] {
  return target
    .split(/[_\s.-]+/)
    .map(normalizeTargetToken)
    .filter(Boolean);
}

/**
 * Builds useful aliases for nested texture names.
 * "shadow_eyes" produces: shadow_eyes, eyes, eye.
 * "shadow_head" produces: shadow_head, head.
 */
function buildTargetPatterns(target: string, wildcardFallback: boolean): string[] {
  const tokens = getTargetTokens(target);
  const aliases = new Set<string>();

  const add = (value: string) => {
    const clean = value.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    if (!clean) return;
    aliases.add(clean);
    if (wildcardFallback) aliases.add(`*${clean}*`);
  };

  add(target.toLowerCase());

  // Every suffix can identify a more specific mesh/material. This is what maps
  // "Shadow Eyes BaseColor" to material "eyes1", and similarly Head/Shoes/etc.
  for (let i = 1; i < tokens.length; i++) {
    add(tokens.slice(i).join('_'));
  }

  const last = tokens[tokens.length - 1];
  if (last) {
    add(last);
    if (last === 'eye') add('eyes');
  }

  return [...aliases];
}

/**
 * Inherit missing PBR maps from a parent target group.
 * Example: shadow_eyes has its own BaseColor but inherits Shadow Normal,
 * Metalness, Roughness and Opacity from the parent "shadow" group.
 */
function inheritParentMaps(
  groups: Map<string, Omit<TextureSet, 'id' | 'targets'>>
): Map<string, Omit<TextureSet, 'id' | 'targets'>> {
  const result = new Map<string, Omit<TextureSet, 'id' | 'targets'>>();
  const entries = [...groups.entries()];

  for (const [target, maps] of entries) {
    const tokens = getTargetTokens(target);
    let merged = { ...maps };

    // Prefer the longest existing parent: a_b_c -> a_b -> a.
    for (let cut = tokens.length - 1; cut >= 1; cut--) {
      const parentKey = tokens.slice(0, cut).join('_');
      const parentEntry = entries.find(([key]) =>
        getTargetTokens(key).join('_') === parentKey
      );

      if (parentEntry) {
        const parentMaps = parentEntry[1];
        merged = {
          ...parentMaps,
          ...merged,
        };
        break;
      }
    }

    result.set(target, merged);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseOptions {
  /**
   * Common filename prefix to strip when deriving the target name.
   * E.g. "Axe" for files like "Axe_lower_texture_Roughness.1011.png"
   */
  prefix?: string;

  /**
   * Base URL / folder path prepended to every filename.
   * E.g. "/textures/axe/"
   */
  baseUrl?: string;

  /**
   * When true, the derived target is also tried as a wildcard substring
   * match by appending '*' patterns.  Default: true.
   */
  wildcardFallback?: boolean;
}

/**
 * Parses an array of texture filenames (or full URLs) and returns a
 * `TextureSet[]` ready to pass to `<FBXModel textureSets={...} />`.
 *
 * Files that share the same derived target name are grouped into one set.
 * Files whose map type cannot be detected are silently skipped.
 *
 * @example
 * const sets = parseTextureSets(
 *   [
 *     'Axe_lower_texture_Roughness.1011.png',
 *     'Axe_lower_texture_Normal.1011.png',
 *     'Axe_lower_texture_Metalness.1011.png',
 *     'Axe_lower_texture_BaseColor.1011.png',
 *     'Axe_pgold_axe_Roughness.1002.png',
 *     // … any number of files
 *   ],
 *   { prefix: 'Axe', baseUrl: '/textures/axe/' }
 * );
 */
export function parseTextureSets(
  filenames: string[],
  options: ParseOptions = {}
): TextureSet[] {
  const { prefix = '', baseUrl = '', wildcardFallback = true } = options;

  // Map: targetName → partial TextureSet
  const groups = new Map<string, Omit<TextureSet, 'id' | 'targets'>>();

  for (const filename of filenames) {
    const mapField = detectMapType(filename);
    const target = deriveTarget(filename, prefix);

    if (!mapField) {
      // Silently ignore folders or invalid maps
      const cleanName = getFilenameFromUrl(filename).toLowerCase();
      if (!cleanName || cleanName.endsWith('/')) continue;
      
      console.warn(`[parseTextureSets] ⚠️ Could not detect map type for: "${filename}" — skipping`);
      continue;
    }

    if (!target) {
      console.warn(`[parseTextureSets] ⚠️ Could not derive target for: "${filename}" — skipping`);
      continue;
    }

    if (!groups.has(target)) groups.set(target, {});
    const group = groups.get(target)!;

    // Full URL
    const url = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/${filename.split('/').pop()}`
      : filename;

    if (group[mapField]) {
      console.warn(`[parseTextureSets] ⚠️ Duplicate "${String(mapField)}" for target "${target}": keeping "${(group as any)[mapField]}", ignoring "${url}"`);
    } else {
      (group as any)[mapField] = url;
    }
  }

  // Let specific groups inherit missing PBR maps from their parent.
  // The group's own maps always win over inherited maps.
  const resolvedGroups = inheritParentMaps(groups);

  // Convert to TextureSet[] with suffix aliases.
  const result: TextureSet[] = [];
  let idx = 0;
  for (const [target, maps] of resolvedGroups.entries()) {
    const patterns = buildTargetPatterns(target, wildcardFallback);

    result.push({
      id: `auto_${idx++}_${target}`,
      targets: patterns,
      ...maps,
    });
  }

  console.log(
    '[parseTextureSets] ✅ Final groups:\n' +
    [...resolvedGroups.entries()]
      .map(([k, v]) =>
        `  "${k}" → [${Object.keys(v).join(', ')}] targets=${JSON.stringify(buildTargetPatterns(k, wildcardFallback))}`
      )
      .join('\n')
  );

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: load from a directory listing returned by your backend/API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Same as `parseTextureSets` but accepts a raw directory listing string
 * (one filename per line, as you'd get from `fs.readdir` or an API endpoint).
 */
export function parseTextureSetsFromListing(
  listing: string,
  options?: ParseOptions
): TextureSet[] {
  const filenames = listing
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && /\.(png|jpg|jpeg|tga|dds|webp|exr|hdr)$/i.test(l));
  return parseTextureSets(filenames, options);
}