FROM eclipse-temurin:22-jdk

WORKDIR /app

# Copy the Linux MAT folder you downloaded into the container
COPY mat /app/mat

# CREATE THE PURE JAVA HEADLESS SCRIPT
# This bypasses the native MemoryAnalyzer binary, GTK, and Rosetta emulation crashes.
# It also forces a healthy 4GB memory limit (-Xmx4g) so large heap dumps don't crash.
RUN echo '#!/bin/sh\njava -Xmx4g -jar /app/mat/plugins/org.eclipse.equinox.launcher_*.jar -consoleLog -application org.eclipse.mat.api.parse "$@"' > /app/mat/mat-headless.sh \
    && chmod +x /app/mat/mat-headless.sh

# Copy Spring Boot JAR
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

# Upload directory
RUN mkdir -p /app/uploads

EXPOSE 8080
EXPOSE 9999

# We add the two javax.net.ssl.trustStore flags pointing to the new /app/certs mapped folder
ENTRYPOINT ["java", "-Dcom.sun.management.jmxremote", "-Dcom.sun.management.jmxremote.port=9999", "-Dcom.sun.management.jmxremote.rmi.port=9999", "-Dcom.sun.management.jmxremote.authenticate=false", "-Dcom.sun.management.jmxremote.ssl=false", "-Djava.rmi.server.hostname=localhost", "-Djavax.net.ssl.trustStore=/app/certs/client-truststore.jks", "-Djavax.net.ssl.trustStorePassword=changeit", "-jar", "app.jar"]