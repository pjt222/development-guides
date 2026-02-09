---
name: instrument-distributed-tracing
description: >
  Instrument applications with OpenTelemetry for distributed tracing, including auto and manual
  instrumentation, context propagation, sampling strategies, and integration with Jaeger or Tempo.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: observability
  complexity: advanced
  language: multi
  tags: opentelemetry, tracing, jaeger, tempo, instrumentation
---

# Instrument Distributed Tracing

Implement OpenTelemetry distributed tracing to track requests across microservices and identify performance bottlenecks.

## When to Use

- Debugging latency issues in distributed systems with multiple services
- Understanding request flow and dependencies between microservices
- Identifying slow database queries or external API calls within a transaction
- Correlating traces with logs and metrics for root cause analysis
- Measuring end-to-end latency from user request to response
- Migrating from legacy tracing systems (Zipkin, Jaeger) to OpenTelemetry
- Establishing SLO compliance through detailed latency percentile tracking

## Inputs

- **Required**: List of services to instrument (languages and frameworks)
- **Required**: Tracing backend choice (Jaeger, Tempo, Zipkin, or vendor SaaS)
- **Optional**: Existing instrumentation libraries (OpenTracing, Zipkin)
- **Optional**: Sampling strategy requirements (percentage, rate limiting)
- **Optional**: Custom span attributes for business-specific metadata

## Procedure

### Step 1: Set Up Tracing Backend

Deploy Jaeger or Grafana Tempo to receive and store traces.

**Option A: Jaeger all-in-one** (development/testing):

```yaml
# docker-compose.yml
version: '3.8'
services:
  jaeger:
    image: jaegertracing/all-in-one:1.51
    ports:
      - "5775:5775/udp"   # Zipkin compact thrift
      - "6831:6831/udp"   # Jaeger compact thrift
      - "6832:6832/udp"   # Jaeger binary thrift
      - "5778:5778"       # Serve configs
      - "16686:16686"     # Jaeger UI
      - "14268:14268"     # Jaeger HTTP thrift
      - "14250:14250"     # Jaeger GRPC
      - "9411:9411"       # Zipkin compatible endpoint
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - COLLECTOR_OTLP_ENABLED=true
    restart: unless-stopped
```

**Option B: Grafana Tempo** (production, scalable):

```yaml
# docker-compose.yml
version: '3.8'
services:
  tempo:
    image: grafana/tempo:2.3.0
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./tempo.yaml:/etc/tempo.yaml
      - tempo-data:/tmp/tempo
    ports:
      - "3200:3200"   # Tempo HTTP
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "9411:9411"   # Zipkin
    restart: unless-stopped

volumes:
  tempo-data:
```

**Tempo configuration** (`tempo.yaml`):

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    jaeger:
      protocols:
        thrift_http:
          endpoint: 0.0.0.0:14268
        grpc:
          endpoint: 0.0.0.0:14250
    zipkin:
      endpoint: 0.0.0.0:9411
    otlp:
      protocols:
        http:
          endpoint: 0.0.0.0:4318
        grpc:
          endpoint: 0.0.0.0:4317

ingester:
  max_block_duration: 5m

compactor:
  compaction:
    block_retention: 168h  # 7 days

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo/blocks
    wal:
      path: /tmp/tempo/wal

query_frontend:
  search:
    duration_slo: 5s
    throughput_bytes_slo: 1.073741824e+09
  trace_by_id:
    duration_slo: 5s
```

For **production with S3 storage**:

```yaml
storage:
  trace:
    backend: s3
    s3:
      bucket: tempo-traces
      endpoint: s3.amazonaws.com
      region: us-east-1
    wal:
      path: /tmp/tempo/wal
    pool:
      max_workers: 100
      queue_depth: 10000
```

**Expected:** Tracing backend accessible, ready to receive traces via OTLP, Jaeger UI or Grafana shows "no traces" initially.

**On failure:**
- Verify ports not already in use: `netstat -tulpn | grep -E '(4317|16686|3200)'`
- Check container logs: `docker logs jaeger` or `docker logs tempo`
- Test OTLP endpoint: `curl http://localhost:4318/v1/traces -v`
- For Tempo: validate config syntax with `tempo -config.file=/etc/tempo.yaml -verify-config`

