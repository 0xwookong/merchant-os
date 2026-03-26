package com.osl.pay.portal.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.osl.pay.portal.common.audit.AuditService;
import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.model.dto.DomainResponse;
import com.osl.pay.portal.model.entity.DomainWhitelist;
import com.osl.pay.portal.model.entity.MerchantUser;
import com.osl.pay.portal.repository.DomainWhitelistMapper;
import com.osl.pay.portal.repository.MerchantUserMapper;
import com.osl.pay.portal.service.DomainService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DomainServiceImpl implements DomainService {

    private final DomainWhitelistMapper domainMapper;
    private final MerchantUserMapper merchantUserMapper;
    private final AuditService auditService;

    @Override
    public List<DomainResponse> list(Long merchantId) {
        return domainMapper.selectList(
                new LambdaQueryWrapper<DomainWhitelist>()
                        .eq(DomainWhitelist::getMerchantId, merchantId)
                        .orderByDesc(DomainWhitelist::getCreatedAt))
                .stream().map(this::toResponse).toList();
    }

    @Override
    public DomainResponse add(Long merchantId, Long userId, String domain, HttpServletRequest httpRequest) {
        validateDomain(domain);

        // Check duplicate
        Long count = domainMapper.selectCount(
                new LambdaQueryWrapper<DomainWhitelist>()
                        .eq(DomainWhitelist::getMerchantId, merchantId)
                        .eq(DomainWhitelist::getDomain, domain));
        if (count > 0) {
            throw new BizException(40000, "该域名已存在");
        }

        DomainWhitelist entry = new DomainWhitelist();
        entry.setMerchantId(merchantId);
        entry.setDomain(domain);
        domainMapper.insert(entry);

        log.info("Domain added: merchantId={}, domain={}", merchantId, domain);

        MerchantUser user = merchantUserMapper.selectById(userId);
        auditService.log("DOMAIN_ADDED", userId, merchantId,
                user != null ? user.getEmail() : null, httpRequest, true,
                "Added domain: " + domain);

        return toResponse(entry);
    }

    @Override
    public void remove(Long merchantId, Long userId, Long id, HttpServletRequest httpRequest) {
        DomainWhitelist entry = domainMapper.selectById(id);
        if (entry == null || !entry.getMerchantId().equals(merchantId)) {
            throw new BizException(40400, "域名不存在");
        }
        domainMapper.deleteById(id);
        log.info("Domain removed: merchantId={}, domain={}", merchantId, entry.getDomain());

        MerchantUser user = merchantUserMapper.selectById(userId);
        auditService.log("DOMAIN_REMOVED", userId, merchantId,
                user != null ? user.getEmail() : null, httpRequest, true,
                "Removed domain: " + entry.getDomain());
    }

    private void validateDomain(String domain) {
        try {
            URI uri = URI.create(domain);
            if (uri.getScheme() == null || (!uri.getScheme().equals("https") && !uri.getScheme().equals("http"))) {
                throw new BizException(40000, "域名必须包含协议（http:// 或 https://）");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new BizException(40000, "域名格式无效");
            }
            if (domain.contains("*")) {
                throw new BizException(40000, "不支持通配符");
            }
        } catch (IllegalArgumentException e) {
            throw new BizException(40000, "域名格式无效");
        }
    }

    private DomainResponse toResponse(DomainWhitelist entry) {
        DomainResponse r = new DomainResponse();
        r.setId(entry.getId());
        r.setDomain(entry.getDomain());
        r.setCreatedAt(entry.getCreatedAt());
        return r;
    }
}
