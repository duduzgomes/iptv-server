# Estágio 1 — build do Java
FROM maven:3.9-eclipse-temurin-21-alpine AS build

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn clean package -DskipTests -q

# Estágio 2 — imagem final com FFmpeg + Java
FROM linuxserver/ffmpeg:latest AS ffmpeg-base

FROM eclipse-temurin:21-jre-alpine

# copia FFmpeg e bibliotecas da imagem oficial
COPY --from=ffmpeg-base /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg-base /usr/local/bin/ffprobe /usr/local/bin/ffprobe
COPY --from=ffmpeg-base /usr/local/lib /usr/local/lib

# instala dependências de runtime necessárias pro FFmpeg
RUN apk add --no-cache \
    libstdc++ \
    libgomp \
    ca-certificates

# copia o jar
COPY --from=build /app/target/*.jar app.jar

WORKDIR /app

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "/app.jar"]
