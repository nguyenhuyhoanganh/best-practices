package com.axon.masterdata.aicapability;

import com.axon.lookup.aicapability.dto.AiCapabilityDto;
import com.axon.masterdata.aicapability.dto.AiCapabilityRequest;
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
@RequestMapping("/api/v1/admin/master-data/ai-capabilities")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AiCapabilityAdminController {

    private final AiCapabilityAdminService aiCapabilityAdminService;

    @GetMapping
    public ResponseEntity<List<AiCapabilityDto>> getAiCapabilities() {
        List<AiCapabilityDto> caps = aiCapabilityAdminService.findAll()
                .stream()
                .map(AiCapabilityDto::from)
                .toList();
        return ResponseEntity.ok(caps);
    }

    @PostMapping
    public ResponseEntity<AiCapabilityDto> createAiCapability(@RequestBody AiCapabilityRequest req) {
        AiCapabilityDto created = AiCapabilityDto.from(aiCapabilityAdminService.create(req));
        return ResponseEntity.created(URI.create("/api/v1/admin/master-data/ai-capabilities/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AiCapabilityDto> updateAiCapability(@PathVariable UUID id, @RequestBody AiCapabilityRequest req) {
        return ResponseEntity.ok(AiCapabilityDto.from(aiCapabilityAdminService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAiCapability(@PathVariable UUID id) {
        aiCapabilityAdminService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
