package com.axon.interaction.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record FeedbackResponse(
        UUID id,
        String content,
        FeedbackUserDto user,
        @JsonProperty("created_at") LocalDateTime createdAt
) {
    public record FeedbackUserDto(
            UUID id,
            String name,
            @JsonProperty("avatar_url") String avatarUrl
    ) {}
}
