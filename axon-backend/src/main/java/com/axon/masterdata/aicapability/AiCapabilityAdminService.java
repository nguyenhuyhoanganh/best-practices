package com.axon.masterdata.aicapability;

import com.axon.lookup.aicapability.AiCapability;
import com.axon.lookup.aicapability.AiCapabilityRepository;
import com.axon.masterdata.aicapability.dto.AiCapabilityRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AiCapabilityAdminService {

    private final AiCapabilityRepository aiCapabilityRepository;

    public List<AiCapability> findAll() {
        return aiCapabilityRepository.findByIsActiveTrueOrderByDisplayOrderAscNameAsc();
    }

    public AiCapability create(AiCapabilityRequest req) {
        if (aiCapabilityRepository.existsByNameAndIsActiveTrue(req.name())) {
            throw new IllegalArgumentException("AI Capability name already exists");
        }
        AiCapability cap = AiCapability.builder()
                .name(req.name())
                .isDefault(req.isDefault())
                .build();
        return aiCapabilityRepository.save(cap);
    }

    public AiCapability update(UUID id, AiCapabilityRequest req) {
        AiCapability cap = aiCapabilityRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("AI Capability not found"));
        if (!cap.getName().equals(req.name()) && aiCapabilityRepository.existsByNameAndIsActiveTrue(req.name())) {
            throw new IllegalArgumentException("AI Capability name already exists");
        }
        cap.setName(req.name());
        cap.setDefault(req.isDefault());
        return aiCapabilityRepository.save(cap);
    }

    public void delete(UUID id) {
        AiCapability cap = aiCapabilityRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("AI Capability not found"));
        cap.setActive(false);
        aiCapabilityRepository.save(cap);
    }
}
