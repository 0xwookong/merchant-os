package com.osl.pay.portal.controller;

import com.osl.pay.portal.common.context.EnvironmentContext;
import com.osl.pay.portal.common.result.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public Result<Map<String, String>> health() {
        return Result.ok(Map.of(
                "status", "running",
                "environment", EnvironmentContext.current()
        ));
    }
}