### Step 2: Instrument Applications (Auto-Instrumentation)

Use OpenTelemetry auto-instrumentation for common frameworks to minimize code changes.

**Python with Flask**:

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install
```

```python
# app.py
from flask import Flask
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Configure resource with service name
resource = Resource(attributes={
    SERVICE_NAME: "user-service",
    "environment": "production",
    "version": "1.2.3"
})

# Set up tracer provider
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://tempo:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Auto-instrument Flask and requests library
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()

@app.route('/users/<user_id>')
def get_user(user_id):
    # This route is automatically traced
    return {"user_id": user_id, "name": "John Doe"}

if __name__ == '__main__':
    app.run()
```

**Go with Gin framework**:

```bash
go get go.opentelemetry.io/otel
go get go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc
go get go.opentelemetry.io/otel/sdk/trace
go get go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin
```

```go
package main

import (
    "context"
    "github.com/gin-gonic/gin"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
    "go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func initTracer() (*sdktrace.TracerProvider, error) {
    ctx := context.Background()

    // Create OTLP exporter
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("tempo:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    // Create resource with service information
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceName("order-service"),
            semconv.ServiceVersion("2.1.0"),
            semconv.DeploymentEnvironment("production"),
        ),
    )
    if err != nil {
        return nil, err
    }

    // Create tracer provider with batch span processor
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithSampler(sdktrace.AlwaysSample()),
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
    )

    otel.SetTracerProvider(tp)
    return tp, nil
}

func main() {
    tp, err := initTracer()
    if err != nil {
        panic(err)
    }
    defer tp.Shutdown(context.Background())

    router := gin.Default()
    // Auto-instrument Gin routes
    router.Use(otelgin.Middleware("order-service"))

    router.GET("/orders/:id", func(c *gin.Context) {
        c.JSON(200, gin.H{"order_id": c.Param("id")})
    })

    router.Run(":8080")
}
```

**Node.js with Express**:

```bash
npm install @opentelemetry/api \
            @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-grpc
```

```javascript
// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'payment-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://tempo:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

// app.js
require('./tracing');
const express = require('express');
const app = express();

app.get('/charge', (req, res) => {
  // Automatically traced
  res.json({ status: 'charged' });
});

app.listen(8080);
```

**Expected:** Traces from instrumented services appear in Jaeger UI or Grafana, HTTP requests automatically create spans.

**On failure:**
- Check exporter endpoint is reachable from application
- Verify environment variables: `OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317`
- Enable debug logging: `OTEL_LOG_LEVEL=debug` (Python), `OTEL_LOG_LEVEL=DEBUG` (Node.js)
- Test with simple span: manually create a span to verify export pipeline
- Check for version conflicts between OpenTelemetry packages

### Step 3: Add Manual Instrumentation

Create custom spans for business logic, database queries, and external calls.

**Python manual spans**:

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

def process_order(order_id):
    # Create a span for the entire operation
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)
        span.set_attribute("order.priority", "high")

        # Nested span for database query
        with tracer.start_as_current_span("db.query.select_order") as db_span:
            db_span.set_attribute("db.system", "postgresql")
            db_span.set_attribute("db.statement", "SELECT * FROM orders WHERE id = $1")
            order = db.query(f"SELECT * FROM orders WHERE id = {order_id}")
            db_span.set_attribute("db.rows_returned", len(order))

        # Span for inventory check
        with tracer.start_as_current_span("check_inventory") as inv_span:
            inv_span.set_attribute("product.id", order['product_id'])
            available = check_inventory(order['product_id'])
            inv_span.set_attribute("inventory.available", available)

            if not available:
                inv_span.add_event("inventory_unavailable", {
                    "product_id": order['product_id'],
                    "requested_quantity": order['quantity']
                })
                inv_span.set_status(trace.Status(trace.StatusCode.ERROR, "Out of stock"))
                raise Exception("Out of stock")

        # Span for payment processing
        with tracer.start_as_current_span("process_payment") as pay_span:
            pay_span.set_attribute("payment.amount", order['total'])
            pay_span.set_attribute("payment.method", "credit_card")
            payment_result = charge_card(order['total'])
            pay_span.set_attribute("payment.transaction_id", payment_result['transaction_id'])

        span.set_status(trace.Status(trace.StatusCode.OK))
        return {"status": "completed", "order_id": order_id}
```

