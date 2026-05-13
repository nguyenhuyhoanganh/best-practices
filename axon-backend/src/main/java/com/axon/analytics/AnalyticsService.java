package com.axon.analytics;

import com.axon.analytics.dto.AnalyticsResponse;
import com.axon.bestpractice.BestPractice;
import com.axon.bestpractice.BestPracticeRepository;
import com.axon.interaction.BpDownloadRepository;
import com.axon.interaction.BpFeedback;
import com.axon.interaction.BpFeedbackRepository;
import com.axon.interaction.FeedbackService;
import com.axon.interaction.dto.FeedbackResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BestPracticeRepository bpRepository;
    private final BpFeedbackRepository feedbackRepository;
    private final BpDownloadRepository downloadRepository;
    private final FeedbackService feedbackService;

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(UUID bpId) {
        BestPractice bp = bpRepository.findById(bpId)
            .orElseThrow(() -> new RuntimeException("BP not found: " + bpId));

        long feedbackCount = feedbackRepository.countByBpId(bpId);
        List<FeedbackResponse> recentFeedback = feedbackRepository.findTop5ByBpIdOrderByCreatedAtDesc(bpId)
            .stream().map(feedbackService::toDto).toList();

        List<AnalyticsResponse.WeekCount> byWeek = downloadRepository.countByWeekForBp(bpId).stream()
            .map(row -> new AnalyticsResponse.WeekCount((String) row[0], ((Number) row[1]).longValue()))
            .toList();

        return new AnalyticsResponse(
            bp.getViewCount(), bp.getDownloadCount(), bp.getLikeCount(),
            feedbackCount, recentFeedback, byWeek
        );
    }
}
