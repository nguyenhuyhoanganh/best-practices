package com.axon.approval;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approvals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Approval {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "best_practice_id", nullable = false)
    private UUID bestPracticeId;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(columnDefinition = "text")
    private String comment;

    private Instant reviewedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
