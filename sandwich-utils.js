(function () {
  const HASH_PATTERN = /^[0-9a-f]{8}$/i;

  // RFC 4648 base64url alphabet used for the compact encoding.
  const COMPACT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const COMPACT_INDEX = {};

  for (let i = 0; i < COMPACT_CHARS.length; i += 1) {
    COMPACT_INDEX[COMPACT_CHARS[i]] = i;
  }

  function hashString(value) {
    // 32-bit FNV-1a: offset basis 2166136261 and prime 16777619 keep the short bite token well distributed.
    let hash = 2166136261;

    for (const character of value) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  // Encodes bites as a compact bitpacked base64url string prefixed with '~'.
  // Each coordinate is stored as a 7-bit integer (0–100), MSB first.
  // Two coordinates per bite = 14 bits per bite.
  // Bits are grouped into 6-bit sextets encoded as base64url characters.
  // This produces a token ~19 chars long for 8 bites, keeping the full share URL under 70 chars.
  function encodeBites(bites) {
    if (!bites.length) {
      return '';
    }

    const bits = [];

    for (const { x, y } of bites) {
      const xi = Math.min(100, Math.max(0, Math.round(x)));
      const yi = Math.min(100, Math.max(0, Math.round(y)));

      for (let b = 6; b >= 0; b -= 1) {
        bits.push((xi >> b) & 1);
      }

      for (let b = 6; b >= 0; b -= 1) {
        bits.push((yi >> b) & 1);
      }
    }

    // Pad to a multiple of 6 for clean base64url mapping.
    while (bits.length % 6 !== 0) {
      bits.push(0);
    }

    let result = '~';

    for (let i = 0; i < bits.length; i += 6) {
      const idx =
        (bits[i] << 5) | (bits[i + 1] << 4) | (bits[i + 2] << 3) |
        (bits[i + 3] << 2) | (bits[i + 4] << 1) | bits[i + 5];
      result += COMPACT_CHARS[idx];
    }

    return result;
  }

  // Decodes a compact '~'-prefixed token back into bite coordinates.
  function decodeCompact(token, bounds) {
    const data = token.slice(1);
    const bits = [];

    for (const c of data) {
      const val = COMPACT_INDEX[c];

      if (val === undefined) {
        return [];
      }

      for (let b = 5; b >= 0; b -= 1) {
        bits.push((val >> b) & 1);
      }
    }

    const bites = [];

    // Each bite occupies 14 bits (7 for x, 7 for y); trailing padding bits are ignored.
    for (let i = 0; i + 14 <= bits.length; i += 14) {
      let x = 0;
      let y = 0;

      for (let b = 0; b < 7; b += 1) {
        x = (x << 1) | bits[i + b];
      }

      for (let b = 0; b < 7; b += 1) {
        y = (y << 1) | bits[i + 7 + b];
      }

      bites.push({
        x: Math.min(bounds.max, Math.max(bounds.min, x)),
        y: Math.min(bounds.max, Math.max(bounds.min, y))
      });
    }

    return bites;
  }

  function decodeBites(serialized, bounds = { min: 5, max: 95 }) {
    if (!serialized) {
      return [];
    }

    // Compact format is identified by the '~' prefix.
    if (serialized.startsWith('~')) {
      return decodeCompact(serialized, bounds);
    }

    // Legacy format: base36 "x-y" pairs joined by "_", coordinates scaled by 10.
    return serialized
      .split('_')
      .map((entry) => {
        const [rawX, rawY] = entry.split('-');
        const x = parseInt(rawX, 36) / 10;
        const y = parseInt(rawY, 36) / 10;

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return null;
        }

        return {
          x: Math.min(bounds.max, Math.max(bounds.min, x)),
          y: Math.min(bounds.max, Math.max(bounds.min, y))
        };
      })
      .filter(Boolean);
  }

  window.SandwichUtils = {
    HASH_PATTERN,
    hashString,
    encodeBites,
    decodeBites
  };
}());
