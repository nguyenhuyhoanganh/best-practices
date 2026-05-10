package com.axon.approval;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ApprovalRepository extends JpaRepository<Approval, UUID> {
    Optional<Approval> findTopByBestPracticeIdOrderByCreatedAtDesc(UUID bpId);
}
