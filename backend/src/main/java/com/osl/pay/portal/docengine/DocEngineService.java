package com.osl.pay.portal.docengine;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DocEngineService {

    private static final Map<String, String> TAG_TO_CATEGORY = Map.of(
            "User Management", "user",
            "Quote", "quote",
            "Order", "order",
            "Card", "card",
            "Config", "config",
            "Merchant", "merchant"
    );

    private static final Map<String, String> CATEGORY_LABELS = Map.of(
            "user", "用户管理",
            "quote", "报价",
            "order", "订单",
            "card", "银行卡",
            "config", "配置",
            "merchant", "商户"
    );

    private List<EndpointSummary> allEndpoints;
    private Map<String, EndpointDetail> detailMap;

    @PostConstruct
    @SuppressWarnings("unchecked")
    public void init() {
        try {
            ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
            InputStream is = new ClassPathResource("openapi/oslpay-openapi.yaml").getInputStream();
            Map<String, Object> spec = yamlMapper.readValue(is, new TypeReference<>() {});

            Map<String, Object> paths = (Map<String, Object>) spec.getOrDefault("paths", Map.of());
            allEndpoints = new ArrayList<>();
            detailMap = new LinkedHashMap<>();

            for (var pathEntry : paths.entrySet()) {
                String path = pathEntry.getKey();
                Map<String, Object> methods = (Map<String, Object>) pathEntry.getValue();

                for (var methodEntry : methods.entrySet()) {
                    String method = methodEntry.getKey().toUpperCase();
                    Map<String, Object> operation = (Map<String, Object>) methodEntry.getValue();

                    String operationId = (String) operation.get("operationId");
                    if (operationId == null) continue;

                    String summary = (String) operation.getOrDefault("summary", "");
                    String description = (String) operation.getOrDefault("description", "");
                    List<String> tags = (List<String>) operation.getOrDefault("tags", List.of());
                    String tag = tags.isEmpty() ? "Other" : tags.get(0);
                    String category = TAG_TO_CATEGORY.getOrDefault(tag, "other");

                    // Build summary
                    EndpointSummary es = new EndpointSummary();
                    es.setOperationId(operationId);
                    es.setMethod(method);
                    es.setPath(path);
                    es.setSummary(summary);
                    es.setCategory(category);
                    es.setTag(tag);
                    allEndpoints.add(es);

                    // Build detail
                    EndpointDetail detail = new EndpointDetail();
                    detail.setOperationId(operationId);
                    detail.setMethod(method);
                    detail.setPath(path);
                    detail.setSummary(summary);
                    detail.setDescription(description);
                    detail.setCategory(category);
                    detail.setTag(tag);
                    detail.setParameters(extractParameters(operation, spec));
                    detail.setRequestBody(extractRequestBody(operation));
                    detail.setResponses(extractResponses(operation));
                    detail.setAiContextBlock(buildAiContextBlock(detail));
                    detailMap.put(operationId, detail);
                }
            }

            log.info("DocEngine initialized: {} endpoints loaded", allEndpoints.size());
        } catch (Exception e) {
            log.error("Failed to initialize DocEngine", e);
            allEndpoints = List.of();
            detailMap = Map.of();
        }
    }

    public EndpointListResult listEndpoints(String category) {
        List<EndpointSummary> filtered = (category == null || category.isBlank())
                ? allEndpoints
                : allEndpoints.stream().filter(e -> e.getCategory().equals(category)).toList();

        // Build category counts
        Map<String, Long> counts = allEndpoints.stream()
                .collect(Collectors.groupingBy(EndpointSummary::getCategory, Collectors.counting()));

        List<CategoryInfo> categories = CATEGORY_LABELS.entrySet().stream()
                .sorted(Comparator.comparingInt(e -> List.of("user", "quote", "order", "card", "config", "merchant").indexOf(e.getKey())))
                .map(e -> {
                    CategoryInfo c = new CategoryInfo();
                    c.setKey(e.getKey());
                    c.setLabel(e.getValue());
                    c.setCount(counts.getOrDefault(e.getKey(), 0L).intValue());
                    return c;
                })
                .toList();

        EndpointListResult result = new EndpointListResult();
        result.setCategories(categories);
        result.setEndpoints(filtered);
        return result;
    }

    public Optional<EndpointDetail> getEndpointDetail(String operationId) {
        return Optional.ofNullable(detailMap.get(operationId));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractParameters(Map<String, Object> operation, Map<String, Object> spec) {
        List<Map<String, Object>> params = (List<Map<String, Object>>) operation.getOrDefault("parameters", List.of());
        List<Map<String, Object>> resolved = new ArrayList<>();
        for (Map<String, Object> param : params) {
            if (param.containsKey("$ref")) {
                String ref = (String) param.get("$ref");
                Map<String, Object> resolved0 = resolveRef(ref, spec);
                if (resolved0 != null) resolved.add(resolved0);
            } else {
                resolved.add(param);
            }
        }
        return resolved;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractRequestBody(Map<String, Object> operation) {
        return (Map<String, Object>) operation.get("requestBody");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractResponses(Map<String, Object> operation) {
        return (Map<String, Object>) operation.getOrDefault("responses", Map.of());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> resolveRef(String ref, Map<String, Object> spec) {
        // e.g. #/components/parameters/AppId
        String[] parts = ref.replace("#/", "").split("/");
        Object current = spec;
        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(part);
            } else {
                return null;
            }
        }
        return current instanceof Map ? (Map<String, Object>) current : null;
    }

    private String buildAiContextBlock(EndpointDetail detail) {
        StringBuilder sb = new StringBuilder();
        sb.append("## API Endpoint: ").append(detail.getSummary()).append("\n\n");
        sb.append("- **Method**: ").append(detail.getMethod()).append("\n");
        sb.append("- **Path**: ").append(detail.getPath()).append("\n");
        sb.append("- **Category**: ").append(detail.getTag()).append("\n\n");
        sb.append("### Description\n").append(detail.getDescription()).append("\n\n");

        if (detail.getRequestBody() != null) {
            sb.append("### Request Body\n```json\n");
            sb.append(formatJson(detail.getRequestBody()));
            sb.append("\n```\n\n");
        }

        sb.append("### Authentication\n");
        sb.append("Required headers: `appId`, `timestamp`, `signature`\n");
        sb.append("Signature: `SHA256withRSA(appId=[appId]&timestamp=[timestamp])`\n\n");

        sb.append("### Usage Hint\n");
        sb.append("Use this endpoint to ").append(detail.getDescription().toLowerCase()).append("\n");

        return sb.toString();
    }

    private String formatJson(Object obj) {
        try {
            return new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }
}
