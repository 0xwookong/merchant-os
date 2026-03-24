package com.osl.pay.portal.mcp;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class McpToolCallRequest {
    @NotBlank(message = "tool name is required")
    private String name;
    private Map<String, Object> arguments;
}
