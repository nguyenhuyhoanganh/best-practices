package com.axon.lookup.workcategory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkCategoryRepository extends JpaRepository<WorkCategory, UUID> {

    List<WorkCategory> findByJobIdAndIsActiveTrueOrderByNameAsc(UUID jobId);

    List<WorkCategory> findByIsActiveTrueOrderByNameAsc();

    boolean existsByJobIdAndNameAndIsActiveTrue(UUID jobId, String name);

    Optional<WorkCategory> findByIdAndIsActiveTrue(UUID id);
}
