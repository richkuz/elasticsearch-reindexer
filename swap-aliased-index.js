const utils = require('./utils.js');
const yesno = require('yesno');
const { ArgumentParser } = require('argparse');
require( 'console-stamp' )( console );

const run = async () => {
  try {
    const parser = new ArgumentParser({
      description: `
Reconfigure an alias to point at a different index.

Usage:
export ELASTIC_USER=elastic
export ELASTIC_PASSWORD=REDACTED
export ELASTICSEARCH_HOST="my-deployment.es.us-central1.gcp.cloud.es.io:9243"

node swap-aliased-index.js \
  --alias "enterprise-search-engine-foo" \
  --old-index ".ent-search-engine-documents-foo" \
  --new-index ".ent-search-engine-documents-foo-new"
`
    });
    parser.add_argument('-a', '--alias', { help: 'Elasticsearch alias to reconfigure, e.g. enterprise-search-engine-foo'});
    parser.add_argument('-o', '--old-index', { help: 'Elasticsearch index to be removed from the alias, e.g. .ent-search-engine-documents-foo' });
    parser.add_argument('-n', '--new-index', { help: 'Elasticsearch index to be be added to the alias, e.g. .ent-search-engine-documents-foo-new' });
    const args = parser.parse_args();

    const alias = args['alias'];
    const oldIndex = args['old_index'];
    const newIndex = args['new_index'];

    console.log('---');
    console.log(`This script will reconfigure an alias to point at a different index. It will:`);
    console.log(`1. Connect to Elasticsearch at ${utils.ELASTICSEARCH_HOST}`);
    console.log(`2. Update the alias ${alias} to add ${newIndex} as an index`);
    console.log(`3. Update the alias ${alias} to remove ${oldIndex} as an index`);
    console.log('');
    if (!await yesno({
      question: 'Are you sure you want to continue? (y/n)'
    })) {
      return;
    };

    await utils.checkElasticsearchConnection();

    const client = utils.client;

    console.log(`Reconfiguring alias ${alias}`);
    await client.indices.updateAliases({
      body: {
        "actions": [
          {
            "add": {
              "index": newIndex,
              "alias": alias
            }
          }
        ]
      }
    });
    await client.indices.updateAliases({
      body: {
        "actions": [
          {
            "remove": {
              "index": oldIndex,
              "alias": alias
            }
          }
        ]
      }
    });
    console.log("Success!");
  }
  catch(err) {
    console.error(err);
  }
}

run();
