package com.duduzgomes.server_iptv;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ServerIptvApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServerIptvApplication.class, args);
    }
}
