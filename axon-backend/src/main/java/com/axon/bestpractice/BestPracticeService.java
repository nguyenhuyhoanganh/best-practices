package com.axon.bestpractice;

import com.axon.bestpractice.dto.BestPracticeListItem;
import com.axon.bestpractice.dto.BestPracticeRequest;
import com.axon.usage.UsageAction;
import com.axon.usage.UsageLogRepository;
import com.axon.user.User;
import com.axon.user.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BestPracticeService {
    private final BestPracticeRepository repository;
    private final UsageLogRepository usageLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public BestPractice create(BestPracticeRequest req, User author) {
        return repository.save(BestPractice.builder()
            .title(req.title())
            .description(req.description())
            .type(req.type())
            .status(BestPracticeStatus.DRAFT)
            .author(author)
            .usageGuide(req.usageGuide())
            .installGuide(req.installGuide())
            .externalLinks(toJson(req.externalLinks()))
            .agentWorkflowId(req.agentWorkflowId())
            .tags(req.tags() != null ? req.tags().toArray(new String[0]) : new String[]{})
            .build());
    }

    @Transactional
    public BestPractice update(UUID id, BestPracticeRequest req, User user) {
        BestPractice bp = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Not found"));
        
        if (!bp.getAuthor().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new IllegalStateException("Unauthorized");
        }
        
        if (!bp.getStatus().canEdit()) {
            throw new IllegalStateException("Cannot edit in status: " + bp.getStatus());
        }
        
        bp.setTitle(req.title());
        bp.setDescription(req.description());
        bp.setUsageGuide(req.usageGuide());
        bp.setInstallGuide(req.installGuide());
        bp.setExternalLinks(toJson(req.externalLinks()));
        bp.setAgentWorkflowId(req.agentWorkflowId());
        bp.setTags(req.tags() != null ? req.tags().toArray(new String[0]) : new String[]{});
        
        return repository.save(bp);
    }

    @Transactional
    public BestPractice submit(UUID id, User user) {
        BestPractice bp = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Not found"));
        
        if (!bp.getAuthor().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized");
        }
        
        if (!bp.getStatus().canSubmit()) {
            throw new IllegalStateException("Cannot submit in status: " + bp.getStatus());
        }
        
        bp.setStatus(BestPracticeStatus.PENDING_REVIEW);
        return repository.save(bp);
    }

    @Transactional
    public void delete(UUID id, User user) {
        BestPractice bp = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Not found"));
        
        if (!bp.getAuthor().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new IllegalStateException("Unauthorized");
        }
        
        if (bp.getStatus() != BestPracticeStatus.DRAFT) {
            throw new IllegalStateException("Can only delete DRAFT");
        }
        
        repository.delete(bp);
    }

    public Page<BestPracticeListItem> listPublished(BestPracticeType type, String search, String sort, int page, int size) {
        Sort s = "trending".equals(sort)
            ? Sort.by(Sort.Direction.DESC, "usageScore")
            : Sort.by(Sort.Direction.DESC, "publishedAt");
        
        Pageable pageable = PageRequest.of(page, size, s);
        return repository.findPublished(type, search, pageable).map(BestPracticeListItem::from);
    }

    @Transactional
    public BestPractice getDetail(UUID id, User user) {
        BestPractice bp = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Not found"));
        
        // Async log view would be better, but keeping it simple for now
        if (user != null) {
            bp.setViewCount(bp.getViewCount() + 1);
            repository.save(bp);
        }
        
        return bp;
    }

    public List<BestPracticeListItem> listByAuthor(UUID authorId) {
        return repository.findByAuthorIdOrderByCreatedAtDesc(authorId).stream()
            .map(BestPracticeListItem::from).toList();
    }

    private String toJson(Object obj) {
        try {
            return obj != null ? objectMapper.writeValueAsString(obj) : "[]";
        } catch (Exception e) {
            return "[]";
        }
    }
}
