package com.axon.bestpractice.dto;

import com.axon.bestpractice.BpType;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.UUID;

public record BestPracticeRequest(
        String name,
        String description,
        @JsonProperty("thumbnail_url") String thumbnailUrl,
        @JsonProperty("installation_guide") String installationGuide,
        BpType type,
        @JsonProperty("web_content") String webContent,
        @JsonProperty("key_value") String keyValue,
        @JsonProperty("ai_tools_description") String aiToolsDescription,
        @JsonProperty("work_id") UUID workId,
        @JsonProperty("job_ids") List<UUID> jobIds,
        @JsonProperty("ai_capability_ids") List<UUID> aiCapabilityIds,
        @JsonProperty("creator_ids") List<UUID> creatorIds
) {}
