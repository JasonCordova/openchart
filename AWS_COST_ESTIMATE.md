# AWS pilot estimate

Estimate date: November 8, 2026. Region: `us-east-1`. Currency: USD.
Status: dated pilot estimate for initial RDS provisioning; not a guaranteed bill.
The original deployment and bootstrap tooling have been retired. The app currently
runs locally; refresh this whole-stack estimate before provisioning replacements.
The confirmed recurring project ceiling remains **under $50/month**.

## Workload and assumptions

- NJ/NY HRSA hospital directory from layers 0 and 1; one bounded refresh
  at a time. Price ingestion covers 10-20 reviewed hospitals and 10-20 procedures.
- One Linux ARM EC2 `t4g.small` for Spring Boot and a bounded Spring Batch worker;
  one private Single-AZ RDS PostgreSQL `db.t4g.micro`, 20 GiB gp3 for both facts
  and pgvector. No second RDS instance, S3 Vectors, or Bedrock Knowledge Base.
- 744 running hours, covering a 31-day month. On-demand pricing; no promotional
  credits, reservations, or time-limited free tier required for fixed resources.
- At most 10,000 API requests, 1 GiB frontend delivery, 1 GiB API delivery,
  5 GiB S3 retained objects, 10,000 vector queries, and 0.25 GiB logs/month.
- At most 1 million new embedding tokens/month and 1,000 generation calls, each
  bounded to 2,000 input and 500 output tokens. Plan Amazon Nova Lite v1 for
  generation and Titan Text Embeddings V2. Both were confirmed ACTIVE in us-east-1
  through the account's Bedrock model catalog on November 8. At assumed rates of
  $0.06/$0.24 per million input/output tokens and $0.02/million embedding tokens,
  this envelope is about $0.26; retain the $2 allowance and recheck before model use.
- RDS and EC2 share an Availability Zone for normal database traffic. The DB
  subnet group still spans two AZs. No NAT gateway, load balancer, RDS Proxy,
  paid VPC endpoints, provisioned IOPS, or provisioned model throughput.

## Whole-stack monthly estimate

These are planning allowances unless explicitly marked as verified unit prices.
Variable allowances are not provider-enforced spending caps.

| Component | Basis | Monthly USD |
| --- | --- | ---: |
| RDS PostgreSQL compute | 744 hours x $0.016; verified public AWS price catalog | 11.91 |
| RDS storage | 20 GiB x $0.115; verified public AWS price catalog | 2.30 |
| EC2 application/worker | 744 hours x verified $0.0168 on-demand Linux rate | 12.50 |
| EC2 EBS root volume | 20 GiB gp3 x assumed $0.08 | 1.60 |
| EC2 public IPv4 | 744 hours x $0.005 | 3.72 |
| S3 objects and requests | 5 GiB; bounded downloads, snapshots, approved documents | 0.50 |
| RDS backup overage/snapshots | One-day automated retention under the current account plan; monitor stored bytes | 0.50 |
| CloudFront and frontend delivery | 1 GiB plus requests; allowance without promotional credits | 0.50 |
| API Gateway HTTP API and API delivery | 10,000 calls, 1 GiB; includes VPC Link path | 0.25 |
| Cloud Map | One registered resource plus discovery calls; HTTP namespace | 0.25 |
| GoDaddy DNS | Assumes DNS included with the selected domain; verify plan | 0.00 |
| GoDaddy domain renewal | Reserve up to $36/year amortized; actual domain pending | 3.00 |
| EventBridge Scheduler and SQS/DLQ | Bounded schedule and job/retry counts | 0.10 |
| pgvector | Uses the existing RDS compute/storage allowance; benchmark combined load | 0.00 |
| Bedrock embeddings and generation | Usage envelope above; selected model must fit | 2.00 |
| CloudWatch, Budgets, parameter/secret access | Includes one RDS-managed Secrets Manager secret (~$0.40/month) plus bounded requests/logs; no advanced monitoring | 1.00 |
| CPU credit overage and transfer contingency | RDS T4g credits and unexpected regional traffic | 1.00 |
| ACM public certificates, IAM, basic Systems Manager | Standard AWS-integrated use; no private CA | 0.00 |
| Mapbox | Assumes pilot usage within ongoing included allowance; verify account/plan | 0.00 |
| Tax allowance | Conservative reserve; actual account tax treatment pending | 3.50 |
| **Planning total** | | **44.63** |
| **Headroom below $50** | | **5.37** |

