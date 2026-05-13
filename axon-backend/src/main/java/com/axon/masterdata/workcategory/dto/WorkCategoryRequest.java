package com.axon.masterdata.workcategory.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record WorkCategoryRequest(
        @JsonProperty("job_id") UUID jobId,
        String name,
        String description
) {}
