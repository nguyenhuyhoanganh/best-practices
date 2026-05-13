package com.axon.bestpractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
