package com.axon.lookup.work;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkRepository extends JpaRepository<Work, UUID> {

    List<Work> findByWorkCategoryIdAndIsActiveTrueOrderByNameAsc(UUID workCategoryId);

    List<Work> findByIsActiveTrueOrderByNameAsc();

    boolean existsByCodeAndIsActiveTrue(String code);

    Optional<Work> findByIdAndIsActiveTrue(UUID id);
}
