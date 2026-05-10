package com.axon.bestpractice.dto;

import com.axon.bestpractice.BestPracticeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BestPracticeRequest(
    @NotBlank @Size(max = 200) String title,
    String description,
    @NotNull BestPracticeType type,
    String usageGuide,
    String installGuide,
    List<ExternalLinkDto> externalLinks,
    String agentWorkflowId,
    List<String> tags
) {}
