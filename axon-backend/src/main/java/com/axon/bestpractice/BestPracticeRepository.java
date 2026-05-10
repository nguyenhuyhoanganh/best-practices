package com.axon.bestpractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BestPracticeRepository extends JpaRepository<BestPractice, UUID> {

    @Query(value = """
        SELECT * FROM best_practices bp
        WHERE bp.status = 'PUBLISHED'
          AND (:type IS NULL OR :type = ANY(bp.types))
          AND (:search IS NULL OR lower(bp.title) LIKE lower(concat('%', :search, '%'))
               OR lower(bp.description) LIKE lower(concat('%', :search, '%')))
        """, nativeQuery = true)
    Page<BestPractice> findPublished(String type, String search, Pageable pageable);

    List<BestPractice> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<BestPractice> findByStatusIn(List<BestPracticeStatus> statuses);

    @Query("SELECT bp.id FROM BestPractice bp WHERE bp.status = 'PUBLISHED'")
    List<UUID> findAllPublishedIds();

    @Modifying
    @Query("UPDATE BestPractice bp SET bp.usageScore = :score WHERE bp.id = :id")
    void updateUsageScore(UUID id, double score);

    List<BestPractice> findTop10ByStatusOrderByUsageScoreDesc(BestPracticeStatus status);

    Optional<BestPractice> findByAgentWorkflowId(String agentWorkflowId);
}
