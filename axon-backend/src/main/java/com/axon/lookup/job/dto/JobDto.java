package com.axon.lookup.job.dto;

import com.axon.lookup.job.Job;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record JobDto(
        UUID id,
        String name,
        @JsonProperty("display_order") int displayOrder
) {
    public static JobDto from(Job job) {
        return new JobDto(job.getId(), job.getName(), job.getDisplayOrder());
    }
}
