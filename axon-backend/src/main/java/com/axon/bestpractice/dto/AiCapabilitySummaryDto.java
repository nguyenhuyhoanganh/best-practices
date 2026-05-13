package com.axon.bestpractice.dto;

import com.axon.lookup.aicapability.AiCapability;

import java.util.UUID;

public record AiCapabilitySummaryDto(UUID id, String name) {

    public static AiCapabilitySummaryDto from(AiCapability a) {
        return new AiCapabilitySummaryDto(a.getId(), a.getName());
    }
}
