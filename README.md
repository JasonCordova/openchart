<h1 align="center">OpenChart</h1>

OpenChart is a planned public website for comparing hospital-published procedure prices by location. It aims to make pricing easier to explore, with clear sources and context.

## Proposed stack

| Component | Choice |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| API | Java / Spring Boot |
| Ingestion | Streaming Python worker |
| Database and vector search | PostgreSQL with pgvector |
| Embeddings and optional grounded explanations | Amazon Bedrock |
| Pilot hosting | One AWS EC2 instance, Docker Compose, Caddy HTTPS |
| Raw source files and backups | Private Amazon S3 buckets |
| Infrastructure and delivery | AWS CDK in TypeScript, GitHub Actions with AWS OIDC |
