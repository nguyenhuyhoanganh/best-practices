package com.axon.approval;

import com.axon.bestpractice.*;
import com.axon.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.axon.approval.dto.AdminStatsResponse;
import com.axon.user.UserRepository;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

...

@Service
@RequiredArgsConstructor
public class ApprovalService {
    private final BestPracticeRepository bpRepo;
    private final ApprovalRepository approvalRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;

    public AdminStatsResponse getStats() {
        var allBps = bpRepo.findAll();

        Map<String, Long> byType = new HashMap<>();
        Map<String, Long> byRole = new HashMap<>();

        long totalViews = 0;
        long totalDownloads = 0;

        for (var bp : allBps) {
            totalViews += bp.getViewCount();
            totalDownloads += bp.getDownloadCount();

            for (String t : bp.getTypes()) {
                byType.put(t, byType.getOrDefault(t, 0L) + 1);
            }
            for (String tag : bp.getTags()) {
                // Heuristic: check if tag is one of our roles
                if (Arrays.asList("backend", "frontend", "devops", "ba", "pm", "mobile").contains(tag.toLowerCase())) {
                    byRole.put(tag.toLowerCase(), byRole.getOrDefault(tag.toLowerCase(), 0L) + 1);
                }
            }
        }

        return new AdminStatsResponse(
            userRepo.count(),
            allBps.size(),
            allBps.stream().filter(x -> x.getStatus() == BestPracticeStatus.PENDING_REVIEW).count(),
            allBps.stream().filter(x -> x.getStatus() == BestPracticeStatus.PUBLISHED).count(),
            byType,
            byRole,
            totalViews,
            totalDownloads
        );
    }
...

        return bpRepo.findByStatusIn(List.of(
            BestPracticeStatus.PENDING_REVIEW, BestPracticeStatus.UNDER_REVIEW));
    }

    @Transactional
    public BestPractice take(UUID bpId, UUID adminId) {
        BestPractice bp = bpRepo.findById(bpId).orElseThrow();
        if (bp.getStatus() != BestPracticeStatus.PENDING_REVIEW) {
            throw new IllegalStateException("Must be PENDING_REVIEW to take");
        }
        
        bp.setStatus(BestPracticeStatus.UNDER_REVIEW);
        
        var approval = Approval.builder()
            .bestPracticeId(bpId)
            .reviewerId(adminId)
            .status(ApprovalStatus.PENDING)
            .build();
            
        approvalRepo.save(approval);
        return bpRepo.save(bp);
    }

    @Transactional
    public BestPractice approve(UUID bpId, UUID adminId) {
        BestPractice bp = bpRepo.findById(bpId).orElseThrow();
        if (!bp.getStatus().canApproveOrReject()) {
            throw new IllegalStateException("Cannot approve in status: " + bp.getStatus());
        }
        
        bp.setStatus(BestPracticeStatus.PUBLISHED);
        bp.setPublishedAt(Instant.now());
        
        approvalRepo.findTopByBestPracticeIdOrderByCreatedAtDesc(bpId).ifPresent(a -> {
            a.setStatus(ApprovalStatus.APPROVED);
            a.setReviewerId(adminId);
            a.setReviewedAt(Instant.now());
            approvalRepo.save(a);
        });
        
        notificationService.notifyApproved(bp);
        return bpRepo.save(bp);
    }

    @Transactional
    public BestPractice reject(UUID bpId, UUID adminId, String comment) {
        if (comment == null || comment.isBlank()) {
            throw new IllegalArgumentException("Reject requires a comment");
        }
        
        BestPractice bp = bpRepo.findById(bpId).orElseThrow();
        if (!bp.getStatus().canApproveOrReject()) {
            throw new IllegalStateException("Cannot reject in status: " + bp.getStatus());
        }
        
        bp.setStatus(BestPracticeStatus.REJECTED);
        
        approvalRepo.findTopByBestPracticeIdOrderByCreatedAtDesc(bpId).ifPresent(a -> {
            a.setStatus(ApprovalStatus.REJECTED);
            a.setReviewerId(adminId);
            a.setComment(comment);
            a.setReviewedAt(Instant.now());
            approvalRepo.save(a);
        });
        
        notificationService.notifyRejected(bp, comment);
        return bpRepo.save(bp);
    }
}
