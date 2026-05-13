package com.axon.bestpractice;

import com.axon.analytics.AnalyticsService;
import com.axon.analytics.dto.AnalyticsResponse;
import com.axon.bestpractice.dto.BestPracticeDetailDto;
import com.axon.bestpractice.dto.BestPracticeListItemDto;
import com.axon.bestpractice.dto.BestPracticeRequest;
import com.axon.file.BpFile;
import com.axon.file.FileService;
import com.axon.file.dto.FileResponse;
import com.axon.interaction.BpFeedback;
import com.axon.interaction.FeedbackService;
import com.axon.interaction.dto.FeedbackRequest;
import com.axon.interaction.dto.FeedbackResponse;
import com.axon.interaction.dto.LikeResult;
import com.axon.user.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Best Practices", description = "CRUD, files, feedback, likes, analytics for best practices")
@RestController
@RequestMapping("/api/v1/best-practices")
@RequiredArgsConstructor
public class BestPracticeController {

    private final BestPracticeService bestPracticeService;
    private final FileService fileService;
    private final FeedbackService feedbackService;
    private final AnalyticsService analyticsService;

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) return null;
        return UUID.fromString((String) auth.getPrincipal());
    }

    private UserRole currentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .filter(r -> r.equals("ADMIN") || r.equals("AX_SUPPORTER") || r.equals("AX_CREATOR"))
                .findFirst()
                .map(UserRole::valueOf)
                .orElse(UserRole.USER);
    }

    @Operation(summary = "List published best practices", description = "Public endpoint. Supports pagination and sorting.")
    @ApiResponse(responseCode = "200", description = "Paginated list of published BPs")
    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Page<BestPractice> result = bestPracticeService.listPublished(page, size, sortBy, sortDir);
        UUID userId = currentUserId();
        List<BestPracticeListItemDto> content = result.getContent().stream()
                .map(bp -> BestPracticeListItemDto.from(bp, bestPracticeService.isLiked(bp.getId(), userId)))
                .toList();
        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "page", result.getNumber()
        ));
    }

    @Operation(summary = "Get best practice by ID", description = "Public endpoint. key_value masked for USER role unless they are a creator.")
    @ApiResponse(responseCode = "200", description = "Best practice detail")
    @ApiResponse(responseCode = "404", description = "Not found")
    @GetMapping("/{id}")
    public ResponseEntity<BestPracticeDetailDto> getById(@PathVariable UUID id) {
        BestPractice bp = bestPracticeService.findById(id);
        UUID userId = currentUserId();
        UserRole role = currentRole();
        bestPracticeService.incrementViewCount(bp.getId());
        return ResponseEntity.ok(bestPracticeService.toDetailDto(bp, userId, role != null ? role : UserRole.USER));
    }

    @Operation(summary = "Create best practice", description = "Requires AX_CREATOR role. Status set to REQUESTED. Creator auto-assigned if first submission.")
    @ApiResponse(responseCode = "201", description = "BP created and in review queue")
    @ApiResponse(responseCode = "403", description = "Insufficient role")
    @PostMapping
    @PreAuthorize("hasRole('AX_CREATOR')")
    public ResponseEntity<BestPracticeDetailDto> create(@RequestBody BestPracticeRequest req) {
        UUID userId = currentUserId();
        BestPractice bp = bestPracticeService.create(req, userId);
        return ResponseEntity.status(201).body(bestPracticeService.toDetailDto(bp, userId, currentRole()));
    }

    @Operation(summary = "Update best practice", description = "Only creator or ADMIN. If PUBLISHED and web_content changes, status resets to REQUESTED.")
    @ApiResponse(responseCode = "200", description = "Updated BP")
    @ApiResponse(responseCode = "403", description = "Not a creator or admin")
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BestPracticeDetailDto> update(@PathVariable UUID id, @RequestBody BestPracticeRequest req) {
        BestPractice bp = bestPracticeService.update(id, req, currentUserId());
        return ResponseEntity.ok(bestPracticeService.toDetailDto(bp, currentUserId(), currentRole()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        bestPracticeService.delete(id, currentUserId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle like", description = "Like if not liked, unlike if already liked. Returns new like state.")
    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LikeResult> toggleLike(@PathVariable UUID id) {
        return ResponseEntity.ok(bestPracticeService.toggleLike(id, currentUserId()));
    }

    @Operation(summary = "Upload file to best practice", description = "Multipart upload. Stored as UUID-prefixed filename under /app/uploads/{bpId}/. Max 50MB.")
    @ApiResponse(responseCode = "201", description = "File uploaded")
    @PostMapping("/{id}/files")
    @PreAuthorize("hasRole('AX_CREATOR')")
    public ResponseEntity<FileResponse> uploadFile(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        BpFile bpFile = fileService.upload(id, file, currentUserId());
        return ResponseEntity.status(201).body(FileResponse.from(bpFile));
    }

    @Operation(summary = "Download file", description = "Returns file as attachment. Increments download count asynchronously.")
    @ApiResponse(responseCode = "200", description = "File content as attachment")
    @GetMapping("/{id}/files/{fileId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID id, @PathVariable UUID fileId) {
        BpFile meta = fileService.findFile(id, fileId);
        Resource resource = fileService.download(id, fileId);
        bestPracticeService.logDownload(id, currentUserId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getFileName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, meta.getMimeType())
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(meta.getFileSize()))
                .body(resource);
    }

    @DeleteMapping("/{id}/files/{fileId}")
    @PreAuthorize("hasRole('AX_CREATOR')")
    public ResponseEntity<Void> deleteFile(@PathVariable UUID id, @PathVariable UUID fileId) throws IOException {
        fileService.deleteFile(id, fileId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/feedback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getFeedback(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BpFeedback> result = feedbackService.list(id, page, size);
        return ResponseEntity.ok(Map.of(
                "content", result.getContent().stream().map(feedbackService::toDto).toList(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "page", result.getNumber()
        ));
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FeedbackResponse> addFeedback(
            @PathVariable UUID id,
            @RequestBody FeedbackRequest req) {
        BpFeedback fb = feedbackService.create(id, req.content(), currentUserId());
        return ResponseEntity.status(201).body(feedbackService.toDto(fb));
    }

    // GET /api/v1/best-practices/{id}/analytics
    @Operation(summary = "Get BP analytics", description = "Per-BP analytics: view/download/like counts, weekly download breakdown, recent feedback.")
    @GetMapping("/{id}/analytics")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AnalyticsResponse> getAnalytics(@PathVariable UUID id) {
        return ResponseEntity.ok(analyticsService.getAnalytics(id));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(403).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(InvalidStateException.class)
    public ResponseEntity<Map<String, String>> handleInvalidState(InvalidStateException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
