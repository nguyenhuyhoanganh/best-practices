package com.axon.file;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BestPracticeFileRepository extends JpaRepository<BestPracticeFile, UUID> {
    List<BestPracticeFile> findByBestPracticeId(UUID bestPracticeId);
}
