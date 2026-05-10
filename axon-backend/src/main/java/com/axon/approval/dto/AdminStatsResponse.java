package com.axon.approval.dto;

import java.util.Map;

public record AdminStatsResponse(
    long totalUsers,
    long totalBestPractices,
    long pendingReviews,
    long publishedItems,
    Map<String, Long> distributionByType,
    Map<String, Long> distributionByRole,
    long totalViews,
    long totalDownloads
) {}
