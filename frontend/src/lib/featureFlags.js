import api from './api';

let cachedFlags = null;
let inflight = null;

export const getFeatureFlags = async () => {
  if (cachedFlags) return cachedFlags;
  if (inflight) return inflight;

  inflight = api.get('/feature-flags')
    .then((res) => {
      cachedFlags = res.data || {};
      inflight = null;
      return cachedFlags;
    })
    .catch(() => {
      inflight = null;
      return {};
    });

  return inflight;
};

export const clearFeatureFlagsCache = () => {
  cachedFlags = null;
  inflight = null;
};

export const isFlagEnabled = (flags, key) => Boolean(flags && Object.prototype.hasOwnProperty.call(flags, key) ? flags[key] : false);
