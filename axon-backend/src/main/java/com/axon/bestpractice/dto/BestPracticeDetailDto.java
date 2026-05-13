package com.axon.bestpractice.dto;

import com.axon.bestpractice.BpStatus;
import com.axon.bestpractice.BpType;
import com.axon.file.dto.FileResponse;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BestPracticeDetailDto(
        UUID id,
        String name,
        String description,
        @JsonProperty("thumbnail_url") String thumbnailUrl,
        BpType type,
        BpStatus status,
        @JsonProperty("installation_guide") String installationGuide,
        @JsonProperty("web_content") String webContent,
        @JsonProperty("key_value") String keyValue,
        @JsonProperty("ai_tools_description") String aiToolsDescription,
        @JsonProperty("close_reason") String closeReason,
        List<JobSummaryDto> job,
        @JsonProperty("ai_capability") List<AiCapabilitySummaryDto> aiCapability,
        WorkSummaryDto work,
        List<CreatorDto> creators,
        List<FileResponse> files,
        @JsonProperty("like_count") int likeCount,
        @JsonProperty("view_count") int viewCount,
        @JsonProperty("download_count") int downloadCount,
        @JsonProperty("is_liked_by_current_user") boolean isLikedByCurrentUser,
        @JsonProperty("created_at") LocalDateTime createdAt,
        @JsonProperty("published_at") LocalDateTime publishedAt
) {}
