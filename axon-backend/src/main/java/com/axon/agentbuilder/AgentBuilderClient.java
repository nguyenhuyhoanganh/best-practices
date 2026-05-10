package com.axon.agentbuilder;

import com.axon.agentbuilder.dto.WorkflowInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@Slf4j
public class AgentBuilderClient {
    private final RestClient client;

    public AgentBuilderClient(
        @Value("${agent-builder.base-url}") String baseUrl,
        @Value("${agent-builder.api-key}") String apiKey
    ) {
        this.client = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("X-API-Key", apiKey)
            .build();
    }

    public WorkflowInfo getWorkflow(String workflowId) {
        try {
            return client.get()
                .uri("/api/workflows/{id}", workflowId)
                .retrieve()
                .body(WorkflowInfo.class);
        } catch (Exception e) {
            log.warn("Agent Builder unavailable for workflow {}: {}", workflowId, e.getMessage());
            // Return mock data for dev environment if needed, or throw
            return new WorkflowInfo(workflowId, "Mock Workflow", "Description for " + workflowId, null);
        }
    }
}
