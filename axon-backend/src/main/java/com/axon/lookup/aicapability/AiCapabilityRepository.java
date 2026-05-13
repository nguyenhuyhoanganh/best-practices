package com.axon.lookup.aicapability;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiCapabilityRepository extends JpaRepository<AiCapability, UUID> {

    List<AiCapability> findByIsActiveTrueOrderByDisplayOrderAscNameAsc();

    boolean existsByNameAndIsActiveTrue(String name);

    Optional<AiCapability> findByIdAndIsActiveTrue(UUID id);
}
