package com.osl.pay.portal.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class WebhookCreateRequest {

    @NotBlank(message = "URL 不能为空")
    @Size(max = 500, message = "URL 长度不能超过 500")
    private String url;

    @NotEmpty(message = "至少选择一个事件类型")
    private List<String> events;
}
