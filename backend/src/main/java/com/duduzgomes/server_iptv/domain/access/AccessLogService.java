package com.duduzgomes.server_iptv.domain.access;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.user.User;
import com.duduzgomes.server_iptv.shared.exception.UnauthorizedException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessLogService {

    private final AccessLogRepository accessLogRepository;

    @Value("${xtream.session.duration-hours:4}")
    private int sessionDurationHours;

    @Transactional
    public void registrarOuRenovarConexao(User user,
                                          AccessContentType contentType,
                                          Long contentId,
                                          String ip,
                                          String userAgent) {
        String ipUserAgent = ip + "|" + userAgent;
        LocalDateTime novaExpiracao = LocalDateTime.now()
            .plusHours(sessionDurationHours);

        // verifica se já existe sessão ativa com mesmo IP + usuário + conteúdo
        var sessaoExistente = accessLogRepository
            .findActiveByUserAndIpAndContent(
                user.getId(), ipUserAgent, contentType, contentId
            );

        if (sessaoExistente.isPresent()) {
            // renova a sessão existente
            var sessao = sessaoExistente.get();
            sessao.setExpiresAt(novaExpiracao);
            accessLogRepository.save(sessao);
            log.debug("Sessão renovada para usuário {} IP {}", user.getUsername(), ip);
            return;
        }

        // nova sessão — verifica limite de conexões
        int conexoesAtivas = accessLogRepository.countActiveByUserId(user.getId());
        if (conexoesAtivas >= user.getMaxConnections()) {
            throw new UnauthorizedException("Limite de conexões atingido");
        }

        // cria nova sessão
        var novaLog = AccessLog.builder()
            .user(user)
            .contentType(contentType)
            .contentId(contentId)
            .ipAddress(ip)
            .ipUserAgent(ipUserAgent)
            .expiresAt(novaExpiracao)
            .build();

        accessLogRepository.save(novaLog);
        log.info("Nova sessão criada para usuário {} IP {}", user.getUsername(), ip);
    }

    // job — roda a cada 5 minutos
    // encerra sessões expiradas
    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void encerrarSessoesExpiradas() {
        int encerradas = accessLogRepository.encerrarExpiradas(LocalDateTime.now());
        if (encerradas > 0) {
            log.info("Sessões expiradas encerradas: {}", encerradas);
        }
    }

    public List<AccessLog> listarConexoesAtivas() {
        return accessLogRepository.findAllActive();
    }

    public int contarConexoesAtivas(Long userId) {
        return accessLogRepository.countActiveByUserId(userId);
    }

}