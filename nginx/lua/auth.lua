local jwt_lib = require("resty.jwt")
local cjson   = require("cjson")
local cache   = ngx.shared.concurrency_cache

local function deny(status, msg)
    ngx.status = status
    ngx.header["Content-Type"] = "application/json"
    ngx.say(cjson.encode({ error = msg }))
    return ngx.exit(status)
end

-- Token obrigatório — injetado via sub_filter em todos os segmentos e sub-manifestos
local sjwt = ngx.var.arg_sjwt
if not sjwt or sjwt == "" then
    return deny(401, "Token ausente")
end

-- Validação da assinatura RS256 e claims obrigatórios
local obj = jwt_lib:verify(PUBLIC_KEY, sjwt)

if not obj or not obj.verified then
    ngx.log(ngx.WARN, "[vod-auth] JWT inválido: ", obj and obj.reason or "?")
    return deny(401, "Token inválido")
end

if obj.header.alg ~= "RS256" then
    return deny(401, "Algoritmo inválido")
end

local payload = obj.payload

if payload.exp and payload.exp < ngx.time() then
    return deny(401, "Token expirado")
end

-- Identidade e IP do cliente
local user_id   = tostring(payload.sub)
local client_ip = ngx.var.real_client_ip
client_ip = client_ip:match("^%s*(.-)%s*$")

-- Controle de concorrência: uma tela ativa por user_id
local cached_ip = cache:get(user_id)

if not cached_ip then
    -- Sem sessão ativa: inicia e permite
    cache:set(user_id, client_ip, 30)
    ngx.log(ngx.INFO, "[vod-auth] sessão iniciada user=", user_id, " ip=", client_ip)

elseif cached_ip == client_ip then
    -- Mesmo IP: heartbeat — renova TTL de 30 s
    cache:set(user_id, client_ip, 30)

else
    -- IP diferente: limite de telas atingido
    ngx.log(ngx.WARN, "[vod-auth] limite de telas user=", user_id,
        " ip_ativo=", cached_ip, " ip_novo=", client_ip)
    return deny(403, "Limite de telas atingido")
end
