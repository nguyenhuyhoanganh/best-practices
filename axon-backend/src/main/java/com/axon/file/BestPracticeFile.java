package com.axon.file;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "best_practice_files")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BestPracticeFile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "best_practice_id", nullable = false)
    private UUID bestPracticeId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private Long fileSize;

    private String mimeType;

    @Column(nullable = false)
    private String storageKey;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();
}
