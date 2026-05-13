package com.axon.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.UUID;

public record DashboardResponse(
    @JsonProperty("total_submitters") long totalSubmitters,
    @JsonProperty("total_published_bps") long totalPublishedBps,
    @JsonProperty("by_job") List<JobStat> byJob,
    @JsonProperty("by_ai_capability") List<AiCapabilityStat> byAiCapability,
    @JsonProperty("by_department") List<DepartmentStat> byDepartment,
    @JsonProperty("top5_bps_by_work") List<WorkBpStat> top5BpsByWork,
    @JsonProperty("total_usage") long totalUsage,
    @JsonProperty("active_users") long activeUsers,
    @JsonProperty("usage_trend") List<MonthCount> usageTrend,
    @JsonProperty("top5_usage") List<BpUsageStat> top5Usage
) {
    public record JobStat(JobRef job, long count) {}
    public record AiCapabilityStat(CapabilityRef capability, long count) {}
    public record DepartmentStat(String department, long count) {}
    public record WorkBpStat(WorkRef work, @JsonProperty("bp_count") long bpCount) {}
    public record MonthCount(String month, long count) {}
    public record BpUsageStat(BpRef bp, @JsonProperty("usage_count") long usageCount) {}

    public record JobRef(UUID id, String name) {}
    public record CapabilityRef(UUID id, String name) {}
    public record WorkRef(UUID id, String name, @JsonProperty("work_category") WorkCategoryRef workCategory) {}
    public record WorkCategoryRef(String name) {}
    public record BpRef(UUID id, String name) {}
}
