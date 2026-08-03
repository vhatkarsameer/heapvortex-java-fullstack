# 🌀 HeapVortex
**Advanced JVM Telemetry, Secure JMX Monitoring, and 3D WebGL Heap Dump Visualizer**

---

## 📖 Project Overview
**HeapVortex** is a full-stack profiling, diagnostic, and visualization application built to analyze live Java Virtual Machines (JVMs) and inspect heavy binary Java Heap Dumps (`.hprof`).

It bridges the gap between static memory analysis and highly interactive 3D WebGL graphics. With HeapVortex, engineers can monitor memory pools, trace garbage collection overhead, detect memory leaks, and visually explore thousands of allocated objects and reference chains in real-time.

---

## 🌟 Core Features

1. **Live Secure JMX Telemetry Monitoring**
   - Connects to remote target JVMs using **JMX over SSL/TLS** (PKCS12 keystores/truststores).
   - Real-time streaming of Memory Pools, Heap vs. Non-Heap usage, Garbage Collection counts, Thread metrics, and Class Loading stats via WebSockets (`/ws`).

2. **Headless Heap Dump Parsing (Eclipse MAT Engine)**
   - Integrates with the **Eclipse Memory Analyzer Tool (MAT)** CLI execution engine (`ParseHeapDump.sh`).
   - Programmatically executes Object Query Language (OQL) statements against uploaded `.hprof` files to extract class statistics, incoming references, outgoing references, and GC root paths.

3. **High-Performance 3D WebGL Visualization**
   - Built with **React, Three.js, and WebGL**.
   - Features a **Two-Hook Architecture** coupled with `THREE.InstancedMesh` and low-poly `IcosahedronGeometry` to render and auto-rotate **10,000+ JVM objects at a continuous 60 FPS**.
   - Fully interactive canvas: supports smooth orbit controls, zooming, raycasting for object click selection, and layout-isolated inspector panels.

4. **Volume Stress-Testing Engine (Data Extrapolation)**
   - Includes a **Continuous Memory Extrapolation Engine** inside `MatHeapParser.java`.
   - Scales MAT's OQL sample data up to 10,000+ objects with sequential, logically incremented memory addresses and shallow sizes, enabling high-volume WebGL stress-testing for audits and performance benchmarks.

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Language & Framework:** Java 22 (Preview features enabled), Spring Boot 3.5.x
- **Communication:** WebSockets (STOMP broker), REST API
- **Memory Analysis:** Eclipse MAT Core API (`org.eclipse.mat.api`), Apache Commons CSV
- **Security:** JMX with SSL/TLS (PKCS12)

### Frontend
- **Framework & Language:** React, TypeScript, Vite
- **3D Graphics Engine:** Three.js (`OrbitControls`, `Raycaster`, `InstancedMesh`)
- **Icons & Styling:** Lucide-React, CSS Grid Layouts

---

## ⚙️ Prerequisites

Before running HeapVortex, ensure the following are installed:
- **JDK 22** or higher (configured in your system path).
- **Node.js** (v18+) and **npm**.
- **Eclipse Memory Analyzer Tool (MAT):** Installed locally on your machine.
  - *Mac Default Path:* `/Applications/MemoryAnalyzer.app/Contents/Eclipse/ParseHeapDump.sh`
  - *Linux/Windows:* Path to your local `ParseHeapDump.sh` or `ParseHeapDump.bat`.

---

## 🚀 Setup & Execution Guide

### Step 1: Running the Target Application (Monitored JVM)

To demonstrate live telemetry and memory leaks, run a target Java app with JMX enabled over SSL (running on port `9010`).

#### Target Java Code (`Main.java`):
```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) throws InterruptedException {
        List<byte[]> memoryLeakList = new ArrayList<>();
        System.out.println("JMX Demo App Started with Memory Leak...");

        // Background thread simulating a memory leak (1 MB added every second)
        Thread leakThread = new Thread(() -> {
            try {
                while (true) {
                    memoryLeakList.add(new byte[1048576]);
                    Thread.sleep(1000);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        leakThread.start();

        while (true) {
            System.out.println("Application running... Current Leaked MB: " + memoryLeakList.size());
            Thread.sleep(5000);
        }
    }
}
```

#### Target JVM Arguments(Port 9010 with SSL)
````Properties
-Dcom.sun.management.jmxremote.port=9010
-Dcom.sun.management.jmxremote.rmi.port=9010
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=true
-Dcom.sun.management.jmxremote.registry.ssl=true
-Dcom.sun.management.jmxremote.ssl.need.client.auth=false
-Djavax.net.ssl.keyStoreType=PKCS12
-Djavax.net.ssl.trustStoreType=PKCS12
-Djavax.net.ssl.keyStore=/Users/sameervhatkar/Study/Projects/HeapVortex/server-keystore.jks
-Djavax.net.ssl.keyStorePassword=changeit
-Djavax.net.ssl.trustStore=/Users/sameervhatkar/Study/Projects/HeapVortex/client-truststore.jks
-Djavax.net.ssl.trustStorePassword=changeit
````

