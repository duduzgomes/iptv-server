package com.duduzgomes.server_iptv.domain.vod;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.movie.MovieRepository;
import com.duduzgomes.server_iptv.domain.series.episode.EpisodeRepository;
import com.duduzgomes.server_iptv.domain.vod.dto.IniciarUploadResponseDTO;
import com.duduzgomes.server_iptv.integration.minio.MinioService;
import com.duduzgomes.server_iptv.shared.exception.NotFoundException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadService {

    private final MovieRepository   movieRepository;
    private final EpisodeRepository episodeRepository;
    private final MinioService      minioService;
    private final FFmpegClient      ffmpegClient;

    // inicia upload de filme — retorna uploadId + presigned URLs
    @Transactional
    public IniciarUploadResponseDTO iniciarUploadFilme(Long movieId, int totalChunks) {
        var movie = movieRepository.findById(movieId)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));

        String objectKey = "processing/filmes/" + movieId + "/original.mp4";
        String uploadId  = minioService.iniciarMultipartUpload(objectKey);

        // gera presigned URL pra cada chunk
        List<String> urls = new ArrayList<>();
        for (int i = 1; i <= totalChunks; i++) {
            String url = minioService.gerarPresignedUrlParaChunk(objectKey, uploadId, i);
            log.info("URL gerada: {} ", url);
            urls.add(url);
        }

        // atualiza status
        movie.setVodStatus(VodStatus.UPLOADING);
        movie.setMinioKey(objectKey);
        movieRepository.save(movie);

        return new IniciarUploadResponseDTO(uploadId, urls);
    }

    // conclui upload de filme
    @Transactional
    public void concluirUploadFilme(Long movieId,
                                     String uploadId,
                                     List<String> etags) {
        var movie = movieRepository.findById(movieId)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));

        try {
            // MinIO monta o arquivo completo
            minioService.concluirMultipartUpload(movie.getMinioKey(), uploadId, etags);

            // atualiza status
            movie.setVodStatus(VodStatus.PROCESSING);
            movieRepository.save(movie);

            log.info("Upload do filme {} concluído — acionando FFmpeg", movieId);
            movie.setVodStatus(VodStatus.PROCESSING);
            movieRepository.save(movie);
            ffmpegClient.transcodarFilme(movieId, movie.getMinioKey());

        } catch (Exception e) {
            movie.setVodStatus(VodStatus.ERROR);
            movieRepository.save(movie);
            minioService.abortarMultipartUpload(movie.getMinioKey(), uploadId);
            throw new RuntimeException("Erro ao concluir upload: " + e.getMessage());
        }
    }

    // inicia upload de episódio
    @Transactional
    public IniciarUploadResponseDTO iniciarUploadEpisodio(Long episodeId,
                                                           int totalChunks) {
        var episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new NotFoundException("Episódio não encontrado"));

        String objectKey = "processing/episodes/" + episodeId + "/original.mp4";
        String uploadId  = minioService.iniciarMultipartUpload(objectKey);

        List<String> urls = new ArrayList<>();
        for (int i = 1; i <= totalChunks; i++) {
            urls.add(minioService.gerarPresignedUrlParaChunk(objectKey, uploadId, i));
        }

        episode.setVodStatus(VodStatus.UPLOADING);
        episode.setMinioKey(objectKey);
        episodeRepository.save(episode);

        return new IniciarUploadResponseDTO(uploadId, urls);
    }

    // conclui upload de episódio
    @Transactional
    public void concluirUploadEpisodio(Long episodeId,
                                        String uploadId,
                                        List<String> etags) {
        var episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new NotFoundException("Episódio não encontrado"));

        try {
            minioService.concluirMultipartUpload(episode.getMinioKey(), uploadId, etags);
            episode.setVodStatus(VodStatus.PROCESSING);
            episodeRepository.save(episode);

            log.info("Upload do episódio {} concluído — acionando FFmpeg", episodeId);
            episode.setVodStatus(VodStatus.PROCESSING);
            episodeRepository.save(episode);
            ffmpegClient.transcodarEpisodio(episodeId, episode.getMinioKey());

        } catch (Exception e) {
            episode.setVodStatus(VodStatus.ERROR);
            episodeRepository.save(episode);
            minioService.abortarMultipartUpload(episode.getMinioKey(), uploadId);
            throw new RuntimeException("Erro ao concluir upload: " + e.getMessage());
        }
    }
}