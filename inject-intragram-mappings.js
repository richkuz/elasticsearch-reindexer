const printUsage = () => {
  console.log(`
Copy an index into a new index with App Search intragram tokenizers in the new index.

This operation is potentially time consuming! It requires reindexing once.

Unlike _clone, the index.number_of_replicas and index.auto_expand_replicas settings are copied to the new index.

Usage:
export ELASTIC_USER=elastic
export ELASTIC_PASSWORD=REDACTED
export ELASTICSEARCH_HOST="rkuzsma-7-9-3.es.us-central1.gcp.cloud.es.io:9243"

# Args:
# 1. The name of the index (NOT the alias!) to inject
# 2. The name of the new index to create
node inject-intragram-mappings.js ".ent-search-engine-documents-foo" ".ent-search-engine-documents-foo-new"
  `);
};

const utils = require('./utils.js');
const yesno = require('yesno');
require( 'console-stamp' )( console );

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

const run = async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length != 2) {
      printUsage();
      return;
    }

    const sourceIndexName = args[0];
    const newIndexName = args[1];

    console.log('---');
    console.log(`This script will inject new analyzers and mappings into an index. It will:`);
    console.log(`1. Connect to Elasticsearch at ${utils.ELASTICSEARCH_HOST}`);
    console.log(`2. Clone and reindex ${sourceIndexName} into ${newIndexName} with new analyzers and mappings`);
    console.log('');
    if (!await yesno({
      question: 'Are you sure you want to continue? (y/n)'
    })) {
      return;
    };

    await utils.checkElasticsearchConnection();

    await utils.betterCloneIndex({
      sourceIndexName: sourceIndexName,
      destIndexName: newIndexName,
      injectMappingsFn: (sourceMappings) => {
        injectNewMappings(sourceMappings);
      },
      injectSettingsFn: (sourceSettings) => {
        injectNewAnalyzers(sourceSettings);
      }
    });

    console.log("Success!");
  }
  catch(err) {
    console.error(err);
  }
}

run();
