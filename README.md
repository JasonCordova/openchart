<h1 align="center">OpenChart</h1>

OpenChart is a planned public website for comparing hospital-published procedure prices by location. It aims to make pricing easier to explore, with clear sources and context.

The project's core is its architecture: **AWS, Spring Boot, semantic search, vector
storage, and RAG**. Follow the [architecture guide](ARCHITECTURE.md) for every
component decision: evaluate AWS first, then implement custom behavior in Spring Boot.
The confirmed total recurring project budget is **under $50/month**.
The [system design](SYSTEM_DESIGN.md) details the hospital map, procedure search,
RAG, and hospital price-file pipeline.

The initial catalog covers **10-20 curated common procedures**. Users can browse
hospital locations without choosing a procedure. Once a procedure is selected,
the map and results show only hospitals with a valid, comparable published price
for that procedure.

## Hospital directory

A public hospital directory is available in [data/hospitals](data/hospitals/README.md),
with SQLite, CSV, GeoJSON, and a PostgreSQL import. The November 7, 2026 HRSA snapshot
contains 6,761 hospital/provider records; 6,760 have coordinates. See its documentation
for coverage, missing addresses, legacy entries, and refresh instructions.

## Proposed stack

| Component | Choice |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| DNS and HTTPS certificates | Amazon Route 53 and AWS Certificate Manager |
| Frontend delivery | Amazon CloudFront and a private S3 bucket |
| Public API | Amazon API Gateway HTTP API |
| Backend integration | VPC Link and AWS Cloud Map to Spring Boot on EC2 |
| Ingestion | Spring Batch worker; EventBridge Scheduler and SQS |
| Hospital and price records | PostgreSQL on EC2 initially; evaluate RDS against budget |
| Vector storage and semantic retrieval | S3 Vectors and Amazon Bedrock Knowledge Bases |
| Embeddings and required RAG | Amazon Bedrock; Spring AI integration |
| Pilot compute and persistence | One AWS EC2 instance, Docker Compose, EBS; PostgreSQL stays private |
| Raw source files and backups | Private Amazon S3 buckets |
| Infrastructure and delivery | AWS CDK in TypeScript, GitHub Actions with AWS OIDC |
