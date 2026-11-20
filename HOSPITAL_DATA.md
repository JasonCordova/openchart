# Hospital directory data

The current application reads the existing local MySQL `mapbox.hospitals` table.
It does not create or migrate tables, import records, or modify hospital data.
See [backend/README.md](backend/README.md) for connection configuration.

## API mapping

| Database field | API field | Usage |
| --- | --- | --- |
| id | id | Distinguishes hospitals with the same name. |
| name | name | Search results, hospital cards and tooltips. |
| address | address | Street address. |
| city / state | city / state | Address display, search and state filtering. |
| zip | zipcode | ZIP code kept as text, including leading zeroes. |
| website_url | websiteUrl | Nullable verified HTTP(S) website link. |
| latitude / longitude | latitude / longitude | Numeric coordinates for the map. |

The API converts malformed, nonfinite or out-of-range coordinates to null. The map
omits unplottable records and reports their count. Missing websites remain null;
the frontend displays "Website unavailable". Names and locations alone do not
establish that a facility is active or eligible for price comparisons.

## Website provenance

Website enrichment was a one-time data repair. Approved website URLs are stored
in MySQL; the application only reads them. The enrichment utility is no longer
included in the application code.

Source snapshots, official-site evidence, applied-update reports and conditional
rollback SQL remain under the ignored
`data/hospitals/generated/website-enrichment/` directory. Keep those records for
review and recovery. Historical source URLs alone do not establish an official
hospital website; any future changes still require hospital/operator verification.

The retired RDS/PostgreSQL importers are not compatible with this local MySQL
workflow and are no longer included.

## Future ingestion and deployment

Managed RDS PostgreSQL remains the planned AWS option for relational facts and
pgvector, subject to a new dated whole-stack estimate and headroom under $50/month.
Spring Boot/Spring Batch will own reviewed source ingestion and identity mapping.
The current choice is the existing local MySQL directory plus a read-only JDBC API;
no new AWS service or database is provisioned.

AWS, semantic search, vector storage and RAG remain required. Future price and
vector records belong in separate tables. The initial price catalog covers 10-20
curated procedures. Procedure mode must omit hospitals without valid comparable
published prices; browse mode may show the hospital directory.
