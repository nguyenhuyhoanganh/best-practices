package com.axon.file.dto;

import com.axon.file.BpFile;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record FileResponse(
        UUID id,
        @JsonProperty("file_name") String fileName,
        @JsonProperty("file_size") long fileSize,
        @JsonProperty("mime_type") String mimeType,
        @JsonProperty("uploaded_at") LocalDateTime uploadedAt
) {
    public static FileResponse from(BpFile f) {
        return new FileResponse(f.getId(), f.getFileName(), f.getFileSize(), f.getMimeType(), f.getUploadedAt());
    }
}
