package com.axon.management;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BpReviewRepository extends JpaRepository<BpReview, UUID> {

    List<BpReview> findByBpIdOrderByReviewedAtDesc(UUID bpId);
}
