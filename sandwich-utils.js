(function () {
  const HASH_PATTERN = /^[0-9a-f]{8}$/i;

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
      .map(({ x, y }) => `${Math.round(x * 10).toString(36)}-${Math.round(y * 10).toString(36)}`)
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