At these assumptions RDS is a reasonable pilot choice. This is not evidence that
national-scale price ingestion or public production traffic fits this budget.
The database's 1 GiB RAM and Single-AZ availability are pilot compromises; benchmark
imports, connections, SQL/vector queries, and embedding storage before treating
them as sufficient. The initial data foundation (RDS, EC2/EBS/IPv4, S3, managed
secret, and bounded backup/log usage) is approximately $33-$34/month before tax.
The complete table reserves capacity for the later frontend/API/model stages.
No temporary free-tier credits are needed. pgvector still consumes database resources.

## Verification and deployment gate

Read AWS's public `AmazonRDS/current/us-east-1/index.json` price catalog on the
estimate date. Confirmed PostgreSQL Single-AZ compute SKU `9HPEGXQTDDGH53C9`
(`InstanceUsage:db.t4g.micro`) at $0.016/hour and gp3 storage SKU
`KYVYY29G957PKY3B` at $0.115/GB-month; effective compute term October 1, 2026.
After the user configured the `openchart` profile locally, read-only account
inspection confirmed no existing EC2 or RDS instances in us-east-1. Verified
EC2 Linux `t4g.small` SKU `9GWX7R3VJUG9P8Y8` at $0.0168/hour through the AWS
Pricing API (effective November 1, 2026). RDS orderable options confirm PostgreSQL
17.11, `db.t4g.micro`, gp3 minimum 20 GiB, in the chosen AZs.

This dated whole-stack estimate has $5.37 reserved headroom for the initial
provisioning. Other rows are bounded usage allowances, not fixed-price quotes.
Domain, Mapbox, taxes, and actual workload remain assumptions: verify them before
expanding beyond the data foundation. Re-estimate before any larger RDS instance,
new service, traffic increase, paid map plan, or higher-priced model is enabled.
PostgreSQL 17 remains in standard support; disable Extended Support enrollment.
The private-RDS access host is the already budgeted application EC2 instance,
not an additional bastion. No NAT gateway, load balancer, or VPC endpoint is added.
The first creation attempt was rejected because seven-day backup retention
exceeded this account's free-plan limit. Use one-day automated retention for this
rebuildable public-data pilot; no account-plan upgrade was made. Keep source
snapshots and revisit retention before storing irreplaceable application data.

Implement persistent monthly model/token counters and admission limits before
enabling public model endpoints. Bound import bytes, disk use, concurrency,
retention, connection pools, and retries. Alert at $30/$40/$45. Alerts do not stop
spend. Fixed resource charges and database CPU credits remain chargeable even
when application work is paused; do not represent this estimate as a hard cap.

## Primary pricing references

- [RDS PostgreSQL](https://aws.amazon.com/rds/postgresql/pricing/) and
  [regional public price catalog](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/us-east-1/index.json)
- [EC2](https://aws.amazon.com/ec2/pricing/on-demand/),
  [EBS](https://aws.amazon.com/ebs/pricing/), [IPv4/VPC](https://aws.amazon.com/vpc/pricing/)
- [S3 and S3 Vectors](https://aws.amazon.com/s3/pricing/),
  [CloudFront](https://aws.amazon.com/cloudfront/pricing/),
  [API Gateway](https://aws.amazon.com/api-gateway/pricing/),
  [Cloud Map](https://aws.amazon.com/cloud-map/pricing/),
  [Route 53](https://aws.amazon.com/route53/pricing/)
- [Bedrock](https://aws.amazon.com/bedrock/pricing/),
  [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/),
  [EventBridge](https://aws.amazon.com/eventbridge/pricing/),
  [SQS](https://aws.amazon.com/sqs/pricing/),
  [Mapbox](https://www.mapbox.com/pricing)
