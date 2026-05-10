package com.axon.file.dto;

import com.axon.file.BestPracticeFile;
import java.time.Instant;
import java.util.UUID;

public record FileResponse(
    UUID id,
    String fileName,
    long fileSize,
    String mimeType,
    Instant uploadedAt
) {
    public static FileResponse from(BestPracticeFile f) {
        return new FileResponse(
            f.getId(),
            f.getFileName(),
            f.getFileSize(),
            f.getMimeType(),
            f.getUploadedAt()
        );
    }
}
