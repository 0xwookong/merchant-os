package com.osl.pay.portal.controller.docs;

import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.common.result.Result;
import com.osl.pay.portal.docengine.DocEngineService;
import com.osl.pay.portal.docengine.DocsProxyService;
import com.osl.pay.portal.docengine.EndpointDetail;
import com.osl.pay.portal.docengine.EndpointListResult;
import com.osl.pay.portal.model.dto.ProxyRequest;
import com.osl.pay.portal.model.dto.ProxyResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/docs")
@RequiredArgsConstructor
public class DocsController {

    private final DocEngineService docEngineService;
    private final DocsProxyService docsProxyService;

    @GetMapping("/endpoints")
    public Result<EndpointListResult> listEndpoints(
            @RequestParam(required = false) String category) {
        return Result.ok(docEngineService.listEndpoints(category));
    }

    @GetMapping("/endpoints/{operationId}")
    public Result<EndpointDetail> getEndpointDetail(@PathVariable String operationId) {
        return Result.ok(docEngineService.getEndpointDetail(operationId)
                .orElseThrow(() -> new BizException(40400, "端点不存在")));
    }

    @PostMapping("/proxy")
    public Result<ProxyResponse> proxy(@Valid @RequestBody ProxyRequest request) {
        return Result.ok(docsProxyService.proxy(request));
    }
}
