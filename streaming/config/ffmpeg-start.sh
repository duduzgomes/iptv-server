#!/bin/sh

echo "Aguardando MediaMTX..."
sleep 5

# lê os canais do banco via API do Spring Boot
# por enquanto inicia sem canal — canais são adicionados dinamicamente
echo "FFmpeg pronto para processar canais"

# mantém o container vivo
tail -f /dev/null