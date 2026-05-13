package com.axon.bestpractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BestPracticeRepository extends JpaRepository<BestPractice, UUID> {

    Page<BestPractice> findByStatus(BpStatus status, Pageable pageable);

    Page<BestPractice> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String name, String desc, Pageable pageable);

    @Query("SELECT DISTINCT bp FROM BestPractice bp JOIN bp.creators c WHERE c.id = :userId")
    Page<BestPractice> findByCreatorId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT DISTINCT bp FROM BestPractice bp JOIN bp.creators c WHERE c.id = :userId AND bp.status = :status")
    Page<BestPractice> findByCreatorIdAndStatus(@Param("userId") UUID userId, @Param("status") BpStatus status, Pageable pageable);

    @Modifying
    @Query("UPDATE BestPractice bp SET bp.likeCount = bp.likeCount + 1 WHERE bp.id = :id")
    void incrementLikeCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE BestPractice bp SET bp.likeCount = bp.likeCount - 1 WHERE bp.id = :id")
    void decrementLikeCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE BestPractice bp SET bp.viewCount = bp.viewCount + 1 WHERE bp.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE BestPractice bp SET bp.downloadCount = bp.downloadCount + 1 WHERE bp.id = :id")
    void incrementDownloadCount(@Param("id") UUID id);

    @Query("SELECT bp.likeCount FROM BestPractice bp WHERE bp.id = :id")
    int getLikeCount(@Param("id") UUID id);

    long countByStatus(BpStatus status);

    // Top 5 BPs by download count (for dashboard)
    @Query("SELECT bp.id, bp.name, bp.downloadCount FROM BestPractice bp WHERE bp.status = com.axon.bestpractice.BpStatus.PUBLISHED ORDER BY bp.downloadCount DESC")
    List<Object[]> findTop5ByDownloadCount(Pageable pageable);

    // Count published BPs per job
    @Query("SELECT j.id, j.name, COUNT(DISTINCT bp.id) FROM BestPractice bp JOIN bp.jobs j WHERE bp.status = com.axon.bestpractice.BpStatus.PUBLISHED GROUP BY j.id, j.name ORDER BY COUNT(DISTINCT bp.id) DESC")
    List<Object[]> countPublishedByJob();

    // Count published BPs per AI capability
    @Query("SELECT ac.id, ac.name, COUNT(DISTINCT bp.id) FROM BestPractice bp JOIN bp.aiCapabilities ac WHERE bp.status = com.axon.bestpractice.BpStatus.PUBLISHED GROUP BY ac.id, ac.name ORDER BY COUNT(DISTINCT bp.id) DESC")
    List<Object[]> countPublishedByAiCapability();

    // Top 5 works by published BP count
    @Query("SELECT bp.work.id, bp.work.name, bp.work.workCategory.name, COUNT(bp.id) as cnt FROM BestPractice bp WHERE bp.status = com.axon.bestpractice.BpStatus.PUBLISHED AND bp.work IS NOT NULL GROUP BY bp.work.id, bp.work.name, bp.work.workCategory.name ORDER BY cnt DESC")
    List<Object[]> findTop5WorksByBpCount(Pageable pageable);

    // Total distinct creators of published BPs
    @Query("SELECT COUNT(DISTINCT c.id) FROM BestPractice bp JOIN bp.creators c WHERE bp.status = com.axon.bestpractice.BpStatus.PUBLISHED")
    long countDistinctCreatorsOfPublishedBPs();

    // Count published BPs by creator department (native query)
    @Query(value = "SELECT u.department, COUNT(DISTINCT bp.id) as cnt FROM best_practices bp JOIN bp_creators bpc ON bp.id = bpc.bp_id JOIN users u ON bpc.user_id = u.id WHERE bp.status = 'PUBLISHED' GROUP BY u.department ORDER BY cnt DESC", nativeQuery = true)
    List<Object[]> countPublishedByCreatorDepartment();
}
