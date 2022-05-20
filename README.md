# elasticsearch-reindexer
NodeJS tool for adding mappings and analyzers to existing Elasticsearch indices

## Example Usage:

The `inject-intragram-mappings.js` script will inject App Search intragram analzyers and update the existing field mapping of a single field called `title`.

```sh
npm install
export ELASTIC_USER="elastic"
export ELASTIC_PASSWORD="REDACTED"
export ELASTICSEARCH_HOST="my-elasticsearch-deployment.es.us-central1.gcp.cloud.es.io:9243"
export SOURCE_INDEX_NAME=".ent-search-engine-documents-foo"  # Index name, NOT alias!
node inject-intragram-mappings.js

[20.05.2022 09:26.53.711] [LOG]   ---
[20.05.2022 09:26.53.713] [LOG]   This script will inject new analyzers and mappings into an index. It will:
[20.05.2022 09:26.53.714] [LOG]   1. Connect to Elasticsearch at <redacted>
[20.05.2022 09:26.53.714] [LOG]   2. Back up .ent-search-engine-documents-foo into .ent-search-engine-documents-foo-backup-1653053213709
[20.05.2022 09:26.53.714] [LOG]   3. Clone and reindex .ent-search-engine-documents-foo into .ent-search-engine-documents-foo-temp with new analyzers and mappings
[20.05.2022 09:26.53.714] [LOG]   4. Delete .ent-search-engine-documents-foo
[20.05.2022 09:26.53.714] [LOG]   5. Clone and reindex .ent-search-engine-documents-foo-temp into .ent-search-engine-documents-foo
[20.05.2022 09:26.53.714] [LOG]
Are you sure you want to continue? (y/n) y
```
