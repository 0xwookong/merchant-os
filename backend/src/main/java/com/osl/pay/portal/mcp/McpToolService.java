package com.osl.pay.portal.mcp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.*;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
public class McpToolService {

    private final List<McpToolDefinition> toolDefinitions;

    public McpToolService() {
        this.toolDefinitions = buildToolDefinitions();
    }

    public List<McpToolDefinition> getToolDefinitions() {
        return toolDefinitions;
    }

    public McpToolCallResponse callTool(McpToolCallRequest request) {
        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();
        try {
            return switch (request.getName()) {
                case "oslpay_get_quote" -> getQuote(args);
                case "oslpay_create_order" -> createOrder(args);
                case "oslpay_query_order" -> queryOrder(args);
                case "oslpay_generate_signature" -> generateSignature(args);
                case "oslpay_get_currency_list" -> getCurrencyList();
                case "oslpay_get_guide" -> getGuide();
                default -> McpToolCallResponse.fail("Unknown tool: " + request.getName());
            };
        } catch (Exception e) {
            log.warn("MCP tool call failed: tool={}, error={}", request.getName(), e.getMessage());
            return McpToolCallResponse.fail(e.getMessage());
        }
    }

    // ===== Tool implementations =====

    private McpToolCallResponse getQuote(Map<String, Object> args) {
        String fiatCurrency = str(args, "fiatCurrency", "USD");
        double fiatAmount = num(args, "fiatAmount", 100.0);
        String cryptoCurrency = str(args, "cryptoCurrency", "USDT");
        String network = str(args, "cryptoNetwork", "ERC20");

        // Simulated quote (sandbox behavior)
        double rate = switch (cryptoCurrency) {
            case "USDT", "USDC" -> 0.998;
            case "ETH" -> 0.00028;
            case "BTC" -> 0.0000095;
            default -> 1.0;
        };

        return McpToolCallResponse.ok(Map.of(
                "quoteId", "qt_" + UUID.randomUUID().toString().substring(0, 8),
                "fiatAmount", fiatAmount,
                "fiatCurrency", fiatCurrency,
                "cryptoAmount", Math.round(fiatAmount * rate * 100000000.0) / 100000000.0,
                "cryptoCurrency", cryptoCurrency,
                "cryptoNetwork", network,
                "exchangeRate", rate,
                "expiresAt", Instant.now().plusSeconds(30).toString()
        ));
    }

    private McpToolCallResponse createOrder(Map<String, Object> args) {
        String quoteId = str(args, "quoteId", "");
        String userId = str(args, "userId", "");
        String walletAddress = str(args, "walletAddress", "");
        String paymentMethod = str(args, "paymentMethod", "CARD");

        if (quoteId.isBlank()) return McpToolCallResponse.fail("quoteId is required. Get one from oslpay_get_quote first.");
        if (walletAddress.isBlank()) return McpToolCallResponse.fail("walletAddress is required.");

        return McpToolCallResponse.ok(Map.of(
                "orderId", "ord_" + UUID.randomUUID().toString().substring(0, 8),
                "status", "CREATED",
                "paymentUrl", "https://pay.osl-pay.com/checkout/ord_" + UUID.randomUUID().toString().substring(0, 8),
                "expiresAt", Instant.now().plusSeconds(1800).toString()
        ));
    }

    private McpToolCallResponse queryOrder(Map<String, Object> args) {
        String orderId = str(args, "orderId", "");
        if (orderId.isBlank()) return McpToolCallResponse.fail("orderId is required.");

        // Simulated order status
        return McpToolCallResponse.ok(Map.of(
                "orderId", orderId,
                "status", "COMPLETED",
                "fiatAmount", 100.00,
                "fiatCurrency", "USD",
                "cryptoAmount", 99.80,
                "cryptoCurrency", "USDT",
                "txHash", "0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 40),
                "completedAt", Instant.now().toString()
        ));
    }

    private McpToolCallResponse generateSignature(Map<String, Object> args) {
        String appId = str(args, "appId", "");
        if (appId.isBlank()) return McpToolCallResponse.fail("appId is required.");

        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        String signStr = "appId=" + appId + "&timestamp=" + timestamp;

        // Generate a demo signature using a random key pair
        try {
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
            gen.initialize(2048);
            KeyPair pair = gen.generateKeyPair();

            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(pair.getPrivate());
            sig.update(signStr.getBytes());
            String signature = Base64.getEncoder().encodeToString(sig.sign());

            return McpToolCallResponse.ok(Map.of(
                    "signatureString", signStr,
                    "signature", signature,
                    "timestamp", timestamp,
                    "algorithm", "SHA256withRSA",
                    "note", "This is a demo signature. In production, use your own private key."
            ));
        } catch (Exception e) {
            return McpToolCallResponse.fail("Signature generation failed: " + e.getMessage());
        }
    }

