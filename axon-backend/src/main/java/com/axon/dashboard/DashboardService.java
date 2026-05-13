package com.axon.dashboard;

import com.axon.bestpractice.BestPracticeRepository;
import com.axon.bestpractice.BpStatus;
import com.axon.dashboard.dto.DashboardResponse;
import com.axon.dashboard.dto.DashboardResponse.*;
import com.axon.interaction.BpDownloadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BestPracticeRepository bpRepository;
    private final BpDownloadRepository downloadRepository;

    @Cacheable(value = "dashboard", key = "#startDate + '-' + #endDate")
    @Transactional(readOnly = true)
    public DashboardResponse getStats(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(LocalTime.MAX) : null;
        LocalDateTime since12Months = LocalDateTime.now().minusMonths(12);

        long totalSubmitters = bpRepository.countDistinctCreatorsOfPublishedBPs();
        long totalPublished = bpRepository.countByStatus(BpStatus.PUBLISHED);

        List<JobStat> byJob = bpRepository.countPublishedByJob().stream()
            .map(row -> new JobStat(new JobRef((UUID) row[0], (String) row[1]), ((Number) row[2]).longValue()))
            .toList();

        List<AiCapabilityStat> byAiCap = bpRepository.countPublishedByAiCapability().stream()
            .map(row -> new AiCapabilityStat(new CapabilityRef((UUID) row[0], (String) row[1]), ((Number) row[2]).longValue()))
            .toList();

        List<DepartmentStat> byDept = bpRepository.countPublishedByCreatorDepartment().stream()
            .map(row -> new DepartmentStat((String) row[0], ((Number) row[1]).longValue()))
            .toList();

        List<WorkBpStat> top5Works = bpRepository.findTop5WorksByBpCount(PageRequest.of(0, 5)).stream()
            .map(row -> new WorkBpStat(
                new WorkRef((UUID) row[0], (String) row[1], new WorkCategoryRef((String) row[2])),
                ((Number) row[3]).longValue()))
            .toList();

        long totalUsage = downloadRepository.countByDateRange(start, end);
        long activeUsers = downloadRepository.countDistinctUsersByDateRange(start, end);

        List<MonthCount> usageTrend = downloadRepository.countByMonth(since12Months).stream()
            .map(row -> new MonthCount((String) row[0], ((Number) row[1]).longValue()))
            .toList();

        List<BpUsageStat> top5Usage = bpRepository.findTop5ByDownloadCount(PageRequest.of(0, 5)).stream()
            .map(row -> new BpUsageStat(new BpRef((UUID) row[0], (String) row[1]), ((Number) row[2]).longValue()))
            .toList();

        return new DashboardResponse(
            totalSubmitters, totalPublished, byJob, byAiCap, byDept,
            top5Works, totalUsage, activeUsers, usageTrend, top5Usage
        );
    }
}
