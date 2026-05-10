package com.axon.approval;

import com.axon.bestpractice.dto.BestPracticeListItem;
import com.axon.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/best-practices")
@RequiredArgsConstructor
public class AdminBestPracticeController {
    private final ApprovalService approvalService;

    @GetMapping("/queue")
    public ResponseEntity<List<BestPracticeListItem>> queue() {
        return ResponseEntity.ok(approvalService.getQueue().stream()
            .map(BestPracticeListItem::from).toList());
    }

    @GetMapping("/stats")
    public ResponseEntity<com.axon.approval.dto.AdminStatsResponse> stats() {
        return ResponseEntity.ok(approvalService.getStats());
    }

    @PutMapping("/{id}/take")
    public ResponseEntity<BestPracticeListItem> take(
        @PathVariable UUID id, @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(BestPracticeListItem.from(approvalService.take(id, admin.getId())));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<BestPracticeListItem> approve(
        @PathVariable UUID id, @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(BestPracticeListItem.from(approvalService.approve(id, admin.getId())));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<BestPracticeListItem> reject(
        @PathVariable UUID id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(BestPracticeListItem.from(
            approvalService.reject(id, admin.getId(), body.get("comment"))));
    }
}
