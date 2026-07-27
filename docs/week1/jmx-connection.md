# Week 1 - JMX Connection Module

## Overview

The objective of this module is to establish a connection with a JVM using Java Management Extensions (JMX) and expose JVM monitoring data through REST APIs.

This module allows HeapVortex to monitor both its own JVM and any external JVM that has JMX enabled.

---

# Technologies Used

- Java 21
- Spring Boot
- JMX (Java Management Extensions)
- MXBeans
- REST APIs

---

# Architecture

                +----------------------+
                |   HeapVortex Backend |
                +----------+-----------+
                           |
                           | JMX Connection
                           |
                +----------v-----------+
                |  Target JVM Process  |
                +----------------------+

HeapVortex acts as a JMX client.

The target JVM exposes JVM metrics through MXBeans.

HeapVortex retrieves those metrics and exposes them through REST APIs.

---

# Implemented MXBeans

1. MemoryMXBean
2. RuntimeMXBean
3. ThreadMXBean
4. OperatingSystemMXBean
5. ClassLoadingMXBean
6. GarbageCollectorMXBean
7. MemoryPoolMXBean

---

# REST APIs

## 1. Connect to a JVM

POST

/api/jvm/connect

### Request

```json
{
    "host": "localhost",
    "port": 9010
}
```

### Description

Creates a JMX connection with the specified JVM.

If another connection already exists, it is closed before creating the new connection.

---

## 2. Heap Metrics

GET

/api/jvm/heap

Returns

```json
{
    "heapUsed": 0,
    "heapCommitted": 0,
    "heapMax": 0
}
```

---

## 3. Runtime Metrics

GET

/api/jvm/runtime

Returns

```json
{
    "jvmName": "...",
    "upTime": 0,
    "startTime": 0
}
```

---

## 4. Thread Metrics

GET

/api/jvm/threads

Returns

```json
{
    "threadCount": 0,
    "peakThreadCount": 0,
    "daemonThreadCount": 0
}
```

---

## 5. Operating System Metrics

GET

/api/jvm/os

Returns

```json
{
    "name": "...",
    "version": "...",
    "arch": "...",
    "availableProcessors": 0,
    "systemLoadAverage": 0
}
```

---

## 6. Class Loading Metrics

GET

/api/jvm/classloading

Returns

```json
{
    "loadedClassCount": 0,
    "totalLoadedClassCount": 0,
    "unloadedClassCount": 0
}
```

---

## 7. Garbage Collector Metrics

GET

/api/jvm/gc

Returns

```json
[
    {
        "name": "...",
        "collectionCount": 0,
        "collectionTime": 0
    }
]
```

---

## 8. Memory Pool Metrics

GET

/api/jvm/memory-pools

Returns

```json
[
    {
        "name": "...",
        "type": "...",
        "used": 0,
        "committed": 0,
        "max": 0
    }
]
```

---

# Configuration

application.properties

```properties
jmx.host=localhost
jmx.port=9999
```

These values represent the default JVM connection.

They can be changed dynamically using the Connect API.

---

# Dynamic JVM Switching

HeapVortex supports switching between multiple JVMs without restarting the application.

Example

```http
POST /api/jvm/connect
```

Body

```json
{
    "host": "localhost",
    "port": 9010
}
```

The service will

- Close the previous connection
- Create a new JMX connection
- Store the new MBeanServerConnection
- Use the new connection for all subsequent API calls

---

# Testing

## Test 1

Run HeapVortex with JMX enabled.

Verify

```
GET /api/jvm/runtime
```

returns the HeapVortex JVM information.

---

## Test 2

Create another Java application.

Example

```java
public class Main {

    public static void main(String[] args) throws Exception {

        while(true){
            Thread.sleep(5000);
        }

    }

}
```

Run the application with VM options

```
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false
-Dcom.sun.management.jmxremote.local.only=false
```

---

Connect

```http
POST /api/jvm/connect
```

```json
{
    "host":"localhost",
    "port":9010
}
```

Verify

```
GET /api/jvm/runtime
```

returns the Demo Application JVM instead of HeapVortex.

---

# Connection Validation

Before every metric request,

HeapVortex

- Checks whether the current connection is alive.
- Reconnects automatically if the connection is unavailable.

---

## Folder Structure

```text
backend/
├── controller/
│   └── JvmController.java
├── dto/
│   ├── JmxConnectionRequest.java
│   ├── JvmHeapMetrics.java
│   ├── JvmRuntimeMetrics.java
│   ├── JvmThreadMetrics.java
│   ├── JvmOperatingSystemMetrics.java
│   ├── JvmClassLoadingMetrics.java
│   ├── JvmGarbageCollectorMetrics.java
│   └── JvmMemoryPoolMetrics.java
├── jmx/
│   └── JmxConnectionService.java
├── config/
├── exception/
├── model/
├── service/
├── util/
└── BackendApplication.java
```

---

# Week 1 Deliverables

✅ JMX Connection

✅ Dynamic JVM Switching

✅ Heap Monitoring

✅ Runtime Monitoring

✅ Thread Monitoring

✅ Operating System Monitoring

✅ Class Loading Monitoring

✅ Garbage Collector Monitoring

✅ Memory Pool Monitoring

✅ REST APIs

---

# Future Work

Week 2

- JVM Process Discovery
- Java Agent Integration
- Live JVM Monitoring
