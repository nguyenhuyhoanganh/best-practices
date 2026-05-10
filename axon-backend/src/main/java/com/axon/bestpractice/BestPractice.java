package com.axon.bestpractice;

import com.axon.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "best_practices")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BestPractice {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "types", nullable = false)
    private String[] types = new String[]{};

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BestPracticeStatus status = BestPracticeStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "text")
    private String usageGuide;

    @Column(columnDefinition = "text")
    private String installGuide;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "external_links", nullable = false)
    private String externalLinks = "[]";

    private String agentWorkflowId;

    @Column(name = "tags", nullable = false)
    private String[] tags = new String[]{};

    @Column(nullable = false)
    private Integer viewCount = 0;

    @Column(nullable = false)
    private Integer downloadCount = 0;

    @Column(nullable = false)
    private Double usageScore = 0.0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    private Instant publishedAt;

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }
}
