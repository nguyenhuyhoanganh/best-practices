package com.axon.lookup.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    List<Job> findByIsActiveTrueOrderByDisplayOrderAscNameAsc();

    boolean existsByNameAndIsActiveTrue(String name);

    Optional<Job> findByIdAndIsActiveTrue(UUID id);
}
