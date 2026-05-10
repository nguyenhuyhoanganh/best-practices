package com.axon.usage;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface UsageLogRepository extends JpaRepository<UsageLog, UUID> {
    List<UsageLog> findByBestPracticeIdAndCreatedAtAfter(UUID bpId, Instant cutoff);
}
