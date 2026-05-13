package com.axon.masterdata.job;

import com.axon.lookup.job.dto.JobDto;
import com.axon.masterdata.job.dto.JobRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/master-data/jobs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class JobAdminController {

    private final JobAdminService jobAdminService;

    @GetMapping
    public ResponseEntity<List<JobDto>> getJobs() {
        List<JobDto> jobs = jobAdminService.findAll()
                .stream()
                .map(JobDto::from)
                .toList();
        return ResponseEntity.ok(jobs);
    }

    @PostMapping
    public ResponseEntity<JobDto> createJob(@RequestBody JobRequest req) {
        JobDto created = JobDto.from(jobAdminService.create(req));
        return ResponseEntity.created(URI.create("/api/v1/admin/master-data/jobs/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobDto> updateJob(@PathVariable UUID id, @RequestBody JobRequest req) {
        return ResponseEntity.ok(JobDto.from(jobAdminService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable UUID id) {
        jobAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
