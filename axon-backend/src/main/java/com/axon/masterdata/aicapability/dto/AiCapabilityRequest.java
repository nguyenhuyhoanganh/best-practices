package com.axon.masterdata.aicapability.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiCapabilityRequest(
        String name,
        @JsonProperty("is_default") boolean isDefault
) {}
