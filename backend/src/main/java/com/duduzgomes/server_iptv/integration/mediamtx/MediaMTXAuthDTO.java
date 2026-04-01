package com.duduzgomes.server_iptv.integration.mediamtx;

public record MediaMTXAuthDTO(
    String user,
    String password,
    String ip,
    String action,
    String path,
    String protocol,
    String id,
    String query
) {}
