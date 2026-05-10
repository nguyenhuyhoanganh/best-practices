package com.axon.bestpractice;

import com.axon.bestpractice.dto.BestPracticeListItem;
import com.axon.bestpractice.dto.BestPracticeRequest;
import com.axon.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/best-practices")
@RequiredArgsConstructor
public class BestPracticeController {
    private final BestPracticeService service;
    private final org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;

    @GetMapping("/trending")
    public ResponseEntity<List<BestPracticeListItem>> trending() {
        var cached = (List<BestPracticeListItem>) redisTemplate.opsForValue().get("trending");
        if (cached != null) {
            return ResponseEntity.ok(cached);
        }
        return ResponseEntity.ok(service.listPublished(null, null, "trending", 0, 10).getContent());
    }

    @GetMapping
    public ResponseEntity<Page<BestPracticeListItem>> list(
        @RequestParam(required = false) BestPracticeType type,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "newest") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.listPublished(type, search, sort, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BestPracticeListItem> detail(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(BestPracticeListItem.from(service.getDetail(id, user)));
    }

    @PostMapping
    public ResponseEntity<BestPracticeListItem> create(
        @Valid @RequestBody BestPracticeRequest req,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BestPracticeListItem.from(service.create(req, user)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BestPracticeListItem> update(
        @PathVariable UUID id,
        @Valid @RequestBody BestPracticeRequest req,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(BestPracticeListItem.from(service.update(id, req, user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<BestPracticeListItem> submit(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(BestPracticeListItem.from(service.submit(id, user)));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BestPracticeListItem>> mySubmissions(
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.listByAuthor(user.getId()));
    }
}
