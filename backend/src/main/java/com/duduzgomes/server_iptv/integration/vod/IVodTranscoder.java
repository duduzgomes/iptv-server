package com.duduzgomes.server_iptv.integration.vod;

public interface IVodTranscoder {
    void transcodarFilme(Long movieId, String minioKey);
    void transcodarEpisodio(Long episodeId, String minioKey);
}
