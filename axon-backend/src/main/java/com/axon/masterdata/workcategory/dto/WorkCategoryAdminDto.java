package com.axon.masterdata.workcategory.dto;

import com.axon.lookup.job.dto.JobDto;
import com.axon.lookup.workcategory.WorkCategory;

import java.util.UUID;

public record WorkCategoryAdminDto(
        UUID id,
        JobDto job,
        String name,
        String description
) {
    public static WorkCategoryAdminDto from(WorkCategory wc) {
        return new WorkCategoryAdminDto(
                wc.getId(),
                JobDto.from(wc.getJob()),
                wc.getName(),
                wc.getDescription()
        );
    }
}
