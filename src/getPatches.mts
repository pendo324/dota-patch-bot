import * as axios from 'axios';
import { scheduleJob } from 'node-schedule';
import { readFile, writeFile } from 'fs/promises';

import { CachedPatch, PatchData, Patch } from './models.mjs';
import { dirname } from './util/dirname.mjs';

const cachedPatchesFileName = dirname(['../../', 'data', 'patchData.json']);
let latestCachedPatchData: PatchData | undefined;

export interface ScheduleFetchProps {
  onNewPatch: (newPatchData: Patch) => void;
}

export const scheduleFetch = async ({ onNewPatch }: ScheduleFetchProps) => {
  setTimeout(() => {
    scheduleJob(
      {
        minute: 1
      },
      async () => {
        await getPatches({ onNewPatch });
      }
    );
  }, 1000);
  return getPatches();
};

export const getPatches = async (props?: Partial<ScheduleFetchProps>) => {
  const onNewPatch = props?.onNewPatch;
  try {
    const cachedPatchedData = JSON.parse(await readFile(cachedPatchesFileName, 'utf8')) as CachedPatch;
    if (Date.now() - cachedPatchedData.retrievedAt > 60000) {
      const newPatchData = await fetchAndCache();
      const latestNewPatch = newPatchData.patches.at(-1);

      const latestCachedPatch = latestCachedPatchData?.patches.at(-1);
      if (latestCachedPatch && latestNewPatch && latestCachedPatch?.patch_timestamp > latestNewPatch?.patch_timestamp) {
        if (typeof onNewPatch === 'function') {
          onNewPatch(latestNewPatch);
        }
      }
      return newPatchData;
    }
    return cachedPatchedData.data;
  } catch {
    return fetchAndCache();
  }
};

const fetchAndCache = async () => {
  try {
    const patchRes = await axios.default.get('https://www.dota2.com/datafeed/patchnoteslist');
    const patchData = patchRes.data as PatchData;
    await writeFile(
      dirname(['../../', 'data', 'patchData.json']),
      JSON.stringify({ retrievedAt: Date.now(), data: patchData }, null, 2)
    );
    latestCachedPatchData = patchData;
    return patchData;
  } catch {
    console.log(`Could not retrieve patch data and no cache was available at ${cachedPatchesFileName}`);
    process.exit();
  }
};
