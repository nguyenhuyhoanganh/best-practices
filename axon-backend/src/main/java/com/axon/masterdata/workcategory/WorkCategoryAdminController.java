package com.axon.masterdata.workcategory;

import com.axon.masterdata.workcategory.dto.WorkCategoryAdminDto;
import com.axon.masterdata.workcategory.dto.WorkCategoryRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Admin - Master Data")
@RestController
@RequestMapping("/api/v1/admin/master-data/work-categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class WorkCategoryAdminController {

    private final WorkCategoryAdminService workCategoryAdminService;

    @GetMapping
    public ResponseEntity<List<WorkCategoryAdminDto>> getWorkCategories(
            @RequestParam(required = false) UUID jobId) {
        List<WorkCategoryAdminDto> categories = workCategoryAdminService.findAll(jobId)
                .stream()
                .map(WorkCategoryAdminDto::from)
                .toList();
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<WorkCategoryAdminDto> createWorkCategory(@RequestBody WorkCategoryRequest req) {
        WorkCategoryAdminDto created = WorkCategoryAdminDto.from(workCategoryAdminService.create(req));
        return ResponseEntity.created(URI.create("/api/v1/admin/master-data/work-categories/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkCategoryAdminDto> updateWorkCategory(
            @PathVariable UUID id, @RequestBody WorkCategoryRequest req) {
        return ResponseEntity.ok(WorkCategoryAdminDto.from(workCategoryAdminService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkCategory(@PathVariable UUID id) {
        workCategoryAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
