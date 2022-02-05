import { getNoteroPref, NoteroPref, setNoteroPref } from './notero-pref';

export type CollectionSyncConfig = {
  notionOptionID?: string;
  syncEnabled: boolean;
};

export type CollectionSyncConfigsRecord = Record<
  Zotero.Collection['id'],
  CollectionSyncConfig | undefined
>;

export function loadSyncConfigs(): CollectionSyncConfigsRecord {
  const json = getNoteroPref(NoteroPref.collectionSyncConfigs);
  return parseSyncConfigs(json);
}

export function loadSyncEnabledCollectionConfigs(): CollectionSyncConfigsRecord {
  const allConfigs = loadSyncConfigs();

  return Object.entries(allConfigs).reduce(
    (syncEnabledConfigs: CollectionSyncConfigsRecord, [key, config]) => {
      const collectionID = Number(key);
      if (collectionID > 0 && config?.syncEnabled) {
        syncEnabledConfigs[collectionID] = config;
      }
      return syncEnabledConfigs;
    },
    {}
  );
}

export function loadSyncEnabledCollectionIDs(): Set<Zotero.Collection['id']> {
  const syncEnabledCollectionConfigs = loadSyncEnabledCollectionConfigs();
  const collectionIDs = Object.keys(syncEnabledCollectionConfigs).map(Number);
  return new Set(collectionIDs);
}

export function saveSyncConfigs(configs: CollectionSyncConfigsRecord): void {
  setNoteroPref(NoteroPref.collectionSyncConfigs, JSON.stringify(configs));
}

export function parseSyncConfigs(json: unknown): CollectionSyncConfigsRecord {
  if (typeof json !== 'string') return {};

  try {
    const parsedValue = JSON.parse(json);
    if (!isObject(parsedValue)) return {};

    return Object.entries(parsedValue)
      .map(convertKeyToNumber)
      .filter(isCollectionSyncConfigEntry)
      .reduce(
        (configs: CollectionSyncConfigsRecord, [collectionID, config]) => {
          configs[collectionID] = config;
          return configs;
        },
        {}
      );
  } catch (error) {
    Zotero.log(`Failed to parse Notero sync configs: ${error}`, 'error');
    return {};
  }
}

function convertKeyToNumber([key, value]: [string, unknown]): [
  number,
  unknown
] {
  return [Number(key), value];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCollectionSyncConfig(value: unknown): value is CollectionSyncConfig {
  return isObject(value) && 'syncEnabled' in value;
}

function isCollectionSyncConfigEntry(
  entry: [number, unknown]
): entry is [Zotero.Collection['id'], CollectionSyncConfig] {
  const [key, value] = entry;
  return key > 0 && isCollectionSyncConfig(value);
}
