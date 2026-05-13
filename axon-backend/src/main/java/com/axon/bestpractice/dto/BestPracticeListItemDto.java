package com.axon.bestpractice.dto;

import com.axon.bestpractice.BestPractice;
import com.axon.bestpractice.BpStatus;
import com.axon.bestpractice.BpType;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BestPracticeListItemDto(
        UUID id,
        String name,
        String description,
        @JsonProperty("thumbnail_url") String thumbnailUrl,
        BpType type,
        BpStatus status,
        List<JobSummaryDto> job,
        WorkSummaryDto work,
        List<CreatorDto> creators,
        @JsonProperty("like_count") int likeCount,
        @JsonProperty("view_count") int viewCount,
        @JsonProperty("download_count") int downloadCount,
        @JsonProperty("is_liked_by_current_user") boolean isLikedByCurrentUser,
        @JsonProperty("published_at") LocalDateTime publishedAt
) {
    public static BestPracticeListItemDto from(BestPractice bp, boolean liked) {
        String desc = bp.getDescription() != null && bp.getDescription().length() > 200
                ? bp.getDescription().substring(0, 200) : bp.getDescription();
        return new BestPracticeListItemDto(
                bp.getId(),
                bp.getName(),
                desc,
                bp.getThumbnailUrl(),
                bp.getType(),
                bp.getStatus(),
                bp.getJobs().stream().map(JobSummaryDto::from).toList(),
                bp.getWork() != null ? WorkSummaryDto.from(bp.getWork()) : null,
                bp.getCreators().stream().map(CreatorDto::from).toList(),
                bp.getLikeCount(),
                bp.getViewCount(),
                bp.getDownloadCount(),
                liked,
                bp.getPublishedAt()
        );
    }
}
