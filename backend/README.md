# OpenChart Spring Boot API

The local API reads the existing MySQL `mapbox.hospitals` table. It does not create,
alter, import, or delete hospital records. Java 21+ and Maven 3.6.3+ are required.

## Start locally

Set your private credentials in `backend/.env` (copy `.env.example` if needed):

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mapbox
DB_USERNAME=root
DB_PASSWORD=your_local_mysql_password
SERVER_PORT=8080
```

Normal dotenv quoting is supported, for example `DB_PASSWORD="password with spaces"`.
The file is ignored by Git. Keep database credentials in the backend; Vite must not
receive them. Existing OS environment variables override `.env` values.

From the repository root in PowerShell:

```powershell
cd backend
mvn spring-boot:run
```

Stop with Ctrl+C; run `mvn spring-boot:run` again from `backend/` to restart.
Restart after editing `.env` or backend Java code. MySQL must be running.
Port 8080 binds to localhost by default.

In a second terminal, from the repository root, start the frontend:

```powershell
cd frontend
npm run dev
```

Open the Vite URL, normally <http://localhost:5173>. Vite proxies `/api` to
`http://127.0.0.1:8080`, so the browser uses the same origin and needs no broad CORS
policy. If you change `SERVER_PORT`, set `API_PROXY_TARGET=http://127.0.0.1:YOUR_PORT`
in `frontend/.env` and restart Vite. For a production frontend build, configure the
web server to forward `/api` to Spring Boot; the development proxy is not deployed.

## Endpoints

| Request | Result |
| --- | --- |
| `GET /api/hospitals` | All directory records, sorted by state/city/name/id. |
| `GET /api/hospitals/{id}` | One hospital; 404 if absent, 400 for an invalid ID. |
| `GET /actuator/health` | Application/database health without connection details. |

Example response record:

```json
{"id":1,"name":"Example Hospital","address":"1 Main Street","city":"Newark","state":"New Jersey","zipcode":"07102","websiteUrl":"https://example.org/","latitude":40.7357,"longitude":-74.1724}
```

The existing database's `zip` column becomes `zipcode` in JSON. Coordinates stored
as strings in MySQL become JSON numbers; missing, nonfinite, malformed or out-of-range
coordinates become null. The API still returns these hospitals; the map omits
unplottable records and reports their count. Missing website URLs remain null.
Database failures return a generic HTTP 503. Every directory request reads MySQL
again; the map's Refresh button fetches current records without restarting.

This is directory browsing. No procedure prices or comparison eligibility are
invented. Procedure/search/RAG features remain planned under `ARCHITECTURE.md`.

## Package

```powershell
cd backend
mvn package
java -jar target/openchart-api-0.1.0.jar
```

The JAR also reads `.env` in its working directory (or `backend/.env` when launched
from the repository root). The API's connection pool is configured read-only;
for stronger enforcement, supply a MySQL account granted only SELECT access.
No AWS resource is created by these commands.
