package com.axon.lookup.work.dto;

import com.axon.lookup.work.Work;
import com.axon.lookup.workcategory.dto.WorkCategoryDto;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record WorkDto(
        UUID id,
        String name,
        String code,
        @JsonProperty("work_category") WorkCategoryDto workCategory
) {
    public static WorkDto from(Work w) {
        return new WorkDto(w.getId(), w.getName(), w.getCode(), WorkCategoryDto.from(w.getWorkCategory()));
    }
}
