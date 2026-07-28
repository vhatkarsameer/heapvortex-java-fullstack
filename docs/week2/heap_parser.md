# Week 2 – Heap Dump Parsing using Eclipse MAT

## Objective

The objective of this module is to parse Java Heap Dump (`.hprof`) files using Eclipse Memory Analyzer Tool (MAT) and expose useful heap statistics through REST APIs.

The current implementation focuses on extracting histogram information such as:

- Total Objects
- Total Classes
- Total Shallow Heap
- Per-class Object Count
- Per-class Shallow Heap

This module serves as the second phase of the HeapVortex backend.

---

# Architecture

```
Client
    │
    ▼
POST /api/heap/upload
    │
    ▼
HeapController
    │
    ▼
HeapParserService
    │
    ├── Validate uploaded file
    ├── Save .hprof file
    └── Invoke HeapParser
            │
            ▼
      MatHeapParser
            │
            ├── Execute Eclipse MAT
            ├── Generate Histogram CSV
            ├── Locate latest CSV report
            ├── Parse CSV
            ├── Build DTOs
            └── Return HeapStatistics
            │
            ▼
HeapUploadResponse
            │
            ▼
JSON Response
```

---

# Features Implemented

- Upload `.hprof` files through REST API
- Validate uploaded files
- Automatically create upload directory if missing
- Store uploaded heap dumps
- Integrate Eclipse MAT with Spring Boot
- Execute MAT using `ParseHeapDump.sh`
- Generate Histogram reports
- Parse Histogram CSV using Apache Commons CSV
- Compute heap statistics
- Return parsed data as JSON
- Global exception handling

---

# REST API

## Upload Heap Dump

**Endpoint**

```
POST /api/heap/upload
```

**Content-Type**

```
multipart/form-data
```

**Request Parameter**

```
file
```

---

# Project Structure

```
Controller
    └── HeapController

Service
    └── HeapParserService

Parser
    ├── HeapParser
    └── MatHeapParser

DTO
    ├── HeapStatistics
    ├── ClassStatistics
    └── HeapUploadResponse

Exception
    ├── InvalidHeapDumpException
    └── GlobalExceptionHandler
```

---

# Upload Workflow

When a heap dump is uploaded:

1. Validate the uploaded file.
2. Verify the file extension is `.hprof`.
3. Create the upload directory if it does not exist.
4. Save the uploaded file.
5. Invoke the heap parser.
6. Execute Eclipse MAT.
7. Generate a Histogram CSV.
8. Parse the generated CSV.
9. Build DTO objects.
10. Return JSON response.

---

# Eclipse MAT Integration

The project integrates Eclipse Memory Analyzer Tool (MAT) to analyze heap dumps.

The following integration work has been completed.

## 1. Install Eclipse MAT

Each developer must install Eclipse Memory Analyzer Tool (MAT) on their local machine.

The backend invokes MAT from the command line and therefore requires a local installation.

---

## 2. Configure ParseHeapDump.sh

Locate the MAT executable.

```
ParseHeapDump.sh
```

Configure its absolute path in:

```
application.properties
```

Example:

```properties
mat.command=/Applications/MemoryAnalyzer.app/Contents/Eclipse/ParseHeapDump.sh
```

---

## 3. Execute MAT from Spring Boot

The backend invokes MAT using Java's `ProcessBuilder`.

The executed command generates a Histogram report from the uploaded heap dump.

---

## 4. Locate Generated Report

MAT creates timestamp-based report directories.

Instead of relying on fixed filenames, the application automatically searches for the latest generated CSV report.

---

## 5. Parse MAT Output

The Histogram CSV is parsed using Apache Commons CSV.

Each record is converted into Java DTOs.

---

## 6. Expose Heap Information

The parsed information is returned through REST APIs as JSON.

---

# CSV Parsing

Apache Commons CSV is used for parsing.

Configuration:

- Read headers automatically
- Skip header record
- Allow missing column names

The last option is necessary because MAT generates a trailing comma in the CSV header.