### Step 2: Configuring & Running the HeapVortex Backend
#### A. Configure application.properties
Located in backend/src/main/resources/application.properties:
````
spring.application.name=backend

# Default JMX Connection Settings
jmx.host=localhost
jmx.port=9999

# Directory where uploaded and generated .hprof dumps are stored
heap.upload.directory=uploads

# Local Path to Eclipse MAT executable CLI script
mat.command=/Applications/MemoryAnalyzer.app/Contents/Eclipse/ParseHeapDump.sh

spring.main.allow-bean-definition-overriding=true
spring.servlet.multipart.max-file-size=1000MB
spring.servlet.multipart.max-request-size=1000MB
````
#### B. HeapVortex Backend VM Options
When launching the backend Spring Boot app, provide these VM options to enable SSL JMX communication and open reflective module access for Eclipse MAT dependencies: at the end also add this at end "--add-opens java.base/java.lang=ALL-UNNAMED
--add-opens java.base/java.lang.reflect=ALL-UNNAMED
--add-opens java.base/java.util=ALL-UNNAMED
--add-opens java.base/java.io=ALL-UNNAMED"

````Properties
-Dcom.sun.management.jmxremote.port=9999
-Dcom.sun.management.jmxremote.rmi.port=9999
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=true
-Dcom.sun.management.jmxremote.registry.ssl=true
-Dcom.sun.management.jmxremote.ssl.need.client.auth=false
-Djavax.net.ssl.keyStoreType=PKCS12
-Djavax.net.ssl.keyStore=/Users/sameervhatkar/Study/Projects/HeapVortex/server-keystore.jks
-Djavax.net.ssl.keyStorePassword=changeit
-Djavax.net.ssl.trustStoreType=PKCS12
-Djavax.net.ssl.trustStore=/Users/sameervhatkar/Study/Projects/HeapVortex/client-truststore.jks
-Djavax.net.ssl.trustStorePassword=changeit

````

#### C. Run the Backend

````bash
cd backend
./mvnw clean compile spring-boot:run
````

### Step 3: Running the Frontend
Open a new terminal window
````bash
cd HeapVortex-frontend
npm install
npm run dev
````
Navigate to http://localhost:5173 in your browser.

# 📂 Heap Dump Storage & Data Lifecycle
1. **Upload / Remote Generation**: When an .hprof heap dump is uploaded or remotely dumped via JMX, it is saved directly into the backend/uploads/ directory (e.g., uploads/self_jvm_dump_xxxx.hprof).

2. **Parsing Phase**: MatHeapParser.java triggers Eclipse MAT CLI commands (ParseHeapDump.sh) against the dump file inside uploads/.

3. **CSV Generation**: MAT writes analytical report folders and .csv files inside uploads/.

4. **Data Transformation**: The backend parses the generated CSV records, maps them to HeapObject DTOs, applies memory extrapolation if necessary, and returns clean JSON payloads to the React UI.

# 📡 API Reference & Controller Mapping
## 1. JvmController (/api/jvm)
Handles JMX lifecycle operations and remote diagnostic commands.
- **POST /api/jvm/connect** : Establishes a secure JMX connection to a target JVM using specified host, port, and SSL parameters.

- **POST /api/jvm/disconnect** : Disconnects the active JMX connection safely.

- **POST /api/jvm/dump** : Invokes HotSpotDiagnosticMXBean to trigger an immediate .hprof binary dump on the target server.

## 2. HeapController (/api/heap)
Controls .hprof heap dump uploads and Eclipse MAT analytical queries.

- **POST /api/heap/upload** : Accepts multipart .hprof file uploads and saves them to uploads/.

- **GET /api/heap/parse** : Runs MAT's histogram engine to retrieve overall HeapStatistics and class tallies.

- **GET /api/heap/objects-by-class** : Returns a dataset (up to 10,000+ objects) for a given class name to populate the 3D visualizer.

- **GET /api/heap/incoming-references** : Queries OQL inbounds(s) to determine which objects hold references to a target memory address.

- **GET /api/heap/outgoing-references** : Queries OQL outbounds(s) to determine which field references an object holds.

- **GET /api/heap/gc-roots** : Traces the shortest reference chain path from a target object back to a Garbage Collection (GC) Root.

## 3. MemoryTelemetryController & WebSockets (/api/telemetry & /ws)
Pushes continuous live telemetry metrics.

- **GET /api/telemetry/current** : Fetches a static MemoryTelemetryDTO snapshot containing Heap/Non-Heap memory pools, thread states, GC collections, and loaded class metrics.

- **WebSocket (/ws)** : Frontend STOMP client subscribes to /topic/telemetry. A background scheduler broadcasts updated telemetry JSON payloads every 1000ms.

