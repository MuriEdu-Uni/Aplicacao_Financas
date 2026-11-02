package com.gestaofinanceira;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.Executors;

/**
 * Servidor HTTP Local e API REST em Java
 * Autores: Dennis Gabriel de Oliveira, Murilo da Silva Santos
 * Projeto: APLICATIVO DE GESTÃO FINANCEIRA PESSOAL
 * Instituição: Centro Universitário Cesumar - UNICESUMAR
 */
public class Server {

    private static final int DEFAULT_PORT = 8080;
    private static final Path DATA_FILE = Paths.get("data", "database.json");
    private static final Path ROOT_DIR = Paths.get(".").toAbsolutePath().normalize();

    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        try {
            HttpServer server;
            try {
                server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
            } catch (Exception ex) {
                server = HttpServer.create(new InetSocketAddress(port), 0);
            }

            // API Endpoints
            server.createContext("/api/status", new StatusHandler());
            server.createContext("/api/data", new DataHandler());

            // Static File Handler (serve index.html, css, js)
            server.createContext("/", new StaticFileHandler());

            server.setExecutor(Executors.newFixedThreadPool(10));
            server.start();

            printBanner(port);

        } catch (IOException e) {
            System.err.println("Erro ao iniciar o servidor na porta " + port + ": " + e.getMessage());
            // Se a porta 8080 estiver ocupada, tenta 8081
            if (port == DEFAULT_PORT) {
                System.out.println("Tentando porta alternativa 8081...");
                main(new String[]{"8081"});
            }
        }
    }

    private static void printBanner(int port) {
        System.out.println("==================================================================");
        System.out.println("    FinGestao - Aplicativo de Gestao Financeira Pessoal (Java)   ");
        System.out.println("    Autores: Dennis Gabriel de Oliveira & Murilo da Silva Santos ");
        System.out.println("    UniCesumar - Analise e Desenvolvimento de Sistemas           ");
        System.out.println("==================================================================");
        System.out.println("[OK] Servidor iniciado com sucesso!");
        System.out.println("[OK] Acesso web local: http://localhost:" + port);
        System.out.println("[OK] Banco de dados JSON: " + DATA_FILE.toAbsolutePath());
        System.out.println("[OK] Pressione Ctrl+C para encerrar o servidor a qualquer momento.");
        System.out.println("==================================================================");
    }

    // Handler de Status da API
    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String response = "{\"status\":\"online\",\"backend\":\"Java OpenJDK\",\"version\":\"1.0.0\"}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // Handler de Persistência REST dos Dados Financeiros (/api/data)
    static class DataHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equals(method)) {
                // Lê do arquivo data/database.json
                if (!Files.exists(DATA_FILE)) {
                    Files.createDirectories(DATA_FILE.getParent());
                    Files.writeString(DATA_FILE, "{\"transactions\":[],\"categories\":[],\"goals\":[]}", StandardCharsets.UTF_8);
                }

                byte[] data = Files.readAllBytes(DATA_FILE);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(200, data.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(data);
                }

            } else if ("POST".equals(method) || "PUT".equals(method)) {
                // Grava corpo no arquivo data/database.json
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] temp = new byte[4096];
                int read;
                while ((read = is.read(temp)) != -1) {
                    buffer.write(temp, 0, read);
                }
                byte[] jsonBytes = buffer.toByteArray();

                if (jsonBytes.length > 0) {
                    Files.createDirectories(DATA_FILE.getParent());
                    Files.write(DATA_FILE, jsonBytes);
                }

                String response = "{\"success\":true,\"message\":\"Dados atualizados com sucesso no backend Java.\"}";
                byte[] respBytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(200, respBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(respBytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // Handler de Arquivos Estáticos (HTML, CSS, JS, etc.)
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String rawPath = exchange.getRequestURI().getPath();
            String path = URLDecoder.decode(rawPath, StandardCharsets.UTF_8);

            if (path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            // Remove barra inicial para resolver em relação à pasta raiz
            if (path.startsWith("/")) {
                path = path.substring(1);
            }

            Path requestedFile = ROOT_DIR.resolve(path).normalize();

            // Proteção contra Directory Traversal
            if (!requestedFile.startsWith(ROOT_DIR)) {
                send404(exchange, "Acesso proibido.");
                return;
            }

            if (!Files.exists(requestedFile) || Files.isDirectory(requestedFile)) {
                // Tenta index.html se for diretório
                if (Files.isDirectory(requestedFile) && Files.exists(requestedFile.resolve("index.html"))) {
                    requestedFile = requestedFile.resolve("index.html");
                } else {
                    send404(exchange, "Arquivo nao encontrado: " + path);
                    return;
                }
            }

            String mimeType = getMimeType(requestedFile.toString());
            byte[] fileBytes = Files.readAllBytes(requestedFile);

            exchange.getResponseHeaders().set("Content-Type", mimeType);
            exchange.sendResponseHeaders(200, fileBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }
        }

        private void send404(HttpExchange exchange, String msg) throws IOException {
            byte[] bytes = msg.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
            exchange.sendResponseHeaders(404, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String getMimeType(String filename) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
            if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
            if (lower.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".pdf")) return "application/pdf";
            if (lower.endsWith(".csv")) return "text/csv; charset=UTF-8";
            return "application/octet-stream";
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    }
}
