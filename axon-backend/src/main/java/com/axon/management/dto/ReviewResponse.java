package com.axon.management.dto;

import com.axon.management.ReviewAction;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        ReviewAction action,
        String comment,
        ReviewerDto reviewer,
        @JsonProperty("reviewed_at") LocalDateTime reviewedAt
) {
    public record ReviewerDto(UUID id, String name) {}
}
