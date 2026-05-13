package com.axon.lookup.aicapability.dto;

import com.axon.lookup.aicapability.AiCapability;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record AiCapabilityDto(
        UUID id,
        String name,
        @JsonProperty("is_default") boolean isDefault,
        @JsonProperty("display_order") int displayOrder
) {
    public static AiCapabilityDto from(AiCapability cap) {
        return new AiCapabilityDto(cap.getId(), cap.getName(), cap.isDefault(), cap.getDisplayOrder());
    }
}
