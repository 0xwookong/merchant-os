package com.osl.pay.portal.mcp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class McpToolCallResponse {
    private boolean success;
    private Object result;
    private String error;

    public static McpToolCallResponse ok(Object result) {
        return new McpToolCallResponse(true, result, null);
    }

    public static McpToolCallResponse fail(String error) {
        return new McpToolCallResponse(false, null, error);
    }
}
