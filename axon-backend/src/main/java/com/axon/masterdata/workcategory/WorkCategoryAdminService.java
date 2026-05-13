package com.axon.masterdata.workcategory;

import com.axon.lookup.job.Job;
import com.axon.lookup.job.JobRepository;
import com.axon.lookup.workcategory.WorkCategory;
import com.axon.lookup.workcategory.WorkCategoryRepository;
import com.axon.masterdata.workcategory.dto.WorkCategoryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class WorkCategoryAdminService {

    private final WorkCategoryRepository workCategoryRepository;
    private final JobRepository jobRepository;

    public List<WorkCategory> findAll(@Nullable UUID jobId) {
        if (jobId != null) {
            return workCategoryRepository.findByJobIdAndIsActiveTrueOrderByNameAsc(jobId);
        }
        return workCategoryRepository.findByIsActiveTrueOrderByNameAsc();
    }

    public WorkCategory create(WorkCategoryRequest req) {
        Job job = jobRepository.findByIdAndIsActiveTrue(req.jobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        if (workCategoryRepository.existsByJobIdAndNameAndIsActiveTrue(req.jobId(), req.name())) {
            throw new IllegalArgumentException("Work category name already exists for this job");
        }
        WorkCategory workCategory = WorkCategory.builder()
                .job(job)
                .name(req.name())
                .description(req.description())
                .build();
        return workCategoryRepository.save(workCategory);
    }

    public WorkCategory update(UUID id, WorkCategoryRequest req) {
        WorkCategory workCategory = workCategoryRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Work category not found"));
        Job job = jobRepository.findByIdAndIsActiveTrue(req.jobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        UUID currentJobId = workCategory.getJob().getId();
        boolean nameChanged = !workCategory.getName().equals(req.name());
        boolean jobChanged = !currentJobId.equals(req.jobId());
        if ((nameChanged || jobChanged)
                && workCategoryRepository.existsByJobIdAndNameAndIsActiveTrue(req.jobId(), req.name())) {
            throw new IllegalArgumentException("Work category name already exists for this job");
        }
        workCategory.setJob(job);
        workCategory.setName(req.name());
        workCategory.setDescription(req.description());
        return workCategoryRepository.save(workCategory);
    }

    public void delete(UUID id) {
        WorkCategory workCategory = workCategoryRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Work category not found"));
        workCategory.setActive(false);
        workCategoryRepository.save(workCategory);
    }
}
