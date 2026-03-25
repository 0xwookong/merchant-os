package com.osl.pay.portal.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.model.entity.EmailTemplate;
import com.osl.pay.portal.repository.EmailTemplateMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateMapper templateMapper;

    /** Simple in-memory cache: "CODE:locale" → EmailTemplate */
    private final ConcurrentHashMap<String, EmailTemplate> cache = new ConcurrentHashMap<>();

    /**
     * Resolve a template by code and locale. Falls back to "en" if requested locale not found.
     * Returns null if no template exists at all.
     */
    public EmailTemplate getTemplate(String code, String locale) {
        String key = code + ":" + locale;
        EmailTemplate cached = cache.get(key);
        if (cached != null) return cached;

        EmailTemplate template = loadFromDb(code, locale);
        if (template == null && !"en".equals(locale)) {
            template = loadFromDb(code, "en");
        }
        if (template != null) {
            cache.put(key, template);
        }
        return template;
    }

    /**
     * Replace {var} placeholders in a string with values from the map.
     */
    public String render(String template, Map<String, String> variables) {
        if (template == null) return "";
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }

    /** Clear cache (call after template updates) */
    public void clearCache() {
        cache.clear();
    }

    private EmailTemplate loadFromDb(String code, String locale) {
        return templateMapper.selectOne(
                new LambdaQueryWrapper<EmailTemplate>()
                        .eq(EmailTemplate::getCode, code)
                        .eq(EmailTemplate::getLocale, locale)
                        .eq(EmailTemplate::getStatus, "ACTIVE"));
    }
}
