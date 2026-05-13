package com.axon.aiinsight;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai-insight")
@PreAuthorize("isAuthenticated()")
public class AiInsightController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getInsight() {
        var classifications = List.of(
                Map.of(
                        "name", "Q&A",
                        "description", "BPs to use AI as a search engine for simple repetitive questions",
                        "embodiments", List.of("Prompting templates", "Chatbots"),
                        "scope", "Individual / small specific team"
                ),
                Map.of(
                        "name", "Workflow Assistant",
                        "description", "BPs to use AI as a collaborator to solve or execute job steps",
                        "embodiments", List.of("Cline rules/skills/workflows", "MCP implementations/configs", "Custom workflows"),
                        "scope", "Across Dept/group with same job"
                ),
                Map.of(
                        "name", "Autonomous AI Agent",
                        "description", "BPs to build AI agents that automatically decide and implement tasks",
                        "embodiments", List.of("Standalone AI agents", "Multi-agent systems"),
                        "scope", "Company-wide with general purposes"
                ),
                Map.of(
                        "name", "AI-based Tools & Applications",
                        "description", "BPs that build and deploy specific purpose AI-based tools",
                        "embodiments", List.of("Fine-tuned models/tools for specific purpose"),
                        "scope", "Specific technical domain, design solutions"
                ),
                Map.of(
                        "name", "AI Orchestration",
                        "description", "BPs to create AI agents that analyze and orchestrate other agents",
                        "embodiments", List.of("AI-driven products"),
                        "scope", "AI-driven UX, AI-driven logic and workflows"
                )
        );
        return ResponseEntity.ok(Map.of("classifications", classifications));
    }
}