**Go manual spans**:

```go
import (
    "context"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

func ProcessOrder(ctx context.Context, orderID string) error {
    tracer := otel.Tracer("order-service")

    // Start parent span
    ctx, span := tracer.Start(ctx, "process_order",
        trace.WithAttributes(
            attribute.String("order.id", orderID),
        ),
    )
    defer span.End()

    // Database query span
    ctx, dbSpan := tracer.Start(ctx, "db.query.select_order",
        trace.WithAttributes(
            attribute.String("db.system", "postgresql"),
            attribute.String("db.statement", "SELECT * FROM orders WHERE id = $1"),
        ),
    )
    order, err := db.QueryOrder(ctx, orderID)
    dbSpan.SetAttributes(attribute.Int("db.rows_returned", 1))
    dbSpan.End()
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "failed to query order")
        return err
    }

    // Inventory check span
    ctx, invSpan := tracer.Start(ctx, "check_inventory",
        trace.WithAttributes(
            attribute.String("product.id", order.ProductID),
        ),
    )
    available, err := CheckInventory(ctx, order.ProductID)
    invSpan.SetAttributes(attribute.Bool("inventory.available", available))
    if !available {
        invSpan.AddEvent("inventory_unavailable", trace.WithAttributes(
            attribute.String("product_id", order.ProductID),
            attribute.Int("requested_quantity", order.Quantity),
        ))
        invSpan.SetStatus(codes.Error, "out of stock")
    }
    invSpan.End()
    if !available {
        return fmt.Errorf("out of stock")
    }

    // Payment processing span
    ctx, paySpan := tracer.Start(ctx, "process_payment",
        trace.WithAttributes(
            attribute.Float64("payment.amount", order.Total),
            attribute.String("payment.method", "credit_card"),
        ),
    )
    txnID, err := ChargeCard(ctx, order.Total)
    paySpan.SetAttributes(attribute.String("payment.transaction_id", txnID))
    paySpan.End()
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "payment failed")
        return err
    }

    span.SetStatus(codes.Ok, "order processed successfully")
    return nil
}
```

**Span attributes best practices**:
- Use semantic conventions: `http.method`, `http.status_code`, `db.system`, `db.statement`
- Add business context: `user.id`, `order.id`, `product.category`
- Include resource identifiers: `instance.id`, `region`, `availability_zone`
- Record errors: `span.RecordError(err)` and `span.SetStatus(codes.Error, message)`
- Add events for significant milestones: `span.AddEvent("cache_miss")`

**Expected:** Custom spans appear in trace view, parent-child relationships correct, attributes visible in span details, errors highlighted.

**On failure:**
- Verify context propagation: parent span context passed to child
- Check span names are descriptive and follow naming conventions
- Ensure spans are ended (use `defer span.End()` in Go, `with` blocks in Python)
- Review attribute types: strings, ints, bools, floats only
- Validate semantic conventions: use standard attribute names where applicable

### Step 4: Implement Context Propagation

Ensure trace context flows across service boundaries and async operations.

**HTTP headers propagation** (W3C Trace Context):

```python
# Client side (Python with requests)
import requests
from opentelemetry import trace
from opentelemetry.propagate import inject

tracer = trace.get_tracer(__name__)

def call_downstream_service():
    with tracer.start_as_current_span("call_order_service"):
        headers = {}
        inject(headers)  # Injects traceparent and tracestate headers

        response = requests.get(
            "http://order-service:8080/orders/123",
            headers=headers
        )
        return response.json()
```

```go
// Server side (Go with Gin)
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/propagation"
)

func handleRequest(c *gin.Context) {
    ctx := otel.GetTextMapPropagator().Extract(
        c.Request.Context(),
        propagation.HeaderCarrier(c.Request.Header),
    )

    tracer := otel.Tracer("order-service")
    ctx, span := tracer.Start(ctx, "handle_order_request")
    defer span.End()

    // Use ctx for downstream calls
    result := processOrder(ctx, c.Param("id"))
    c.JSON(200, result)
}
```

**Message queue propagation** (Kafka):

