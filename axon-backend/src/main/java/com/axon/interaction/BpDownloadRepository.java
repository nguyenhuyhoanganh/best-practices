package com.axon.interaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BpDownloadRepository extends JpaRepository<BpDownload, UUID> {

    long countByBpId(UUID bpId);

    // Total downloads in date range (null = all time)
    @Query("SELECT COUNT(d) FROM BpDownload d WHERE (:start IS NULL OR d.downloadedAt >= :start) AND (:end IS NULL OR d.downloadedAt <= :end)")
    long countByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Distinct users with downloads in date range
    @Query("SELECT COUNT(DISTINCT d.userId) FROM BpDownload d WHERE (:start IS NULL OR d.downloadedAt >= :start) AND (:end IS NULL OR d.downloadedAt <= :end)")
    long countDistinctUsersByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Downloads by month (usage_trend) — last 12 months
    @Query(value = "SELECT TO_CHAR(downloaded_at, 'YYYY-MM') as month, COUNT(*) as count FROM bp_downloads WHERE downloaded_at >= :since GROUP BY TO_CHAR(downloaded_at, 'YYYY-MM') ORDER BY month", nativeQuery = true)
    List<Object[]> countByMonth(@Param("since") LocalDateTime since);

    // Downloads by week for a specific BP (for analytics)
    @Query(value = "SELECT TO_CHAR(downloaded_at, 'IYYY-\"W\"IW') as week, COUNT(*) as count FROM bp_downloads WHERE bp_id = :bpId GROUP BY TO_CHAR(downloaded_at, 'IYYY-\"W\"IW') ORDER BY week DESC LIMIT 12", nativeQuery = true)
    List<Object[]> countByWeekForBp(@Param("bpId") UUID bpId);
}
