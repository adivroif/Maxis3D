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
function detectMapType(filename: string): keyof Omit<TextureSet, 'id' | 'targets'> | null {
  const cleanName = getFilenameFromUrl(filename);
  if (!cleanName || cleanName.endsWith('/')) return null;

  const base = cleanName.replace(/\.[^.]+$/, '');
  
  const parts = base.split(/[_.-]/);
  for (let i = parts.length - 1; i >= 0; i--) {
    const key = parts[i].toLowerCase();
    if (MAP_TYPE_MAP[key]) return MAP_TYPE_MAP[key];
  }
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

  const parts = base.split(/[_.-]/).map(p => p.trim()).filter(p => p !== '');
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
      console.warn(`[parseTextureSets] ⚠️ Duplicate "${mapField}" for target "${target}": keeping "${(group as any)[mapField]}", ignoring "${url}"`);
    } else {
      (group as any)[mapField] = url;
    }
  }

  // Convert to TextureSet[]
  const result: TextureSet[] = [];
  let idx = 0;
  for (const [target, maps] of groups.entries()) {
    const patterns = wildcardFallback
      ? [target, `*${target}*`]
      : [target];

    result.push({
      id: `auto_${idx++}_${target}`,
      targets: patterns,
      ...maps,
    });
  }

  console.log(
    '[parseTextureSets] ✅ Final groups:\n' +
    [...groups.entries()]
      .map(([k, v]) => `  "${k}" → [${Object.keys(v).join(', ')}]`)
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