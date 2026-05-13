package com.axon.bestpractice;

import com.axon.bestpractice.dto.AiCapabilitySummaryDto;
import com.axon.bestpractice.dto.BestPracticeDetailDto;
import com.axon.bestpractice.dto.BestPracticeRequest;
import com.axon.bestpractice.dto.CreatorDto;
import com.axon.bestpractice.dto.JobSummaryDto;
import com.axon.bestpractice.dto.WorkSummaryDto;
import com.axon.file.BpFileRepository;
import com.axon.file.dto.FileResponse;
import com.axon.interaction.BpDownload;
import com.axon.interaction.BpDownloadRepository;
import com.axon.interaction.BpFeedbackRepository;
import com.axon.interaction.BpLike;
import com.axon.interaction.BpLikeId;
import com.axon.interaction.BpLikeRepository;
import com.axon.interaction.dto.LikeResult;
import com.axon.lookup.aicapability.AiCapability;
import com.axon.lookup.aicapability.AiCapabilityRepository;
import com.axon.lookup.job.Job;
import com.axon.lookup.job.JobRepository;
import com.axon.lookup.work.Work;
import com.axon.lookup.work.WorkRepository;
import com.axon.management.BpReview;
import com.axon.management.BpReviewRepository;
import com.axon.notification.NotificationService;
import com.axon.user.User;
import com.axon.user.UserRole;
import com.axon.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class BestPracticeService {

    private final BestPracticeRepository repository;
    private final UserService userService;
    private final WorkRepository workRepository;
    private final JobRepository jobRepository;
    private final AiCapabilityRepository aiCapabilityRepository;
    private final BpLikeRepository likeRepository;
    private final BpFileRepository fileRepository;
    private final BpReviewRepository reviewRepository;
    private final BpFeedbackRepository feedbackRepository;
    private final BpDownloadRepository downloadRepository;
    private final NotificationService notificationService;

    // --- CREATE ---
    @Transactional
    public BestPractice create(BestPracticeRequest req, UUID currentUserId) {
        Work work = req.workId() != null ? workRepository.findById(req.workId()).orElseThrow() : null;
        Set<User> creators = resolveCreators(req.creatorIds(), currentUserId);
        Set<Job> jobs = resolveJobs(req.jobIds());
        Set<AiCapability> aiCaps = resolveAiCapabilities(req.aiCapabilityIds());

        BestPractice bp = BestPractice.builder()
                .name(req.name())
                .description(req.description())
                .thumbnailUrl(req.thumbnailUrl())
                .installationGuide(req.installationGuide())
                .type(req.type())
                .webContent(req.webContent())
                .keyValue(req.keyValue())
                .aiToolsDescription(req.aiToolsDescription())
                .work(work)
                .status(BpStatus.REQUESTED)
                .submittedAt(LocalDateTime.now())
                .creators(creators)
                .jobs(jobs)
                .aiCapabilities(aiCaps)
                .build();
        return repository.save(bp);
    }

    // --- GET DETAIL ---
    @Transactional(readOnly = true)
    public BestPractice findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("BP not found"));
    }

    // --- UPDATE ---
    @Transactional
    public BestPractice update(UUID bpId, BestPracticeRequest req, UUID currentUserId) {
        BestPractice bp = findById(bpId);
        assertCreatorOrAdmin(bp, currentUserId);

        boolean webContentChanged = !Objects.equals(bp.getWebContent(), req.webContent());

        bp.setName(req.name());
        bp.setDescription(req.description());
        bp.setThumbnailUrl(req.thumbnailUrl());
        bp.setInstallationGuide(req.installationGuide());
        bp.setType(req.type());
        bp.setWebContent(req.webContent());
        bp.setKeyValue(req.keyValue());
        bp.setAiToolsDescription(req.aiToolsDescription());
        if (req.workId() != null) bp.setWork(workRepository.findById(req.workId()).orElseThrow());
        bp.getJobs().clear();
        bp.getJobs().addAll(resolveJobs(req.jobIds()));
        bp.getAiCapabilities().clear();
        bp.getAiCapabilities().addAll(resolveAiCapabilities(req.aiCapabilityIds()));

        // Status transitions
        if (bp.getStatus() == BpStatus.REJECTED) {
            bp.setStatus(BpStatus.REQUESTED);
            bp.setSubmittedAt(LocalDateTime.now());
        } else if (bp.getStatus() == BpStatus.PUBLISHED && webContentChanged) {
            bp.setStatus(BpStatus.REQUESTED);
            bp.setPublishedAt(null);
            bp.setSubmittedAt(LocalDateTime.now());
        }
        return repository.save(bp);
    }

    // --- DELETE ---
    @Transactional
    public void delete(UUID bpId, UUID currentUserId) {
        BestPractice bp = findById(bpId);
        assertCreatorOrAdmin(bp, currentUserId);
        if (bp.getStatus() == BpStatus.PUBLISHED) throw new InvalidStateException("Cannot delete PUBLISHED BP");
        repository.delete(bp);
    }

    // --- APPROVE ---
    @Transactional
    public BestPractice approve(UUID bpId, UUID reviewerId) {
        BestPractice bp = findById(bpId);
        if (bp.getStatus() != BpStatus.REQUESTED) throw new InvalidStateException("BP must be REQUESTED to approve");
        boolean selfApproval = bp.getCreators().stream().anyMatch(c -> c.getId().equals(reviewerId));
        if (selfApproval) throw new ForbiddenException("Cannot approve your own best practice");
        bp.setStatus(BpStatus.PUBLISHED);
        bp.setPublishedAt(LocalDateTime.now());
        repository.save(bp);
        reviewRepository.save(BpReview.approved(bpId, reviewerId));
        notificationService.notifyApproved(bp);
        return bp;
    }

    // --- REJECT ---
    @Transactional
    public BestPractice reject(UUID bpId, UUID reviewerId, String comment) {
        BestPractice bp = findById(bpId);
        if (bp.getStatus() != BpStatus.REQUESTED) throw new InvalidStateException("BP must be REQUESTED to reject");
        bp.setStatus(BpStatus.REJECTED);
        repository.save(bp);
        reviewRepository.save(BpReview.rejected(bpId, reviewerId, comment));
        notificationService.notifyRejected(bp, comment);
        return bp;
    }

    // --- CLOSE ---
    @Transactional
    public BestPractice close(UUID bpId, UUID reviewerId, String reason) {
        BestPractice bp = findById(bpId);
        if (bp.getStatus() != BpStatus.PUBLISHED) throw new InvalidStateException("BP must be PUBLISHED to close");
        bp.setStatus(BpStatus.REJECTED);
        bp.setCloseReason(reason);
        repository.save(bp);
        reviewRepository.save(BpReview.closed(bpId, reviewerId, reason));
        notificationService.notifyClosed(bp, reason);
        return bp;
    }

    // --- LIKE TOGGLE ---
    @Transactional
    public LikeResult toggleLike(UUID bpId, UUID userId) {
        BpLikeId likeId = new BpLikeId(bpId, userId);
        if (likeRepository.existsByIdBpIdAndIdUserId(bpId, userId)) {
            likeRepository.deleteByIdBpIdAndIdUserId(bpId, userId);
            repository.decrementLikeCount(bpId);
            return new LikeResult(repository.getLikeCount(bpId), false);
        } else {
            likeRepository.save(new BpLike(likeId, LocalDateTime.now()));
            repository.incrementLikeCount(bpId);
            return new LikeResult(repository.getLikeCount(bpId), true);
        }
    }

    // --- VIEW COUNT (async) ---
    @Async("taskExecutor")
    @Transactional
    public void incrementViewCount(UUID bpId) {
        repository.incrementViewCount(bpId);
    }

    // --- ASYNC DOWNLOAD COUNT ---
    @Async("taskExecutor")
    @Transactional
    public void logDownload(UUID bpId, UUID userId) {
        downloadRepository.save(BpDownload.builder().bpId(bpId).userId(userId).build());
        repository.incrementDownloadCount(bpId);
    }

    // --- LIST PUBLIC LIBRARY ---
    @Transactional(readOnly = true)
    public Page<BestPractice> listPublished(int page, int size, String sortBy, String sortDir) {
        Sort sort = buildSort(sortBy, sortDir);
        return repository.findByStatus(BpStatus.PUBLISHED, PageRequest.of(page, Math.min(size, 50), sort));
    }

    // --- LIST MY BPS ---
    @Transactional(readOnly = true)
    public Page<BestPractice> listMine(UUID userId, BpStatus status, int page, int size) {
        PageRequest pr = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        if (status != null) return repository.findByCreatorIdAndStatus(userId, status, pr);
        return repository.findByCreatorId(userId, pr);
    }

    // --- LIST MANAGEMENT QUEUE ---
    @Transactional(readOnly = true)
    public Page<BestPractice> listForManagement(BpStatus status, String search, int page, int size) {
        PageRequest pr = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.ASC, "submittedAt"));
        if (status != null) return repository.findByStatus(status, pr);
        return repository.findAll(pr);
    }

    // --- IS LIKED ---
    public boolean isLiked(UUID bpId, UUID userId) {
        return userId != null && likeRepository.existsByIdBpIdAndIdUserId(bpId, userId);
    }

    // --- GET REVIEWS ---
    public List<BpReview> getReviews(UUID bpId) {
        return reviewRepository.findByBpIdOrderByReviewedAtDesc(bpId);
    }

    // --- BUILD DETAIL DTO ---
    public BestPracticeDetailDto toDetailDto(BestPractice bp, UUID currentUserId, UserRole currentRole) {
        boolean liked = currentUserId != null && likeRepository.existsByIdBpIdAndIdUserId(bp.getId(), currentUserId);
        boolean canSeeKey = currentRole == UserRole.AX_SUPPORTER || currentRole == UserRole.ADMIN
                || bp.getCreators().stream().anyMatch(c -> c.getId().equals(currentUserId));
        return new BestPracticeDetailDto(
                bp.getId(),
                bp.getName(),
                bp.getDescription(),
                bp.getThumbnailUrl(),
                bp.getType(),
                bp.getStatus(),
                bp.getInstallationGuide(),
                bp.getWebContent(),
                canSeeKey ? bp.getKeyValue() : null,
                bp.getAiToolsDescription(),
                bp.getCloseReason(),
                bp.getJobs().stream().map(JobSummaryDto::from).toList(),
                bp.getAiCapabilities().stream().map(AiCapabilitySummaryDto::from).toList(),
                bp.getWork() != null ? WorkSummaryDto.from(bp.getWork()) : null,
                bp.getCreators().stream().map(CreatorDto::from).toList(),
                bp.getFiles().stream().map(FileResponse::from).toList(),
                bp.getLikeCount(),
                bp.getViewCount(),
                bp.getDownloadCount(),
                liked,
                bp.getCreatedAt(),
                bp.getPublishedAt()
        );
    }

    // --- PRIVATE HELPERS ---
    private void assertCreatorOrAdmin(BestPractice bp, UUID userId) {
        User user = userService.findById(userId);
        boolean isCreator = bp.getCreators().stream().anyMatch(c -> c.getId().equals(userId));
        if (!isCreator && user.getRole() != UserRole.ADMIN) throw new ForbiddenException("Not authorized");
    }

    private Set<User> resolveCreators(List<UUID> ids, UUID currentUserId) {
        Set<User> set = new HashSet<>();
        if (ids != null) ids.forEach(id -> set.add(userService.findById(id)));
        if (set.stream().noneMatch(u -> u.getId().equals(currentUserId))) set.add(userService.findById(currentUserId));
        return set;
    }

    private Set<Job> resolveJobs(List<UUID> ids) {
        if (ids == null) return new HashSet<>();
        return ids.stream().map(id -> jobRepository.findById(id).orElseThrow()).collect(Collectors.toSet());
    }

    private Set<AiCapability> resolveAiCapabilities(List<UUID> ids) {
        if (ids == null) return new HashSet<>();
        return ids.stream().map(id -> aiCapabilityRepository.findById(id).orElseThrow()).collect(Collectors.toSet());
    }

    private Sort buildSort(String sortBy, String sortDir) {
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return switch (sortBy == null ? "publishedAt" : sortBy) {
            case "name" -> Sort.by(dir, "name");
            case "likeCount" -> Sort.by(dir, "likeCount");
            case "viewCount" -> Sort.by(dir, "viewCount");
            case "downloadCount" -> Sort.by(dir, "downloadCount");
            default -> Sort.by(dir, "publishedAt");
        };
    }
}
