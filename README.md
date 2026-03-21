# Documentação do sistema de streaming IPTV

## Visão geral

Sistema de streaming privado compatível com o protocolo Xtream Codes, permitindo que usuários autorizados assistam a canais ao vivo, filmes e séries através de qualquer aplicativo de IPTV. O sistema é gerenciado por um painel administrativo web onde admins cadastram conteúdo e controlam o acesso dos usuários.

---

## Requisitos funcionais

### 1. Autenticação de usuários

O sistema deve permitir que usuários se autentiquem informando usuário e senha através de qualquer aplicativo compatível com o protocolo Xtream Codes. Após a autenticação bem-sucedida, o sistema deve retornar as informações do servidor e do perfil do usuário, incluindo a data de expiração da conta e o limite de conexões simultâneas permitidas.

O sistema deve impedir o acesso quando a conta estiver expirada, suspensa ou quando o usuário já tiver atingido o número máximo de conexões simultâneas permitidas.

### 2. Canais ao vivo

O sistema deve disponibilizar uma lista de canais ao vivo organizados por categorias. Cada canal deve ter nome, categoria, logo e estar associado a uma fonte de transmissão. Os canais devem ser entregues em múltiplas qualidades de vídeo, permitindo que o aplicativo do usuário selecione automaticamente a melhor qualidade de acordo com a velocidade da conexão.

Quando a fonte de um canal ficar indisponível, o sistema deve tentar restabelecer a transmissão automaticamente, sem necessidade de intervenção manual.

### 3. Filmes

O sistema deve disponibilizar uma lista de filmes organizados por categorias e gêneros. As informações de cada filme — título, sinopse, ano de lançamento, gênero, elenco, poster e nota de avaliação — devem ser obtidas automaticamente a partir do The Movie Database (TMDB) com base no identificador do filme, dispensando o preenchimento manual de metadados pelo administrador.

O usuário deve conseguir navegar pelo catálogo, visualizar detalhes do filme e reproduzi-lo diretamente pelo aplicativo, com suporte a avanço e retrocesso na linha do tempo.

### 4. Séries

O sistema deve disponibilizar um catálogo de séries organizadas por temporadas e episódios. As informações de cada série e de cada episódio devem ser obtidas automaticamente do TMDB, incluindo nome, sinopse, data de lançamento e poster de cada episódio.

O usuário deve conseguir navegar entre temporadas e episódios e reproduzir qualquer episódio diretamente pelo aplicativo.

### 5. Painel de administração

#### 5.1 Gerenciamento de usuários

O painel deve permitir cadastrar novos usuários informando nome de usuário, senha, validade em dias e número máximo de conexões simultâneas permitidas. Deve ser possível editar, suspender, reativar e excluir usuários a qualquer momento. O sistema deve bloquear automaticamente o acesso de usuários com a conta expirada.

#### 5.2 Gerenciamento de canais ao vivo

O painel deve permitir cadastrar canais informando nome, categoria, logo e a URL da fonte de transmissão. Deve ser possível editar, ativar, desativar e excluir canais. A ordem de exibição dos canais no aplicativo deve ser configurável.

#### 5.3 Gerenciamento de filmes

O painel deve permitir cadastrar filmes informando o identificador do TMDB e o caminho do arquivo de vídeo no servidor. O sistema deve buscar e salvar os metadados automaticamente. Deve ser possível editar, ativar, desativar e excluir filmes do catálogo.

#### 5.4 Gerenciamento de séries

O painel deve permitir cadastrar séries informando o identificador do TMDB. O sistema deve buscar automaticamente as temporadas e episódios disponíveis no TMDB. Para cada episódio, o administrador informa o caminho do arquivo de vídeo correspondente. Deve ser possível editar, ativar, desativar e excluir séries e episódios.

#### 5.5 Relatórios de acesso

O painel deve exibir em tempo real quantos usuários estão conectados, quais conteúdos estão sendo assistidos e quantas conexões cada usuário possui abertas. Deve ser possível visualizar o histórico de acessos por usuário, incluindo data, horário e conteúdo acessado.

### 6. Níveis de acesso administrativo

O sistema deve suportar dois perfis de administrador. O superadmin tem acesso completo ao sistema, incluindo o gerenciamento de outros administradores. O admin tem acesso ao gerenciamento de usuários e conteúdo, mas não pode criar ou excluir outros administradores.

---

## Requisitos não funcionais

### Compatibilidade

O sistema deve ser totalmente compatível com o protocolo Xtream Codes, garantindo funcionamento em qualquer aplicativo de IPTV que suporte esse protocolo, como TiviMate, IPTV Smarters, GSE Player e VLC, sem necessidade de configurações especiais por parte do usuário.

### Desempenho

A autenticação e a listagem de conteúdo devem responder em menos de 200 milissegundos. A entrega dos segmentos de vídeo deve ocorrer diretamente pelo servidor de mídia, sem passar pela camada de autenticação, garantindo fluidez na reprodução.

### Segurança

