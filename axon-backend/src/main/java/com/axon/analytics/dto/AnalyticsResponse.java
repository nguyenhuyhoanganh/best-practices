package com.axon.analytics.dto;

import com.axon.interaction.dto.FeedbackResponse;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AnalyticsResponse(
    @JsonProperty("view_count") int viewCount,
    @JsonProperty("download_count") int downloadCount,
    @JsonProperty("like_count") int likeCount,
    @JsonProperty("feedback_count") long feedbackCount,
    @JsonProperty("recent_feedback") List<FeedbackResponse> recentFeedback,
    @JsonProperty("downloads_by_week") List<WeekCount> downloadsByWeek
) {
    public record WeekCount(String week, long count) {}
}
