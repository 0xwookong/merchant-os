package com.osl.pay.portal.mcp;

import com.osl.pay.portal.common.result.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/mcp")
@RequiredArgsConstructor
public class McpController {

    private final McpToolService mcpToolService;

    /**
     * SSE endpoint — sends tool definitions on connect, keeps connection alive.
     * AI assistants connect here to discover available tools.
     */
    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sse() {
        SseEmitter emitter = new SseEmitter(0L); // no timeout

        try {
            // Send tool definitions as the first event
            List<McpToolDefinition> tools = mcpToolService.getToolDefinitions();
            emitter.send(SseEmitter.event()
                    .name("tools")
                    .data(Map.of(
                            "type", "tools/list",
                            "tools", tools
                    )));

            // Send server info
            emitter.send(SseEmitter.event()
                    .name("server_info")
                    .data(Map.of(
                            "name", "oslpay-mcp-server",
                            "version", "1.0.0",
                            "description", "OSL Pay MCP Server — call payment APIs via AI assistants"
                    )));

        } catch (IOException e) {
            log.warn("SSE send failed: {}", e.getMessage());
            emitter.completeWithError(e);
        }

        emitter.onCompletion(() -> log.debug("MCP SSE connection closed"));
        emitter.onTimeout(() -> log.debug("MCP SSE connection timed out"));

        return emitter;
    }

    /**
     * Tool call endpoint — AI assistants POST here to invoke a tool.
     */
    @PostMapping("/tools/call")
    public Result<McpToolCallResponse> callTool(@Valid @RequestBody McpToolCallRequest request) {
        return Result.ok(mcpToolService.callTool(request));
    }

    /**
     * Tool list endpoint — returns all available tool definitions (non-SSE).
     */
    @GetMapping("/tools")
    public Result<List<McpToolDefinition>> listTools() {
        return Result.ok(mcpToolService.getToolDefinitions());
    }
}
