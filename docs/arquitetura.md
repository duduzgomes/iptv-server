# Arquitetura do sistema

## Visão geral

```
Fontes de conteúdo
    │
    ├── URL externa (stream)  → FFmpeg → MediaMTX
    ├── Arquivo local (.mp4)  → Nginx serve direto
    └── Câmera IP (RTSP)      → MediaMTX puxa direto
                │
                ▼
        MediaMTX + FFmpeg
        gera HLS em múltiplas qualidades
        /hls/canal/720p/
        /hls/canal/480p/
                │
                ▼
            Nginx
            reverse proxy central
            ├── /live/*         → entrega HLS dos canais
            ├── /movie/*        → entrega arquivos de filme
            ├── /series/*       → entrega arquivos de série
            ├── /player_api.php → repassa pro Spring Boot
            ├── /xmltv.php      → repassa pro Spring Boot
            └── /admin/*        → repassa pro Spring Boot
                │
                ▼
          Spring Boot
          Xtream Codes API
          ├── autentica usuário
          ├── valida conexões simultâneas
          ├── lista canais, filmes e séries
          ├── expõe EPG via /xmltv.php
          └── painel admin
                │
                ├──→ PostgreSQL
                │    usuários, canais, filmes
                │    séries, episódios, EPG
                │    logs de acesso
                │
                ├──→ TMDB API (externo)
                │    metadados de filmes e séries
                │
                └──→ Provedor XMLTV (externo)
                     dados de programação EPG
                │
                ▼
        Cloudflare Tunnel
        HTTPS automático
                │
                ▼
        App de IPTV
        TiviMate / IPTV Smarters / VLC
```

---

## Responsabilidade de cada componente

**MediaMTX** — servidor de mídia que recebe streams RTMP do OBS, puxa streams RTSP de câmeras IP e distribui para o FFmpeg.

**FFmpeg** — processa cada canal ao vivo em tempo real, gerando segmentos HLS em múltiplas qualidades. Um processo por canal, rodando em paralelo.

**Nginx** — único ponto de entrada do sistema. Roteia requisições: entrega segmentos de vídeo diretamente do disco sem passar pelo Spring Boot, e repassa as requisições de API pro Spring Boot.

**Spring Boot** — implementa o protocolo Xtream Codes completo. Autentica usuários, valida acessos, lista conteúdo, serve o EPG e expõe o painel administrativo. É o cérebro do sistema.

**PostgreSQL** — armazena todos os dados do sistema: usuários com suas permissões e validades, canais, filmes, séries, episódios, programação EPG e histórico de acessos.

**TMDB** — fonte externa de metadados. Consultado apenas no cadastro e nas atualizações periódicas. Nunca consultado em tempo real durante o acesso do usuário.

**Provedor XMLTV** — fonte externa de dados de programação EPG. Consultado periodicamente pelo Spring Boot e armazenado localmente no banco.

**Cloudflare Tunnel** — expõe o sistema para a internet com HTTPS automático, sem necessidade de abrir portas no roteador.

---

## Fluxo de uma requisição de stream

```
App requisita /live/joao/123/1.m3u8
        │
        ▼
Nginx recebe
        │ repassa /player_api internamente
        ▼
Spring Boot valida:
  usuário existe? ✅
  senha correta?  ✅
  conta ativa?    ✅
  não expirou?    ✅
  conexões livres? ✅
        │
        ▼
Spring Boot retorna playlist m3u8
com URLs internas dos segmentos
        │
        ▼
App baixa segmentos diretamente:
  /hls/canal1/720p/seg001.ts
  /hls/canal1/720p/seg002.ts
        │
        ▼
Nginx serve os .ts direto do disco
sem passar pelo Spring Boot
```

---

## Separação de responsabilidades por camada

| Camada  | Componente        | Responsabilidade                                  |
| ------- | ----------------- | ------------------------------------------------- |
| Entrega | Nginx             | Segmentos `.ts` e arquivos `.mp4` direto do disco |
| Negócio | Spring Boot       | Autenticação, regras, API Xtream Codes            |
| Dados   | PostgreSQL        | Persistência de usuários, conteúdo, EPG e logs    |
| Mídia   | MediaMTX + FFmpeg | Processamento e segmentação de vídeo ao vivo      |
| Acesso  | Cloudflare Tunnel | Exposição segura com HTTPS                        |
| Externa | TMDB + XMLTV      | Metadados de filmes, séries e programação EPG     |

---

## Containers Docker

```
docker-compose.yml
  ├── mediamtx        → recebe RTMP/RTSP
  ├── ffmpeg          → processa HLS por canal
  ├── postgres        → banco de dados
  ├── spring-boot     → API Xtream + painel admin
  ├── nginx           → reverse proxy + entrega de mídia
  └── cloudflared     → túnel Cloudflare
```
