# Arquitetura do sistema

## Visão geral

```
LIVE STREAMING:
OBS / Câmera IP
    │ RTMP/RTSP
    ▼
MediaMTX
    │ distribui o stream
    ▼
FFmpeg Service
    │ transcodifica HLS
    ▼
Volume local /hls/
    │
    ▼
Nginx → App IPTV

VOD (Filmes e Séries):
Admin faz upload
    │ chunks via HTTP
    ▼
Spring Boot
    │ multipart upload
    ▼
MinIO (arquivo original)
    │ notifica Spring Boot
    ▼
FFmpeg Service
    │ transcodifica HLS
    ▼
MinIO (segmentos HLS)
    │
    ▼
Nginx → App IPTV
```

## Responsabilidade de cada componente

| Componente     | Responsabilidade                                   |
| -------------- | -------------------------------------------------- |
| MediaMTX       | Recebe RTMP/RTSP e distribui streams ao vivo       |
| FFmpeg Service | Transcodifica live e VOD em múltiplas qualidades   |
| MinIO          | Armazena arquivos originais e segmentos HLS do VOD |
| Nginx          | Serve segmentos HLS (live do disco, VOD do MinIO)  |
| Spring Boot    | API Xtream Codes, autenticação, orquestra serviços |
| PostgreSQL     | Persistência de usuários, conteúdo, logs           |

## Fluxo live streaming

```
1. OBS envia stream → MediaMTX:1935
2. FFmpeg consome de MediaMTX → gera /hls/{streamKey}/
3. Usuário abre canal → Spring Boot valida → redirect /hls/{streamKey}/master.m3u8
4. Nginx serve segmentos .ts direto do volume local
```

## Fluxo VOD

```
1. Admin faz upload em chunks → Spring Boot → MinIO
2. Spring Boot aciona FFmpeg Service
3. FFmpeg baixa do MinIO → transcodifica → salva segmentos no MinIO
4. Spring Boot atualiza status → READY
5. Usuário abre filme → Spring Boot valida → redirect MinIO
6. Nginx faz proxy pro MinIO → serve segmentos
```

## Status do VOD

```
PENDING    → arquivo no MinIO, aguardando transcodificação
PROCESSING → FFmpeg transcodificando
READY      → segmentos HLS prontos no MinIO
ERROR      → falha na transcodificação
```

## Containers Docker

```
docker-compose.yml
  ├── postgres        → banco de dados
  ├── spring-boot     → API Xtream Codes + painel admin
  ├── ffmpeg-service  → transcodificação live e VOD
  ├── mediamtx        → ingestão de streams ao vivo
  ├── minio           → armazenamento VOD
  └── nginx           → reverse proxy + entrega de mídia
```