# 🛠️ Maven Configuration (pom.xml)
````XML
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="[http://maven.apache.org/POM/4.0.0](http://maven.apache.org/POM/4.0.0)" xmlns:xsi="[http://www.w3.org/2001/XMLSchema-instance](http://www.w3.org/2001/XMLSchema-instance)"
    xsi:schemaLocation="[http://maven.apache.org/POM/4.0.0](http://maven.apache.org/POM/4.0.0) [https://maven.apache.org/xsd/maven-4.0.0.xsd](https://maven.apache.org/xsd/maven-4.0.0.xsd)">
    <modelVersion>4.0.0</modelVersion>
    <parent>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-parent</artifactId>
       <version>3.5.16</version>
       <relativePath/>
    </parent>
    <groupId>com.heapvortex</groupId>
    <artifactId>backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>backend</name>
    <description>HeapVortex Backend Analysis Engine</description>

    <properties>
       <java.version>22</java.version>
    </properties>

    <repositories>
       <repository>
          <id>eclipse-maven-repo</id>
          <name>Eclipse Repository</name>
          <url>[https://repo.eclipse.org/content/groups/releases/](https://repo.eclipse.org/content/groups/releases/)</url>
       </repository>
    </repositories>

    <dependencies>
       <dependency>
          <groupId>org.apache.commons</groupId>
          <artifactId>commons-csv</artifactId>
          <version>1.14.1</version>
       </dependency>

       <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-web</artifactId>
       </dependency>

       <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-devtools</artifactId>
          <scope>runtime</scope>
          <optional>true</optional>
       </dependency>
       
       <dependency>
          <groupId>org.projectlombok</groupId>
          <artifactId>lombok</artifactId>
          <optional>true</optional>
       </dependency>
       
       <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-test</artifactId>
          <scope>test</scope>
       </dependency>

       <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-websocket</artifactId>
          <version>3.5.16</version>
          <scope>compile</scope>
       </dependency>

       <dependency>
          <groupId>org.eclipse.mat</groupId>
          <artifactId>org.eclipse.mat.api</artifactId>
          <version>1.17.0</version>
       </dependency>
       
       <dependency>
          <groupId>org.eclipse.mat</groupId>
          <artifactId>org.eclipse.mat.parser</artifactId>
          <version>1.17.0</version>
       </dependency>

       <dependency>
          <groupId>org.eclipse.mat</groupId>
          <artifactId>org.eclipse.mat.report</artifactId>
          <version>1.17.0</version>
       </dependency>

       <dependency>
          <groupId>org.eclipse.platform</groupId>
          <artifactId>org.eclipse.core.runtime</artifactId>
          <version>3.29.0</version>
       </dependency>

       <dependency>
          <groupId>org.eclipse.platform</groupId>
          <artifactId>org.eclipse.equinox.common</artifactId>
          <version>3.17.0</version>
       </dependency>

       <dependency>
          <groupId>org.eclipse.platform</groupId>
          <artifactId>org.eclipse.equinox.registry</artifactId>
          <version>3.11.200</version>
       </dependency>
    </dependencies>

    <build>
       <plugins>
          <plugin>
             <groupId>org.springframework.boot</groupId>
             <artifactId>spring-boot-maven-plugin</artifactId>
             <configuration>
                <excludes>
                   <exclude>
                      <groupId>org.projectlombok</groupId>
                      <artifactId>lombok</artifactId>
                   </exclude>
                </excludes>
             </configuration>
          </plugin>
          <plugin>
             <groupId>org.apache.maven.plugins</groupId>
             <artifactId>maven-compiler-plugin</artifactId>
             <configuration>
                 <source>22</source>
                 <target>22</target>
                 <compilerArgs>--enable-preview</compilerArgs>
             </configuration>
          </plugin>
       </plugins>
    </build>
</project>
````

# 📌 Architectural Notes & FAQ for Reviewers
**Q: Why use MAT Headless CLI instead of direct SnapshotFactory.openSnapshot in Java?**

A: Eclipse MAT is built on OSGi (Eclipse Equinox). Invoking SnapshotFactory.openSnapshot() inside a standalone Spring Boot JAR causes a NullPointerException on Platform.getExtensionRegistry() because Spring Boot is not an OSGi container. Executing MAT via headless CLI ensures complete OSGi isolation while preserving full OQL query analytical power.

**Q: How does the 3D Visualizer achieve high FPS with 10,000+ objects?**

A: Standard Three.js Mesh creations instantiate separate GPU draw calls for each sphere. HeapVortex uses THREE.InstancedMesh with a low-poly IcosahedronGeometry(1, 1), sending all 10,000 transformation matrices to the GPU in a single draw call. It also separates the 3D engine lifecycle into a single-mount React hook, ensuring that incoming data updates never trigger scene re-mounts or layout thrashing.

## 🚧 Pending Work & Ongoing Development

We are actively refining HeapVortex and working toward resolving the following key items:

1. **Containerization (Dockerization)**
   - Full containerization using Docker (bundling Spring Boot, Node/Vite, and Eclipse MAT dependencies into unified containers) is currently incomplete and scheduled for complete integration soon.

---