---

# Statistics Computed

The parser computes:

## Total Object Count

Sum of all objects in the Histogram.

---

## Total Class Count

Number of classes present in the Histogram.

---

## Total Shallow Heap

Sum of shallow heap consumed by all classes.

---

## Class Statistics

For every class:

- Class Name
- Object Count
- Shallow Heap

The list is sorted in descending order of shallow heap.

---

# DTOs

## ClassStatistics

Represents a single Java class inside the heap.

Contains:

- className
- objectCount
- shallowHeap

---

## HeapStatistics

Contains overall heap statistics.

Contains:

- objectCount
- classCount
- totalShallowHeap
- classStatistics

---

## HeapUploadResponse

Returned to the client after successful parsing.

Contains:

- fileName
- fileSize
- heapStatistics
- message

---

# Exception Handling

The application handles the following exceptions.

## InvalidHeapDumpException

Returned when:

- File is empty
- Filename is missing
- Invalid extension

HTTP Status:

```
400 Bad Request
```

---

## IOException

Returned when:

- MAT execution fails
- CSV parsing fails
- Report generation fails

HTTP Status:

```
422 Unprocessable Entity
```

---

# Required Configuration

```properties
heap.upload.directory=uploads
mat.command=/absolute/path/to/ParseHeapDump.sh
```

---

# Project Setup

Every developer cloning this repository must complete the following setup.

## 1. Install Eclipse MAT

Download and install Eclipse Memory Analyzer Tool.

---

## 2. Configure MAT Path

Update the MAT executable path inside `application.properties`.

Example:

```properties
mat.command=/Applications/MemoryAnalyzer.app/Contents/Eclipse/ParseHeapDump.sh
```

---

## 3. Install Maven Dependencies

Run:

```bash
mvn clean install
```

This automatically downloads all required project dependencies.

---

## 4. Verify MAT Installation

Run:

```
ParseHeapDump.sh
```

If the command executes successfully, the MAT installation is complete.

---

# Current Workflow

At the current stage of development, the application expects an existing heap dump file.

Workflow:

```
Developer/User
      │
Select heapdump.hprof
      │
POST /api/heap/upload
      │
Spring Boot
      │
Store in uploads/
      │
Execute Eclipse MAT
      │
Parse Histogram
      │
Return JSON
```

---

# Future Workflow

Once the JMX module is integrated, manual heap dump creation will no longer be required.

The final workflow will be:

```
Target JVM
      │
      ▼
JMX Module
      │
Generate heapdump.hprof
      │
Store in uploads/
      │
Heap Parser
      │
Execute Eclipse MAT
      │
Parse Heap
      │
Return JSON
```

The JMX module will automatically generate the heap dump using Java Management Extensions (JMX), after which the Heap Parser module will analyze it without requiring any manual upload.

---

# Challenges Faced

## Absolute File Paths

Initially MAT could not locate uploaded heap dumps because relative paths were used.

Solution:

Always pass the absolute path of the uploaded `.hprof` file.

---

## Dynamic Report Names

MAT generates timestamped report folders.

Solution:

Automatically locate the latest generated CSV instead of hardcoding filenames.

---

## CSV Header Parsing

MAT generates an additional empty header column.

Solution:

Enable:

```
setAllowMissingColumnNames(true)
```

while configuring Apache Commons CSV.

---

# Libraries Used

- Spring Boot
- Apache Commons CSV
- Lombok
- Eclipse MAT (CLI via `ParseHeapDump.sh`)

---

# Current Limitations

The current implementation is based on MAT Histogram reports.

It currently provides:

- Total Objects
- Total Classes
- Total Shallow Heap
- Class Names
- Object Counts
- Shallow Heap

It does not yet provide:

- Object IDs
- Object References
- GC Roots
- Dominator Tree
- Retained Heap
- Memory Leak Paths

These capabilities will be implemented in future iterations using the Eclipse MAT Java APIs (`ISnapshot`, `IObject`, `IClass`, etc.) instead of the command-line histogram report.