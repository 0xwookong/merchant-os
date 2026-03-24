package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
public class ProxyRequest {

    @NotBlank(message = "method 不能为空")
    private String method;

    @NotBlank(message = "url 不能为空")
    @Size(max = 500, message = "url 长度不能超过 500")
    private String url;

    private Map<String, String> headers;

    @Size(max = 10000, message = "body 长度不能超过 10000")
    private String body;
}
