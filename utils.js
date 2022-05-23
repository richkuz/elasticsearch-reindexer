const elasticsearch = require('elasticsearch');

const ELASTIC_USER = process.env['ELASTIC_USER'];
const ELASTIC_PASSWORD = process.env['ELASTIC_PASSWORD'];
const ELASTICSEARCH_HOST = process.env['ELASTICSEARCH_HOST'];

const client = new elasticsearch.Client({
  hosts: [ `https://${ELASTIC_USER}:${ELASTIC_PASSWORD}@${ELASTICSEARCH_HOST}`],
  ssl:{ rejectUnauthorized: false, pfx: [] }
});


// Remove read-only settings so the same settings map can be used to create a new index
const cleanupSettings = (settings) => {
  delete settings.index.uuid;
  delete settings.index.provided_name;
  delete settings.index.creation_date;
  delete settings.index.version;
}

// Back up an index while preserving all mappings and settings (including analyzers)
const backupIndex = async ({sourceIndexName, backupIndexName}) => {
  console.log(`Backing up index ${sourceIndexName} into ${backupIndexName}...`);
  if (await client.indices.exists({index: backupIndexName})) {
    console.warn(`Backup index exists: ${backupIndexName}, not backing up.`);
    return;
  }
  await betterCloneIndex({
    sourceIndexName: sourceIndexName,
    destIndexName: backupIndexName
  });
  console.log('Backup complete');
}

// Clone an index while preserving mappings and settings (including analyzers).
// Provides optional hooks to modify mappings and settings.
// Reindexes content from the source index into the new index.
const betterCloneIndex = async ({sourceIndexName, destIndexName, injectSettingsFn, injectMappingsFn}) => {
  console.log(`Cloning and reindexing index ${sourceIndexName} into ${destIndexName}` +
  (injectSettingsFn ? " with settings modifications" : " without additional settings modifications") +
  (injectMappingsFn ? " and with mappings modifications" : " and without additional mappings modifications"));

  let settings = await client.indices.getSettings({
    index: sourceIndexName
  });
  settings = settings[sourceIndexName].settings;

  let mappings = await client.indices.getMapping({
    index: sourceIndexName
  });
  mappings = mappings[sourceIndexName].mappings;

  cleanupSettings(settings);
  injectSettingsFn && injectSettingsFn(settings);
  injectMappingsFn && injectMappingsFn(mappings);

  //console.log(`Settings: ${JSON.stringify(settings, null, 2)}`);
  //console.log(`Mappings: ${JSON.stringify(mappings, null, 2)}`);

  if (await client.indices.exists({index: destIndexName})) {
    console.debug(`Deleting index ${destIndexName}`);
    await client.indices.delete({index: destIndexName});
  }
  console.debug(`Creating index ${destIndexName}`);
  await client.indices.create({
    index: destIndexName,
    body: {
      settings: settings,
      mappings: mappings
    }
  });

  console.debug(`Reindexing index ${sourceIndexName} into ${destIndexName}`);
  await client.reindex({
    body: {
      source: {
        index: sourceIndexName
      },
      dest: {
        index: destIndexName
      }
    }
  });
}

const checkElasticsearchConnection = async () => {
  try {
    await client.ping({ requestTimeout: 30000});
  }
  catch (err) {
    console.error('Cannot connect to Elasticsearch');
    throw err;
  }
  console.log(`Connected to Elasticsearch at ${ELASTICSEARCH_HOST}`);
}

exports.checkElasticsearchConnection = checkElasticsearchConnection;
exports.betterCloneIndex = betterCloneIndex;
exports.backupIndex = backupIndex;
exports.client = client;
exports.ELASTICSEARCH_HOST = ELASTICSEARCH_HOST;
