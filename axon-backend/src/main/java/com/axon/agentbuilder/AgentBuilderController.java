package com.axon.agentbuilder;

import com.axon.agentbuilder.dto.WorkflowInfo;
import com.axon.bestpractice.BestPracticeRepository;
import com.axon.usage.UsageAction;
import com.axon.usage.UsageLog;
import com.axon.usage.UsageLogRepository;
import com.axon.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/agent-builder")
@RequiredArgsConstructor
public class AgentBuilderController {
    private final AgentBuilderClient client;
    private final BestPracticeRepository bpRepo;
    private final UsageLogRepository usageLogRepository;

    @Value("${agent-builder.base-url}")
    private String agentBuilderUrl;

    @GetMapping("/workflows/{workflowId}")
    public ResponseEntity<WorkflowInfo> getWorkflow(@PathVariable String workflowId) {
        return ResponseEntity.ok(client.getWorkflow(workflowId));
    }

    @PostMapping("/workflows/{workflowId}/use")
    public ResponseEntity<Map<String, String>> useWorkflow(
        @PathVariable String workflowId,
        @AuthenticationPrincipal User user
    ) {
        // Find Best Practice linked to this workflow
        bpRepo.findByAgentWorkflowId(workflowId).ifPresent(bp -> {
            usageLogRepository.save(UsageLog.builder()
                .bestPracticeId(bp.getId())
                .userId(user.getId())
                .action(UsageAction.WORKFLOW_USED)
                .build());
        });

        String url = agentBuilderUrl + "/workflows/" + workflowId;
        return ResponseEntity.ok(Map.of("workflow_url", url));
    }
}