```python
# Producer
from opentelemetry.propagate import inject
from kafka import KafkaProducer

producer = KafkaProducer(bootstrap_servers=['kafka:9092'])

def publish_event(order_id):
    with tracer.start_as_current_span("publish_order_event") as span:
        headers = {}
        inject(headers)  # Inject trace context

        # Convert headers to Kafka format
        kafka_headers = [(k, v.encode('utf-8')) for k, v in headers.items()]

        producer.send(
            'orders',
            value=f'{{"order_id": "{order_id}"}}'.encode('utf-8'),
            headers=kafka_headers
        )
```

```python
# Consumer
from opentelemetry.propagate import extract

def process_message(msg):
    # Extract trace context from Kafka headers
    headers = {k: v.decode('utf-8') for k, v in msg.headers}
    ctx = extract(headers)

    # Continue the trace
    with tracer.start_as_current_span("process_order_event", context=ctx):
        order_id = json.loads(msg.value)['order_id']
        handle_order(order_id)
```

**Async operations** (Python asyncio):

```python
import asyncio
from opentelemetry import trace, context

async def async_operation():
    # Capture current context
    token = context.attach(context.get_current())
    try:
        with tracer.start_as_current_span("async_database_query"):
            await asyncio.sleep(0.1)  # Simulated async work
            return "result"
    finally:
        context.detach(token)
```

**Expected:** Traces span multiple services, trace IDs consistent across service boundaries, parent-child relationships preserved.

**On failure:**
- Verify W3C Trace Context propagator configured: `otel.propagation.set_global_textmap(TraceContextTextMapPropagator())`
- Check headers are passed in HTTP requests
- For Kafka: ensure headers supported by broker version (v0.11+)
- Debug with header inspection: log `traceparent` header value
- Use trace visualization to identify broken trace links

### Step 5: Configure Sampling Strategies

Implement sampling to reduce trace volume and cost while maintaining visibility.

**Sampling strategies**:

```python
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.sampling import (
    ParentBased,
    TraceIdRatioBased,
    StaticSampler,
    Decision
)

# Option 1: Ratio-based sampling (sample 10% of traces)
sampler = ParentBased(root=TraceIdRatioBased(0.1))

# Option 2: Always sample errors, ratio for success
from opentelemetry.sdk.trace.sampling import Sampler, SamplingResult

class ErrorAwareSampler(Sampler):
    def __init__(self, ratio=0.1):
        self.ratio_sampler = TraceIdRatioBased(ratio)

    def should_sample(self, parent_context, trace_id, name, kind, attributes, links, trace_state):
        # Always sample if error status
        if attributes and attributes.get("error") == True:
            return SamplingResult(
                decision=Decision.RECORD_AND_SAMPLE,
                attributes=attributes,
                trace_state=trace_state
            )
        # Otherwise use ratio sampling
        return self.ratio_sampler.should_sample(
            parent_context, trace_id, name, kind, attributes, links, trace_state
        )

sampler = ParentBased(root=ErrorAwareSampler(0.1))

# Option 3: Rate limiting sampler (max traces per second)
from opentelemetry.sdk.trace.sampling import RateLimitingSampler
sampler = RateLimitingSampler(max_traces_per_second=100)

# Apply sampler to tracer provider
provider = TracerProvider(sampler=sampler)
```

**Tail-based sampling with Tempo**:

Configure in `tempo.yaml`:

```yaml
overrides:
  defaults:
    metrics_generator:
      processors: [service-graphs, span-metrics]
      storage:
        path: /tmp/tempo/generator/wal
        remote_write:
          - url: http://prometheus:9090/api/v1/write
            send_exemplars: true

    # Tail sampling (requires tempo-query)
    ingestion_rate_limit_bytes: 5000000
    ingestion_burst_size_bytes: 10000000
```

Use **Grafana Tempo's TraceQL** for dynamic sampling:

```traceql
# Sample traces with errors
{ status = error }

# Sample slow traces (>1s)
{ duration > 1s }

# Sample specific services
{ resource.service.name = "checkout-service" }
```

**Expected:** Trace volume reduced to target percentage, error traces always sampled, sampling decision visible in trace metadata.

**On failure:**
- Verify sampler applied before tracer provider initialization
- Check sampling decision attribute in exported spans
- For tail sampling: ensure sufficient buffering (`ingestion_burst_size_bytes`)
- Monitor dropped traces: `otel_traces_dropped_total` metric
- Test with synthetic high-volume traffic to validate sampling rate

