<h1 align="center">OpenChart</h1>

OpenChart displays hospital locations using a React/Mapbox frontend and a Java
Spring Boot API backed by local MySQL.

## Run locally

Configure your MySQL credentials in `backend/.env` using
[backend/.env.example](backend/.env.example). Keep credentials in that ignored file.

From the repository root:

```powershell
cd backend
mvn spring-boot:run
```

In a second terminal, from the repository root:

```powershell
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>.
The API runs on <http://127.0.0.1:8080/api/hospitals> and reads the existing
`mapbox.hospitals` table. See [backend instructions](backend/README.md) and
[frontend instructions](frontend/README.md) for configuration and build commands.

The map supports native Mapbox clustering, purple circular counts, hospital
search, state filtering, hospital cards, and website links. Hospital images are
labeled placeholders. Procedure prices and comparisons are not implemented yet.

## Hospital data

[HOSPITAL_DATA.md](HOSPITAL_DATA.md) describes the current database mapping and
website verification. The one-time enrichment utility has been removed from the
application code. Source snapshots, verification evidence and rollback files stay
under the ignored `data/hospitals/generated/` directory.

## Planned architecture

AWS, Spring Boot, semantic search, vector storage and RAG remain project
requirements. The first procedure catalog is limited to 10-20 curated procedures.
Procedure comparisons must include only hospitals with valid, comparable
published prices; unsupported requests must be identified explicitly.

The total recurring budget is **under $50/month**. Follow
[ARCHITECTURE.md](ARCHITECTURE.md), [PILOT_PLAN.md](PILOT_PLAN.md), and the dated
[AWS estimate](AWS_COST_ESTIMATE.md) before provisioning. The former RDS bootstrap
and PostgreSQL import utilities have been retired; these documents describe future
deployment plans, not currently provisioned infrastructure.
