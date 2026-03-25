package com.osl.pay.portal.service.impl;

import com.osl.pay.portal.common.exception.BizException;
import com.osl.pay.portal.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * S3 storage for production environment.
 * TODO: Implement with AWS SDK when deploying to production.
 */
@Slf4j
@Service
@Profile("prod")
public class S3FileStorageService implements FileStorageService {

    @Value("${oslpay.s3.bucket:oslpay-merchant-docs}")
    private String bucket;

    @Value("${oslpay.s3.region:ap-east-1}")
    private String region;

    @Override
    public String store(String directory, String fileName, MultipartFile file) {
        String key = directory + "/" + fileName;

        // TODO: Replace with actual S3 upload
        // S3Client s3 = S3Client.builder().region(Region.of(region)).build();
        // s3.putObject(PutObjectRequest.builder().bucket(bucket).key(key).build(),
        //              RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        log.warn("S3 upload not yet implemented — file key: s3://{}/{}", bucket, key);
        throw new BizException(50000, "S3 存储尚未配置，请联系运维团队");
    }

    @Override
    public void delete(String path) {
        // TODO: Replace with actual S3 delete
        // S3Client s3 = S3Client.builder().region(Region.of(region)).build();
        // s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(path).build());

        log.warn("S3 delete not yet implemented — key: s3://{}/{}", bucket, path);
    }
}
