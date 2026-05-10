package com.axon.file;

import com.axon.file.dto.FileResponse;
import com.axon.usage.UsageAction;
import com.axon.usage.UsageLog;
import com.axon.usage.UsageLogRepository;
import com.axon.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/best-practices/{bpId}/files")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;
    private final UsageLogRepository usageLogRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileResponse> upload(
        @PathVariable UUID bpId,
        @RequestParam MultipartFile file
    ) {
        if (file.getSize() > 50 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(fileService.upload(bpId, file));
    }

    @GetMapping
    public ResponseEntity<List<FileResponse>> list(@PathVariable UUID bpId) {
        return ResponseEntity.ok(fileService.listByBestPractice(bpId));
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Void> download(
        @PathVariable UUID bpId,
        @PathVariable UUID fileId,
        @AuthenticationPrincipal User user
    ) {
        String url = fileService.generateDownloadUrl(fileId);
        
        // Log download action
        usageLogRepository.save(UsageLog.builder()
            .bestPracticeId(bpId)
            .userId(user.getId())
            .action(UsageAction.DOWNLOAD)
            .build());
            
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(url)).build();
    }
}
