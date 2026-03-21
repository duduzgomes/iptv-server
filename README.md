# IPTV Server

Servidor de streaming compatível com protocolo Xtream Codes.

## Estrutura

- `backend/` — API Spring Boot (Xtream Codes + painel admin)
- `streaming/` — stack de mídia (MediaMTX, FFmpeg, Nginx)
- `docs/` — documentação do projeto

## Pré-requisitos

- Docker Desktop
- Java 21
- Maven 3.9+

## Configuração

```bash
cp .env.example .env
# edita o .env com suas credenciais
```

## Documentação

- [Requisitos](docs/requisitos.md)
- [Arquitetura](docs/arquitetura.md)
