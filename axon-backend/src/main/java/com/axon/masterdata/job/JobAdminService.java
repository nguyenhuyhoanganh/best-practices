package com.axon.masterdata.job;

import com.axon.lookup.job.Job;
import com.axon.lookup.job.JobRepository;
import com.axon.masterdata.job.dto.JobRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class JobAdminService {

    private final JobRepository jobRepository;

    public List<Job> findAll() {
        return jobRepository.findByIsActiveTrueOrderByDisplayOrderAscNameAsc();
    }

    public Job create(JobRequest req) {
        if (jobRepository.existsByNameAndIsActiveTrue(req.name())) {
            throw new IllegalArgumentException("Job name already exists");
        }
        Job job = Job.builder()
                .name(req.name())
                .description(req.description())
                .build();
        return jobRepository.save(job);
    }

    public Job update(UUID id, JobRequest req) {
        Job job = jobRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        if (!job.getName().equals(req.name()) && jobRepository.existsByNameAndIsActiveTrue(req.name())) {
            throw new IllegalArgumentException("Job name already exists");
        }
        job.setName(req.name());
        job.setDescription(req.description());
        return jobRepository.save(job);
    }

    public void delete(UUID id) {
        Job job = jobRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
        job.setActive(false);
        jobRepository.save(job);
    }
}
