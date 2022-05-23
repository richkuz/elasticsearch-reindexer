// Copy an index into a new index with App Search intragram tokenizers in the new index.
// Usage and help:
// node inject-intragram-mappings.js -h

const utils = require('./utils.js');
const yesno = require('yesno');
const { ArgumentParser } = require('argparse');
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
// mappings: existing mappings to modify
// fields: user-specified list of fields to modify with new mappings
const injectNewMappings = (mappings, fields) => {
  fields.forEach((field) => {
    console.debug(`Updating mapping for field ${field}`);
    mappings.properties[field].fields.joined = {
      "type" : "text",
      "index_options" : "docs",
      "analyzer" : "iq_intragram"
    }
  });
}

const run = async () => {
  try {
    const parser = new ArgumentParser({
      description: `
Copy an index into a new index with App Search intragram tokenizers in the new index.

This operation is potentially time consuming! It requires reindexing once.

Unlike _clone, the index.number_of_replicas and index.auto_expand_replicas settings are copied to the new index.

Usage:
export ELASTIC_USER=elastic
export ELASTIC_PASSWORD=REDACTED
export ELASTICSEARCH_HOST="my-deployment.es.us-central1.gcp.cloud.es.io:9243"

node inject-intragram-mappings.js \
  --source-index ".ent-search-engine-documents-foo" \
  --dest-index ".ent-search-engine-documents-foo-new" \
  --fields title,description
`
    });
    parser.add_argument('-s', '--source-index', { help: 'Elasticsearch source index name, e.g. .ent-search-engine-documents-foo'});
    parser.add_argument('-d', '--dest-index', { help: 'Elasticsearch destination index to create, e.g. .ent-search-engine-documents-foo-new' });
    parser.add_argument('-f', '--fields', { help: 'Comma-separated list of fields to modify with new analyzers, e.g. title,description' });
    const args = parser.parse_args();

    const sourceIndexName = args['source_index'];
    const newIndexName = args['dest_index'];
    const fields = args['fields'].split(',');

    console.log('---');
    console.log(`This script will inject new analyzers and mappings into an index. It will:`);
    console.log(`1. Connect to Elasticsearch at ${utils.ELASTICSEARCH_HOST}`);
    console.log(`2. Clone and reindex ${sourceIndexName} into ${newIndexName} with new analyzers and mappings for the fields: ${fields}`);
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
        injectNewMappings(sourceMappings, fields);
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