    private McpToolCallResponse getCurrencyList() {
        return McpToolCallResponse.ok(Map.of(
                "fiatCurrencies", List.of("USD", "EUR", "GBP"),
                "cryptoCurrencies", List.of(
                        Map.of("symbol", "USDT", "networks", List.of("ERC20", "TRC20", "BEP20", "Polygon", "Solana")),
                        Map.of("symbol", "USDC", "networks", List.of("ERC20", "TRC20", "BEP20", "Polygon", "Solana")),
                        Map.of("symbol", "ETH", "networks", List.of("ERC20", "Arbitrum", "Optimism")),
                        Map.of("symbol", "BTC", "networks", List.of("Bitcoin"))
                )
        ));
    }

    private McpToolCallResponse getGuide() {
        return McpToolCallResponse.ok(Map.of(
                "title", "OSL Pay Integration Quick Start",
                "steps", List.of(
                        Map.of("step", 1, "action", "Get API credentials from developer console", "endpoint", "/developer/credentials"),
                        Map.of("step", 2, "action", "Implement RSA SHA256withRSA signature", "tool", "oslpay_generate_signature"),
                        Map.of("step", 3, "action", "Get a quote for the payment", "tool", "oslpay_get_quote"),
                        Map.of("step", 4, "action", "Create an order with the quote", "tool", "oslpay_create_order"),
                        Map.of("step", 5, "action", "Monitor order status", "tool", "oslpay_query_order")
                ),
                "signatureFormat", "appId=[appId]&timestamp=[unix_timestamp_ms]",
                "signatureAlgorithm", "RSA SHA256withRSA (PKCS#8 PEM key)",
                "sandboxBaseUrl", "https://openapitest.osl-pay.com",
                "documentation", "/developer/docs"
        ));
    }

    // ===== Tool definitions =====

    private List<McpToolDefinition> buildToolDefinitions() {
        return List.of(
                new McpToolDefinition("oslpay_get_quote", "Get a fiat-to-crypto quote with exchange rate and fees",
                        Map.of("type", "object", "properties", Map.of(
                                "fiatCurrency", Map.of("type", "string", "enum", List.of("USD", "EUR", "GBP"), "description", "Fiat currency code"),
                                "fiatAmount", Map.of("type", "number", "description", "Amount in fiat currency"),
                                "cryptoCurrency", Map.of("type", "string", "enum", List.of("USDT", "USDC", "ETH", "BTC"), "description", "Target cryptocurrency"),
                                "cryptoNetwork", Map.of("type", "string", "description", "Blockchain network (ERC20, TRC20, etc.)")
                        ), "required", List.of("fiatCurrency", "fiatAmount", "cryptoCurrency"))),

                new McpToolDefinition("oslpay_create_order", "Create a payment order using a valid quote",
                        Map.of("type", "object", "properties", Map.of(
                                "quoteId", Map.of("type", "string", "description", "Quote ID from oslpay_get_quote"),
                                "userId", Map.of("type", "string", "description", "User ID"),
                                "walletAddress", Map.of("type", "string", "description", "Destination wallet address"),
                                "paymentMethod", Map.of("type", "string", "enum", List.of("CARD", "GOOGLEPAY", "APPLEPAY"))
                        ), "required", List.of("quoteId", "walletAddress"))),

                new McpToolDefinition("oslpay_query_order", "Query the status of a payment order",
                        Map.of("type", "object", "properties", Map.of(
                                "orderId", Map.of("type", "string", "description", "Order ID to query")
                        ), "required", List.of("orderId"))),

                new McpToolDefinition("oslpay_generate_signature", "Generate RSA SHA256withRSA signature for API authentication",
                        Map.of("type", "object", "properties", Map.of(
                                "appId", Map.of("type", "string", "description", "Your application ID")
                        ), "required", List.of("appId"))),

                new McpToolDefinition("oslpay_get_currency_list", "Get list of supported fiat and crypto currencies with networks",
                        Map.of("type", "object", "properties", Map.of())),

                new McpToolDefinition("oslpay_get_guide", "Get structured quick start guide for OSL Pay API integration",
                        Map.of("type", "object", "properties", Map.of()))
        );
    }

    private String str(Map<String, Object> args, String key, String defaultVal) {
        Object v = args.get(key);
        return v != null ? v.toString() : defaultVal;
    }

    private double num(Map<String, Object> args, String key, double defaultVal) {
        Object v = args.get(key);
        if (v instanceof Number n) return n.doubleValue();
        if (v instanceof String s) { try { return Double.parseDouble(s); } catch (Exception e) { return defaultVal; } }
        return defaultVal;
    }
}
