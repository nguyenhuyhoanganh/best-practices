package com.axon.file;

import com.axon.file.dto.FileResponse;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class FileService {
    private final MinioClient minio;
    private final BestPracticeFileRepository repository;
    
    @Value("${minio.bucket}")
    private String bucket;

    public FileResponse upload(UUID bpId, MultipartFile file) {
        String fileId = UUID.randomUUID().toString();
        String key = bpId + "/" + fileId + "/" + file.getOriginalFilename();
        
        try {
            minio.putObject(PutObjectArgs.builder()
                .bucket(bucket)
                .object(key)
                .stream(file.getInputStream(), file.getSize(), -1)
                .contentType(file.getContentType())
                .build());
        } catch (Exception e) {
            throw new RuntimeException("File upload failed", e);
        }
        
        var saved = repository.save(BestPracticeFile.builder()
            .bestPracticeId(bpId)
            .fileName(file.getOriginalFilename())
            .fileSize(file.getSize())
            .mimeType(file.getContentType())
            .storageKey(key)
            .build());
            
        return FileResponse.from(saved);
    }

    public String generateDownloadUrl(UUID fileId) {
        var file = repository.findById(fileId)
            .orElseThrow(() -> new IllegalArgumentException("File not found"));
            
        try {
            return minio.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .bucket(bucket)
                .object(file.getStorageKey())
                .method(Method.GET)
                .expiry(15, TimeUnit.MINUTES)
                .build());
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate download URL", e);
        }
    }

    public List<FileResponse> listByBestPractice(UUID bpId) {
        return repository.findByBestPracticeId(bpId).stream()
            .map(FileResponse::from).toList();
    }
}