### Step 6: Correlate Traces with Metrics and Logs

Link traces to metrics and logs for unified observability.

**Add trace IDs to logs** (Python):

```python
import logging
from opentelemetry import trace

# Custom log formatter with trace context
class TraceFormatter(logging.Formatter):
    def format(self, record):
        span = trace.get_current_span()
        if span.get_span_context().is_valid:
            trace_id = format(span.get_span_context().trace_id, "032x")
            span_id = format(span.get_span_context().span_id, "016x")
            record.trace_id = trace_id
            record.span_id = span_id
        else:
            record.trace_id = "0" * 32
            record.span_id = "0" * 16
        return super().format(record)

formatter = TraceFormatter(
    '%(asctime)s [%(levelname)s] trace_id=%(trace_id)s span_id=%(span_id)s %(message)s'
)
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(handler)
```

**Generate metrics from traces** (Tempo):

```yaml
# tempo.yaml
metrics_generator:
  registry:
    external_labels:
      cluster: production
  storage:
    path: /tmp/tempo/generator/wal
    remote_write:
      - url: http://prometheus:9090/api/v1/write
        send_exemplars: true
  processor:
    service_graphs:
      dimensions:
        - name: http.status_code
        - name: http.method
    span_metrics:
      dimensions:
        - name: http.status_code
        - name: http.method
      enable_target_info: true
```

This generates Prometheus metrics:
- `traces_service_graph_request_total` - request count between services
- `traces_span_metrics_duration_seconds` - span duration histogram
- `traces_spanmetrics_calls_total` - span call counts

**Query traces from metrics** (Grafana):

Add exemplar support to Prometheus datasource in Grafana:

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    jsonData:
      exemplarTraceIdDestinations:
        - name: trace_id
          datasourceName: Tempo
```

In Grafana dashboard, enable exemplars:

```json
{
  "fieldConfig": {
    "defaults": {
      "custom": {
        "showExemplars": true
      }
    }
  }
}
```

**Expected:** Clicking metric exemplars opens trace, logs show trace IDs, traces link to logs, unified debugging across signals.

**On failure:**
- Verify exemplar support enabled in Prometheus (requires v2.26+)
- Check trace ID format matches (32-char hex)
- Ensure metrics generator enabled in Tempo config
- Validate remote write endpoint accessible from Tempo
- Test exemplar queries: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) and on() exemplar`

## Validation

- [ ] Tracing backend receives spans from all instrumented services
- [ ] Traces show correct parent-child relationships across services
- [ ] Span attributes include semantic conventions and business context
- [ ] Context propagates correctly across HTTP calls and message queues
- [ ] Sampling strategy reduces trace volume to target percentage
- [ ] Error traces always sampled (if using error-aware sampling)
- [ ] Trace IDs appear in application logs with correct format
- [ ] Grafana shows traces linked from metrics via exemplars
- [ ] Log panels have data links to trace viewer
- [ ] Trace retention matches configured storage policy

## Common Pitfalls

- **Context not propagated**: Forgetting to pass `context` to downstream calls breaks traces. Always pass context explicitly.
- **Spans never ended**: Missing `defer span.End()` (Go) or `with` blocks (Python) causes spans to remain open and memory leaks.
- **Over-instrumentation**: Creating spans for every function causes trace bloat. Focus on service boundaries, database calls, and external APIs.
- **Missing error recording**: Not calling `span.RecordError()` loses valuable debugging information. Always record errors in spans.
- **High cardinality attributes**: Using unbounded values (user IDs, request bodies) as span attributes causes storage issues. Use sampling or aggregate labels.
- **Incorrect span kind**: Using wrong span kind (CLIENT vs SERVER vs INTERNAL) affects service graph generation. Follow semantic conventions.
- **Sampling before context**: Sampling decisions must respect parent trace context. Use `ParentBased` sampler to honor upstream sampling.

## Related Skills

- `correlate-observability-signals` - Unified debugging with metrics, logs, and traces linked by trace IDs
- `setup-prometheus-monitoring` - Generate metrics from traces using Tempo metrics generator
- `configure-log-aggregation` - Add trace IDs to logs for correlation with distributed traces
- `build-grafana-dashboards` - Visualize trace-derived metrics and exemplar links in dashboards
