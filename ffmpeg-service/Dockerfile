# Estágio 1 — build
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# Estágio 2 — imagem final
FROM eclipse-temurin:21-jre-alpine

# FFmpeg via apk — Alpine repository
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]