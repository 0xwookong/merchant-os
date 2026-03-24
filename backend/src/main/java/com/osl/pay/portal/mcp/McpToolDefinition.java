package com.osl.pay.portal.mcp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class McpToolDefinition {
    private String name;
    private String description;
    private Map<String, Object> inputSchema;
}
