package com.axon.bestpractice.dto;

import com.axon.lookup.job.Job;

import java.util.UUID;

public record JobSummaryDto(UUID id, String name) {

    public static JobSummaryDto from(Job j) {
        return new JobSummaryDto(j.getId(), j.getName());
    }
}
