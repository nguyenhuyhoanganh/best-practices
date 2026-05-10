package com.axon.approval;

import com.axon.bestpractice.*;
import com.axon.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApprovalService {
    private final BestPracticeRepository bpRepo;
    private final ApprovalRepository approvalRepo;
    private final NotificationService notificationService;

    public List<BestPractice> getQueue() {
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
