package com.axon.bestpractice.dto;

import com.axon.bestpractice.BestPractice;
import com.axon.bestpractice.BestPracticeStatus;
import com.axon.bestpractice.BestPracticeType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BestPracticeListItem(
    UUID id, String title, String description,
    List<String> types, BestPracticeStatus status,
    List<String> tags, AuthorDto author,
    double usageScore, int viewCount, int downloadCount,
    Instant publishedAt
) {
    public static BestPracticeListItem from(BestPractice bp) {
        String desc = bp.getDescription() != null && bp.getDescription().length() > 200
            ? bp.getDescription().substring(0, 200) + "..." : bp.getDescription();
        return new BestPracticeListItem(
            bp.getId(), bp.getTitle(), desc,
            bp.getTypes() != null ? List.of(bp.getTypes()) : List.of(),
            bp.getStatus(),
            bp.getTags() != null ? List.of(bp.getTags()) : List.of(),
            AuthorDto.from(bp.getAuthor()),
            bp.getUsageScore(), bp.getViewCount(), bp.getDownloadCount(),
            bp.getPublishedAt()
        );
    }
}
