const printUsage = () => {
  console.log(`
Reconfigure an alias to point at a different index.

Usage:
export ELASTIC_USER=elastic
export ELASTIC_PASSWORD=REDACTED
export ELASTICSEARCH_HOST="my-deployment.es.us-central1.gcp.cloud.es.io:9243"

# Args:
# 1. The name of the alias
# 2. The name of the existing index in the alias to be removed
# 3. The name of the new index the alias should point to
node swap-aliased-index.js "enterprise-search-engine-foo" ".ent-search-engine-documents-foo" ".ent-search-engine-documents-foo-new"
  `);
};

const utils = require('./utils.js');
const yesno = require('yesno');
require( 'console-stamp' )( console );

const run = async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length != 3) {
      printUsage();
      return;
    }

    const alias = args[0];
    const oldIndex = args[1];
    const newIndex = args[2];

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
