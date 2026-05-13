package com.axon.bestpractice;

import com.axon.file.BpFile;
import com.axon.lookup.aicapability.AiCapability;
import com.axon.lookup.job.Job;
import com.axon.lookup.work.Work;
import com.axon.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "best_practices")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class BestPractice {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "installation_guide", columnDefinition = "TEXT")
    private String installationGuide;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "bp_type", nullable = false)
    private BpType type;

    @Column(name = "web_content", length = 256)
    private String webContent;

    @Column(name = "key_value", columnDefinition = "TEXT")
    private String keyValue;

    @Column(name = "ai_tools_description", columnDefinition = "TEXT")
    private String aiToolsDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_id")
    private Work work;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "bp_status", nullable = false)
    private BpStatus status;

    @Column(name = "close_reason", columnDefinition = "TEXT")
    private String closeReason;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "view_count")
    @Builder.Default
    private int viewCount = 0;

    @Column(name = "like_count")
    @Builder.Default
    private int likeCount = 0;

    @Column(name = "download_count")
    @Builder.Default
    private int downloadCount = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "bp_creators",
            joinColumns = @JoinColumn(name = "bp_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> creators = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "bp_jobs",
            joinColumns = @JoinColumn(name = "bp_id"),
            inverseJoinColumns = @JoinColumn(name = "job_id")
    )
    @Builder.Default
    private Set<Job> jobs = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "bp_ai_capabilities",
            joinColumns = @JoinColumn(name = "bp_id"),
            inverseJoinColumns = @JoinColumn(name = "ai_capability_id")
    )
    @Builder.Default
    private Set<AiCapability> aiCapabilities = new HashSet<>();

    @OneToMany(mappedBy = "bp", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BpFile> files = new ArrayList<>();
}
