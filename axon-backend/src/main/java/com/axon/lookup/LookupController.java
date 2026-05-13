package com.axon.lookup;

import com.axon.lookup.aicapability.AiCapabilityRepository;
import com.axon.lookup.aicapability.dto.AiCapabilityDto;
import com.axon.lookup.job.JobRepository;
import com.axon.lookup.job.dto.JobDto;
import com.axon.lookup.work.WorkRepository;
import com.axon.lookup.work.dto.WorkDto;
import com.axon.lookup.workcategory.WorkCategoryRepository;
import com.axon.lookup.workcategory.dto.WorkCategoryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LookupController {

    private final JobRepository jobRepo;
    private final AiCapabilityRepository aiCapabilityRepo;
    private final WorkCategoryRepository workCategoryRepo;
    private final WorkRepository workRepo;

    @GetMapping("/jobs")
    public List<JobDto> getJobs() {
        return jobRepo.findByIsActiveTrueOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(JobDto::from)
                .toList();
    }

    @GetMapping("/ai-capabilities")
    public List<AiCapabilityDto> getAiCapabilities() {
        return aiCapabilityRepo.findByIsActiveTrueOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(AiCapabilityDto::from)
                .toList();
    }

    @GetMapping("/work-categories")
    public List<WorkCategoryDto> getWorkCategories() {
        return workCategoryRepo.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(WorkCategoryDto::from)
                .toList();
    }

    @GetMapping("/works")
    public List<WorkDto> getWorks(@RequestParam(required = false) UUID workCategoryId) {
        if (workCategoryId != null) {
            return workRepo.findByWorkCategoryIdAndIsActiveTrueOrderByNameAsc(workCategoryId)
                    .stream()
                    .map(WorkDto::from)
                    .toList();
        }
        return workRepo.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(WorkDto::from)
                .toList();
    }
}
