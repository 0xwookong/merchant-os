package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Local filesystem storage for dev/test environments.
 */
@Slf4j
@Service
@Profile("!prod")
public class LocalFileStorageService implements FileStorageService {

    @Value("${oslpay.upload.path:uploads}")
    private String basePath;

    @Override
    public String store(String directory, String fileName, MultipartFile file) {
        String relativePath = directory + "/" + fileName;
        Path fullPath = Paths.get(basePath, relativePath).toAbsolutePath();

        try {
            Files.createDirectories(fullPath.getParent());
            file.transferTo(fullPath.toFile());
        } catch (IOException e) {
            log.error("Failed to save file to local storage: {}", fullPath, e);
            throw new BizException(50000, "文件保存失败");
        }

        log.info("File saved to local: {}", fullPath);
        return relativePath;
    }

    @Override
    public void delete(String path) {
        try {
            Path fullPath = Paths.get(basePath, path).toAbsolutePath();
            Files.deleteIfExists(fullPath);
            log.info("File deleted from local: {}", fullPath);
        } catch (IOException e) {
            log.warn("Failed to delete local file: {}", path, e);
        }
    }
}
