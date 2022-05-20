// Modify an index with new mappings and analyzers.
// This example adds App Search intragram tokenizers and mappings to an index.
//
// This operation is potentially time consuming! It requires reindexing _twice_.
//
//
// Usage:
// npm install
// export ELASTIC_USER=elastic
// export ELASTIC_PASSWORD=REDACTED
// export ELASTICSEARCH_HOST="rkuzsma-7-9-3.es.us-central1.gcp.cloud.es.io:9243"
// export SOURCE_INDEX_NAME=".ent-search-engine-documents-parks"  # Index name, NOT alias!
// node inject-intragram-mappings.js

const elasticsearch = require('elasticsearch');
const yesno = require('yesno');

const ELASTIC_USER = process.env['ELASTIC_USER'];
const ELASTIC_PASSWORD = process.env['ELASTIC_PASSWORD'];
const ELASTICSEARCH_HOST = process.env['ELASTICSEARCH_HOST'];
const SOURCE_INDEX_NAME = process.env['SOURCE_INDEX_NAME'];

const client = new elasticsearch.Client({
  hosts: [ `https://${ELASTIC_USER}:${ELASTIC_PASSWORD}@${ELASTICSEARCH_HOST}`]
});

// Specify new analyzers to inject into the existing index
const injectNewAnalyzers = (settings) => {
  settings.index.analysis.analyzer.iq_intragram = {
    "filter": [
      "cjk_width",
      "lowercase",
      "asciifolding"
    ],
    "tokenizer": "intragram_tokenizer"
  };
  settings.index.analysis.tokenizer = {
    "intragram_tokenizer": {
      "token_chars": [
        "letter",
        "digit"
      ],
      "min_gram": "3",
      "type": "ngram",
      "max_gram": "4"
    }
  }
}

// Specify new mappings to inject into the existing index
const injectNewMappings = (mappings) => {
  mappings.properties.title.fields.joined = {
    "type" : "text",
    "index_options" : "docs",
    "analyzer" : "iq_intragram"
  }
}

// Remove read-only settings so the same settings map can be used to create a new index
const cleanupSettings = (settings) => {
  delete settings.index.uuid;
  delete settings.index.provided_name;
  delete settings.index.creation_date;
  delete settings.index.version;
}

// Back up an index while preserving all mappings and settings (including analyzers)
const backupIndex = async (sourceIndexName, backupIndexName) => {
  if (await client.indices.exists({index: backupIndexName})) {
    console.log(`Backup index exists: ${backupIndexName}`);
    return;
  }
  console.log(`Backing up index ${sourceIndexName} into ${backupIndexName}...`);
  await betterCloneIndex({
    sourceIndexName: sourceIndexName,
    destIndexName: backupIndexName
  });
  console.log('Backup complete');
}

// Clone an index while preserving mappings and settings (including analyzers).
// Provides optional hooks to modify mappings and settings
const betterCloneIndex = async ({sourceIndexName, destIndexName, injectSettingsFn, injectMappingsFn}) => {

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
    await client.indices.delete({index: destIndexName});
  }
  await client.indices.create({
    index: destIndexName,
    body: {
      settings: settings,
      mappings: mappings
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

const run = async () => {
  try {
    const sourceIndexName = SOURCE_INDEX_NAME;
    const backupIndexName = `${SOURCE_INDEX_NAME}-BACKUP`;
    const tempIndexName = `${SOURCE_INDEX_NAME}-TEMP`;
    console.log('---');
    console.log(`This script will inject new analyzers and mappings into an index. It will:`);
    console.log(`1. Connect to Elasticsearch at ${ELASTICSEARCH_HOST}`);
    console.log(`2. Back up ${sourceIndexName} into ${backupIndexName}`)
    console.log(`3. Clone and reindex ${sourceIndexName} into ${tempIndexName} with new analyzers and mappings`);
    console.log(`4. Delete ${sourceIndexName}`);
    console.log(`5. Clone and reindex ${tempIndexName} into ${sourceIndexName}`);
    console.log('');
    if (!await yesno({
      question: 'Are you sure you want to continue? (y/n)'
    })) {
      return;
    };

    await checkElasticsearchConnection();

    await backupIndex({
      sourceIndexName,
      backupIndexName,
    });

    await betterCloneIndex({
      sourceIndexName: sourceIndexName,
      destIndexName: tempIndexName,
      injectMappingsFn: (sourceMappings) => {
        injectNewMappings(sourceMappings);
      },
      injectSettingsFn: (sourceSettings) => {
        injectNewAnalyzers(sourceSettings);
      }
    });

    await client.reindex({
      body: {
        source: sourceIndexName,
        dest: tempIndexName,
      }
    });

    // Swap the indices
    await client.indices.delete({
      index: sourceIndexName,
    });
    await createIndexFromIndex({
      sourceIndexName: tempIndexName,
      destIndexName: sourceIndexName,
    });

  }
  catch(err) {
    console.error(err);
  }
}

run();
