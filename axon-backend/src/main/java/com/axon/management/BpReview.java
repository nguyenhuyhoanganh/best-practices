package com.axon.management;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bp_reviews")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class BpReview {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "bp_id", nullable = false)
    private UUID bpId;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "review_action", nullable = false)
    private ReviewAction action;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "reviewed_at", nullable = false, updatable = false)
    private LocalDateTime reviewedAt;

    public static BpReview approved(UUID bpId, UUID reviewerId) {
        return BpReview.builder()
                .bpId(bpId)
                .reviewerId(reviewerId)
                .action(ReviewAction.APPROVED)
                .build();
    }

    public static BpReview rejected(UUID bpId, UUID reviewerId, String comment) {
        return BpReview.builder()
                .bpId(bpId)
                .reviewerId(reviewerId)
                .action(ReviewAction.REJECTED)
                .comment(comment)
                .build();
    }

    public static BpReview closed(UUID bpId, UUID reviewerId, String reason) {
        return BpReview.builder()
                .bpId(bpId)
                .reviewerId(reviewerId)
                .action(ReviewAction.CLOSED)
                .comment(reason)
                .build();
    }
}
