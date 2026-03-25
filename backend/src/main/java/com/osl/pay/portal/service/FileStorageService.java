package com.osl.pay.portal.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * File storage abstraction. Local filesystem for dev, S3 for production.
 */
public interface FileStorageService {

    /**
     * Save a file and return the storage path/key.
     */
    String store(String directory, String fileName, MultipartFile file);

    /**
     * Delete a file by its path/key.
     */
    void delete(String path);
}
