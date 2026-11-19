package com.openchart;

import io.github.cdimascio.dotenv.Dotenv;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OpenChartApplication {
    public static void main(String[] args) {
        // Support both repository-root IDE runs and `cd backend; mvn spring-boot:run`.
        String directory = Files.isRegularFile(Path.of("backend", ".env")) ? "backend" : ".";
        Dotenv.configure().directory(directory).ignoreIfMissing().load().entries().forEach(entry -> {
            if (System.getenv(entry.getKey()) == null && System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });
        SpringApplication.run(OpenChartApplication.class, args);
    }
}
