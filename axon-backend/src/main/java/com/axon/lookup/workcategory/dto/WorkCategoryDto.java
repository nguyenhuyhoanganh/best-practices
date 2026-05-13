package com.axon.lookup.workcategory.dto;

import com.axon.lookup.workcategory.WorkCategory;

import java.util.UUID;

public record WorkCategoryDto(
        UUID id,
        String name
) {
    public static WorkCategoryDto from(WorkCategory wc) {
        return new WorkCategoryDto(wc.getId(), wc.getName());
    }
}
