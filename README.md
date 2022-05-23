# elasticsearch-reindexer
NodeJS tool for adding mappings and analyzers to existing Elasticsearch indices.

I have only tested this with App Search 8.2.0.

## Example Usage

### inject-intragram-mappings.js

The `inject-intragram-mappings.js` script will inject App Search intragram analzyers and update the existing field mapping of a given list of fields. The new mappings and analyzers support more partial string matches. This script reindexes the given index into a new index.

```sh
npm install
export ELASTIC_USER="elastic"
export ELASTIC_PASSWORD="REDACTED"
export ELASTICSEARCH_HOST="my-elasticsearch-deployment.es.us-central1.gcp.cloud.es.io:9243"

node inject-intragram-mappings.js \
  --source-index ".ent-search-engine-documents-foo" \  # For App Search, specify the dot-prefixed index name, NOT alias name
  --dest-index ".ent-search-engine-documents-foo-new" \
  --fields title,description
```

Example output:
```sh
[23.05.2022 10:15.07.086] [LOG]   ---
[23.05.2022 10:15.07.088] [LOG]   This script will inject new analyzers and mappings into an index. It will:
[23.05.2022 10:15.07.088] [LOG]   1. Connect to Elasticsearch at my-elasticsearch-deployment.es.us-central1.gcp.cloud.es.io:9243
[23.05.2022 10:15.07.088] [LOG]   2. Clone and reindex .ent-search-engine-documents-foo into .ent-search-engine-documents-foo-new with new analyzers and mappings for the fields: title,description
[23.05.2022 10:15.07.088] [LOG]
Are you sure you want to continue? (y/n) y

[23.05.2022 10:22.50.788] [LOG]   Connected to Elasticsearch at my-elasticsearch-deployment.es.us-central1.gcp.cloud.es.io:9243
[23.05.2022 10:22.50.789] [LOG]   Cloning and reindexing index .ent-search-engine-documents-foo into .ent-search-engine-documents-foo-new with settings modifications and with mappings modifications
[23.05.2022 10:22.51.235] [DEBUG] Updating mapping for field title
[23.05.2022 10:22.51.235] [DEBUG] Updating mapping for field description
[23.05.2022 10:22.51.326] [DEBUG] Creating index .ent-search-engine-documents-foo-new
[23.05.2022 10:22.51.937] [DEBUG] Reindexing index .ent-search-engine-documents-foo into .ent-search-engine-documents-foo-new
[23.05.2022 10:22.52.114] [LOG]   Success!
```

### swap-aliased-index.js

The `swap-aliased-index.js` script will reconfigure an alias to point at a different index.

```sh
npm install
export ELASTIC_USER="elastic"
export ELASTIC_PASSWORD="REDACTED"
export ELASTICSEARCH_HOST="my-elasticsearch-deployment.es.us-central1.gcp.cloud.es.io:9243"

node swap-aliased-index.js \
   --alias "enterprise-search-engine-foo" \
   --old-index ".ent-search-engine-documents-foo" \
   --new-index ".ent-search-engine-documents-foo-new"
```

Example output:
```sh
[23.05.2022 10:48.35.838] [LOG]   ---
[23.05.2022 10:48.35.839] [LOG]   This script will reconfigure an alias to point at a different index. It will:
[23.05.2022 10:48.35.840] [LOG]   1. Connect to Elasticsearch at my-elasticsearch-deployment.es.us-central1.gcp.cloud.es.io:9243
[23.05.2022 10:48.35.840] [LOG]   2. Update the alias enterprise-search-engine-foo to add .ent-search-engine-documents-foo-new as an index
[23.05.2022 10:48.35.840] [LOG]   3. Update the alias enterprise-search-engine-foo to remove .ent-search-engine-documents-foo as an index
[23.05.2022 10:48.35.840] [LOG]
Are you sure you want to continue? (y/n) y

[23.05.2022 10:48.53.352] [LOG]   Connected to Elasticsearch at my-elasticsearch-deployment.es.us-central1.gcp.cloud.es.io:9243
[23.05.2022 10:48.53.353] [LOG]   Reconfiguring alias enterprise-search-engine-foo
[23.05.2022 10:48.54.029] [LOG]   Success!
```