As senhas dos usuários devem ser armazenadas de forma criptografada, nunca em texto puro. O acesso ao painel administrativo deve ser protegido por autenticação separada com sessões de curta duração. O acesso externo ao sistema deve ser feito exclusivamente via conexão segura com HTTPS. Credenciais de fontes de stream e do banco de dados nunca devem aparecer em código ou arquivos versionados.

### Disponibilidade

O sistema deve continuar entregando conteúdo normalmente mesmo que o painel administrativo esteja temporariamente indisponível. Canais com fonte indisponível devem tentar reconectar automaticamente. Todos os serviços devem reiniciar sozinhos em caso de falha.

### Metadados automáticos

O sistema deve buscar os metadados de filmes e séries automaticamente no TMDB no momento do cadastro, armazenando as informações localmente para não depender de consultas externas a cada acesso do usuário. As informações devem poder ser atualizadas periodicamente de forma automática.

---

## Fluxos do sistema

### Fluxo 1 — usuário acessando pelo aplicativo de IPTV

O usuário abre o aplicativo de IPTV e informa o endereço do servidor, seu nome de usuário e senha. O sistema verifica se as credenciais estão corretas, se a conta está ativa, se não está expirada e se o número de conexões simultâneas não foi atingido. Caso tudo esteja correto, o sistema retorna a confirmação de acesso junto com as informações do servidor.

O aplicativo então carrega automaticamente a lista de canais ao vivo, filmes e séries disponíveis. O usuário navega pelo catálogo e seleciona o conteúdo que deseja assistir. O sistema verifica novamente as credenciais do usuário e, se válidas, entrega o conteúdo para reprodução. Os segmentos de vídeo são entregues diretamente sem nova verificação a cada trecho, garantindo fluidez na reprodução.

Ao encerrar a sessão ou fechar o aplicativo, a conexão é liberada e o contador de conexões simultâneas do usuário é decrementado.

### Fluxo 2 — administrador cadastrando um canal ao vivo

O administrador acessa o painel web e faz login com suas credenciais. Na seção de canais, cria um novo canal informando o nome, a categoria, a URL da fonte de transmissão e opcionalmente uma imagem de logo. O sistema inicia a captura da transmissão a partir da fonte informada e começa a gerar os segmentos de vídeo nas qualidades configuradas. O canal fica imediatamente disponível para os usuários no aplicativo.

Caso a fonte da transmissão fique indisponível, o sistema detecta a interrupção e tenta restabelecer a conexão automaticamente em intervalos regulares, sem necessidade de intervenção do administrador.

### Fluxo 3 — administrador cadastrando um filme

O administrador acessa a seção de filmes no painel e cria um novo cadastro informando o identificador do filme no TMDB e o caminho do arquivo de vídeo no servidor. O sistema consulta o TMDB e recupera automaticamente todas as informações do filme — título, sinopse, ano, gênero, elenco, poster e nota de avaliação — salvando tudo localmente.

O filme fica disponível no catálogo dos usuários com todas as informações preenchidas, sem que o administrador precise digitar nenhum metadado manualmente.

### Fluxo 4 — administrador cadastrando uma série

O administrador informa o identificador da série no TMDB. O sistema busca automaticamente a estrutura completa da série, incluindo todas as temporadas e episódios disponíveis com seus respectivos metadados. O administrador então associa cada episódio ao arquivo de vídeo correspondente no servidor. Os episódios com arquivo associado ficam disponíveis para reprodução, enquanto os demais aparecem no catálogo sem a opção de assistir.

### Fluxo 5 — controle de acesso por validade e conexões simultâneas

Quando um usuário tenta se autenticar com uma conta expirada, o sistema nega o acesso e retorna uma mensagem informando que a conta está expirada. Quando um usuário já possui o número máximo de conexões abertas e tenta abrir uma nova, o sistema nega o acesso e informa que o limite foi atingido.

O administrador pode a qualquer momento estender a validade de uma conta, alterar o limite de conexões ou suspender o acesso imediatamente, com efeito em tempo real — se o usuário estiver assistindo no momento da suspensão, o acesso é interrompido na próxima validação.

### Fluxo 6 — atualização automática de metadados

Periodicamente, o sistema verifica se há atualizações disponíveis no TMDB para os filmes e séries cadastrados — como novos episódios de séries em andamento ou correções de informações. As informações são atualizadas automaticamente no banco de dados, sem necessidade de intervenção do administrador. Novos episódios identificados ficam visíveis no catálogo assim que o administrador associar o arquivo de vídeo correspondente.

### Fluxo 7 — monitoramento em tempo real pelo administrador

O administrador acessa a seção de relatórios no painel e visualiza em tempo real todos os usuários conectados, o conteúdo que cada um está assistindo e há quanto tempo. Também visualiza usuários com múltiplas conexões abertas simultaneamente. Pode encerrar a sessão de um usuário específico diretamente pelo painel, se necessário. O histórico de acessos fica disponível para consulta por período, usuário ou conteúdo.

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
