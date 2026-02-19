# Instrument Distributed Tracing — Extended Examples

Complete configuration files and code templates.


## Step 1: Set Up Tracing Backend

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


## Step 2: Instrument Applications (Auto-Instrumentation)

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


## Step 3: Add Manual Instrumentation

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


## Step 4: Implement Context Propagation

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


## Step 5: Configure Sampling Strategies

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


## Step 6: Correlate Traces with Metrics and Logs

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

