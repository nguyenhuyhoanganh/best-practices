package com.axon.management;

import com.axon.bestpractice.BestPractice;
import com.axon.bestpractice.BestPracticeService;
import com.axon.bestpractice.BpStatus;
import com.axon.bestpractice.ForbiddenException;
import com.axon.bestpractice.InvalidStateException;
import com.axon.bestpractice.dto.BestPracticeDetailDto;
import com.axon.bestpractice.dto.BestPracticeListItemDto;
import com.axon.management.dto.CloseRequest;
import com.axon.management.dto.ReviewRequest;
import com.axon.management.dto.ReviewResponse;
import com.axon.user.UserRole;
import com.axon.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Management", description = "Review queue for AX_SUPPORTER and ADMIN: approve, reject, close best practices")
@RestController
@RequestMapping("/api/v1/management")
@RequiredArgsConstructor
@PreAuthorize("hasRole('AX_SUPPORTER')")
public class ManagementController {

    private final BestPracticeService bestPracticeService;
    private final UserService userService;

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) return null;
        return UUID.fromString((String) auth.getPrincipal());
    }

    @Operation(summary = "List all BPs in management queue", description = "Filter by status (REQUESTED/PUBLISHED/REJECTED) and free-text search")
    @GetMapping("/best-practices")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) BpStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BestPractice> result = bestPracticeService.listForManagement(status, search, page, size);
        List<BestPracticeListItemDto> content = result.getContent().stream()
                .map(bp -> BestPracticeListItemDto.from(bp, false))
                .toList();
        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "page", result.getNumber()
        ));
    }

    @GetMapping("/best-practices/{id}")
    public ResponseEntity<BestPracticeDetailDto> getById(@PathVariable UUID id) {
        BestPractice bp = bestPracticeService.findById(id);
        UUID userId = currentUserId();
        return ResponseEntity.ok(bestPracticeService.toDetailDto(bp, userId, UserRole.AX_SUPPORTER));
    }

    @Operation(summary = "Approve best practice", description = "Sets status to PUBLISHED. Reviewer cannot approve their own submission.")
    @ApiResponse(responseCode = "200", description = "BP approved and published")
    @ApiResponse(responseCode = "403", description = "Self-approval not allowed")
    @PutMapping("/best-practices/{id}/approve")
    public ResponseEntity<BestPracticeDetailDto> approve(@PathVariable UUID id) {
        UUID userId = currentUserId();
        BestPractice bp = bestPracticeService.approve(id, userId);
        return ResponseEntity.ok(bestPracticeService.toDetailDto(bp, userId, UserRole.AX_SUPPORTER));
    }

    @Operation(summary = "Reject best practice", description = "Sets status to REJECTED. Requires a rejection comment.")
    @PutMapping("/best-practices/{id}/reject")
    public ResponseEntity<BestPracticeDetailDto> reject(@PathVariable UUID id, @RequestBody ReviewRequest req) {
        UUID userId = currentUserId();
        BestPractice bp = bestPracticeService.reject(id, userId, req.comment());
        return ResponseEntity.ok(bestPracticeService.toDetailDto(bp, userId, UserRole.AX_SUPPORTER));
    }

    @Operation(summary = "Close best practice", description = "Sets status to REJECTED and records close_reason. Used for administrative closure.")
    @PutMapping("/best-practices/{id}/close")
    public ResponseEntity<BestPracticeDetailDto> close(@PathVariable UUID id, @RequestBody CloseRequest req) {
        UUID userId = currentUserId();
        BestPractice bp = bestPracticeService.close(id, userId, req.reason());
        return ResponseEntity.ok(bestPracticeService.toDetailDto(bp, userId, UserRole.AX_SUPPORTER));
    }

    @GetMapping("/reviews/{bpId}")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable UUID bpId) {
        List<BpReview> reviews = bestPracticeService.getReviews(bpId);
        List<ReviewResponse> resp = reviews.stream().map(r -> {
            String reviewerName = r.getReviewerId() != null
                    ? userService.findById(r.getReviewerId()).getName()
                    : "Unknown";
            return new ReviewResponse(
                    r.getId(),
                    r.getAction(),
                    r.getComment(),
                    new ReviewResponse.ReviewerDto(r.getReviewerId(), reviewerName),
                    r.getReviewedAt()
            );
        }).toList();
        return ResponseEntity.ok(resp);
    }

    @ExceptionHandler({ForbiddenException.class, InvalidStateException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, String>> handleErrors(RuntimeException ex) {
        int status = ex instanceof ForbiddenException ? 403 : 400;
        return ResponseEntity.status(status).body(Map.of("error", ex.getMessage()));
    }
}
