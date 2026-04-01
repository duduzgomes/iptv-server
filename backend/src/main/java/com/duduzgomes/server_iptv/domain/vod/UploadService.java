package com.duduzgomes.server_iptv.domain.vod;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.duduzgomes.server_iptv.domain.movie.MovieRepository;
import org.springframework.transaction.annotation.Transactional;
import com.duduzgomes.server_iptv.domain.series.episode.EpisodeRepository;
import com.duduzgomes.server_iptv.domain.vod.dto.IniciarUploadResponseDTO;
import com.duduzgomes.server_iptv.integration.minio.MinioService;
import com.duduzgomes.server_iptv.integration.vod.IVodTranscoder;
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
    private final IVodTranscoder    vodTranscoder;

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
            log.debug("URL gerada: {} ", url);
            urls.add(url);
        }

        // atualiza status
        movie.setVodStatus(VodStatus.UPLOADING);
        movie.setMinioKey(objectKey);
        movieRepository.save(movie);

        return new IniciarUploadResponseDTO(uploadId, urls);
    }

    // conclui upload de filme
    public void concluirUploadFilme(Long movieId, String uploadId, List<String> etags) {

        var movie = movieRepository.findById(movieId)
            .orElseThrow(() -> new NotFoundException("Filme não encontrado"));

        try {
            // MinIO monta o arquivo completo
            minioService.concluirMultipartUpload(movie.getMinioKey(), uploadId, etags);

            // atualiza status
            movie.setVodStatus(VodStatus.PROCESSING);
            movieRepository.save(movie);

            vodTranscoder.transcodarFilme(movieId, movie.getMinioKey());

        } catch (Exception e) {
            movie.setVodStatus(VodStatus.ERROR);
            movieRepository.save(movie);
            minioService.abortarMultipartUpload(movie.getMinioKey(), uploadId);
            throw new RuntimeException("Erro ao concluir upload: " + e.getMessage());
        }
    }
     
    @Transactional
    // inicia upload de episódio
    public IniciarUploadResponseDTO iniciarUploadEpisodio(Long episodeId,  int totalChunks) {

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

    public void concluirUploadEpisodio(Long episodeId, String uploadId, List<String> etags) {

        var episode = episodeRepository.findById(episodeId)
            .orElseThrow(() -> new NotFoundException("Episódio não encontrado"));

        try {
            minioService.concluirMultipartUpload(episode.getMinioKey(), uploadId, etags);
            episode.setVodStatus(VodStatus.PROCESSING);
            episodeRepository.save(episode);

            vodTranscoder.transcodarEpisodio(episodeId, episode.getMinioKey());

        } catch (Exception e) {
            episode.setVodStatus(VodStatus.ERROR);
            episodeRepository.save(episode);
            minioService.abortarMultipartUpload(episode.getMinioKey(), uploadId);
            throw new RuntimeException("Erro ao concluir upload: " + e.getMessage());
        }
    }
}