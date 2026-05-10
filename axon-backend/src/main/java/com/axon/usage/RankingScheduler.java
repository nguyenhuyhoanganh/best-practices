package com.axon.usage;

import com.axon.bestpractice.*;
import com.axon.bestpractice.dto.BestPracticeListItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class RankingScheduler {
    private final BestPracticeRepository bpRepo;
    private final UsageLogRepository usageLogRepo;
    private final RedisTemplate<String, Object> redis;

    @Scheduled(fixedRate = 3_600_000) // 1 hour
    @Transactional
    public void recomputeScores() {
        log.info("Recomputing usage scores...");
        Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS); // 90 days history
        List<UUID> ids = bpRepo.findAllPublishedIds();

        for (UUID bpId : ids) {
            double score = usageLogRepo
                .findByBestPracticeIdAndCreatedAtAfter(bpId, cutoff)
                .stream()
                .mapToDouble(log -> {
                    double weight = switch (log.getAction()) {
                        case VIEW -> 0.5;
                        case DOWNLOAD -> 3.0;
                        case WORKFLOW_USED -> 5.0;
                    };
                    long weeksAgo = ChronoUnit.WEEKS.between(log.getCreatedAt(), Instant.now());
                    // Decay factor: 0.8^weeksAgo
                    return weight * Math.pow(0.8, weeksAgo);
                })
                .sum();
            bpRepo.updateUsageScore(bpId, score);
        }

        List<BestPracticeListItem> trending = bpRepo
            .findTop10ByStatusOrderByUsageScoreDesc(BestPracticeStatus.PUBLISHED)
            .stream().map(BestPracticeListItem::from).toList();
        
        redis.opsForValue().set("trending", trending, Duration.ofHours(1));
        log.info("Scores recomputed for {} best practices. Trending updated in Redis.", ids.size());
    }
}
