package com.axon.bestpractice.dto;

import com.axon.lookup.work.Work;
import com.axon.lookup.workcategory.dto.WorkCategoryDto;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record WorkSummaryDto(
        UUID id,
        String name,
        @JsonProperty("work_category") WorkCategoryDto workCategory
) {
    public static WorkSummaryDto from(Work w) {
        return new WorkSummaryDto(
                w.getId(),
                w.getName(),
                new WorkCategoryDto(w.getWorkCategory().getId(), w.getWorkCategory().getName())
        );
    }
}
