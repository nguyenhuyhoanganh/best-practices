package com.axon.masterdata.work;

import com.axon.lookup.job.Job;
import com.axon.lookup.job.JobRepository;
import com.axon.lookup.work.Work;
import com.axon.lookup.work.WorkRepository;
import com.axon.lookup.workcategory.WorkCategory;
import com.axon.lookup.workcategory.WorkCategoryRepository;
import com.axon.masterdata.work.dto.WorkRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class WorkAdminService {

    private final WorkRepository workRepository;
    private final JobRepository jobRepository;
    private final WorkCategoryRepository workCategoryRepository;

    public List<Work> findAll(@Nullable UUID workCategoryId) {
        if (workCategoryId != null) {
            return workRepository.findByWorkCategoryIdAndIsActiveTrueOrderByNameAsc(workCategoryId);
        }
        return workRepository.findByIsActiveTrueOrderByNameAsc();
    }

    public Work create(WorkRequest req) {
        if (workRepository.existsByCodeAndIsActiveTrue(req.code())) {
            throw new IllegalArgumentException("Work code already exists");
        }
        Job job = jobRepository.findByIdAndIsActiveTrue(req.jobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        WorkCategory workCategory = workCategoryRepository.findByIdAndIsActiveTrue(req.workCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Work category not found"));
        Work work = Work.builder()
                .job(job)
                .workCategory(workCategory)
                .name(req.name())
                .code(req.code())
                .description(req.description())
                .build();
        return workRepository.save(work);
    }

    public Work update(UUID id, WorkRequest req) {
        Work work = workRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Work not found"));
        if (!work.getCode().equals(req.code()) && workRepository.existsByCodeAndIsActiveTrue(req.code())) {
            throw new IllegalArgumentException("Work code already exists");
        }
        Job job = jobRepository.findByIdAndIsActiveTrue(req.jobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        WorkCategory workCategory = workCategoryRepository.findByIdAndIsActiveTrue(req.workCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Work category not found"));
        work.setJob(job);
        work.setWorkCategory(workCategory);
        work.setName(req.name());
        work.setCode(req.code());
        work.setDescription(req.description());
        return workRepository.save(work);
    }

    public void delete(UUID id) {
        Work work = workRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Work not found"));
        work.setActive(false);
        workRepository.save(work);
    }
}
