package com.axon.masterdata.work.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record WorkRequest(
        @JsonProperty("job_id") UUID jobId,
        @JsonProperty("work_category_id") UUID workCategoryId,
        String name,
        String code,
        String description
) {}
