package com.axon.interaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BpLikeRepository extends JpaRepository<BpLike, BpLikeId> {

    boolean existsByIdBpIdAndIdUserId(UUID bpId, UUID userId);

    void deleteByIdBpIdAndIdUserId(UUID bpId, UUID userId);
}
