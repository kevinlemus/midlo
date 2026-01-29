FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy only the backend files (avoids Render's wrong build context)
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY src ./src

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

CMD ["java", "-jar", "target/midlo-backend-0.0.1-SNAPSHOT.jar"]
