(function () {
  const HASH_PATTERN = /^[0-9a-f]{8}$/i;
  // Tenths keep the URL short while preserving the same visual precision used by the bite stage.
  const ENCODE_SCALE = 10;

  function hashString(value) {
    // 32-bit FNV-1a: offset basis 2166136261 and prime 16777619 keep the short bite token well distributed.
    let hash = 2166136261;

    for (const character of value) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function encodeBites(bites) {
    return bites
      .map(({ x, y }) => `${Math.round(x * ENCODE_SCALE).toString(36)}-${Math.round(y * ENCODE_SCALE).toString(36)}`)
      .join('_');
  }

  function decodeBites(serialized, bounds = { min: 5, max: 95 }) {
    if (!serialized) {
      return [];
    }

    return serialized
      .split('_')
      .map((entry) => {
        const [rawX, rawY] = entry.split('-');
        const x = parseInt(rawX, 36) / ENCODE_SCALE;
        const y = parseInt(rawY, 36) / ENCODE_SCALE;

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
