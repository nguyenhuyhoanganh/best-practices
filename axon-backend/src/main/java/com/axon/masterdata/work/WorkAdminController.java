package com.axon.masterdata.work;

import com.axon.lookup.work.dto.WorkDto;
import com.axon.masterdata.work.dto.WorkRequest;
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
@RequestMapping("/api/v1/admin/master-data/works")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class WorkAdminController {

    private final WorkAdminService workAdminService;

    @GetMapping
    public ResponseEntity<List<WorkDto>> getWorks(
            @RequestParam(required = false) UUID workCategoryId) {
        List<WorkDto> works = workAdminService.findAll(workCategoryId)
                .stream()
                .map(WorkDto::from)
                .toList();
        return ResponseEntity.ok(works);
    }

    @PostMapping
    public ResponseEntity<WorkDto> createWork(@RequestBody WorkRequest req) {
        WorkDto created = WorkDto.from(workAdminService.create(req));
        return ResponseEntity.created(URI.create("/api/v1/admin/master-data/works/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkDto> updateWork(@PathVariable UUID id, @RequestBody WorkRequest req) {
        return ResponseEntity.ok(WorkDto.from(workAdminService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWork(@PathVariable UUID id) {
        workAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
