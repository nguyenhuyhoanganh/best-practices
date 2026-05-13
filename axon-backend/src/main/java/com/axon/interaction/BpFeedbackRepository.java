package com.axon.interaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BpFeedbackRepository extends JpaRepository<BpFeedback, UUID> {

    Page<BpFeedback> findByBpIdOrderByCreatedAtDesc(UUID bpId, Pageable pageable);

    List<BpFeedback> findTop5ByBpIdOrderByCreatedAtDesc(UUID bpId);

    long countByBpId(UUID bpId);
}
