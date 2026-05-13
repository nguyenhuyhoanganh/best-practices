package com.axon.bestpractice;

import com.axon.bestpractice.dto.BestPracticeListItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/my-best-practices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('AX_CREATOR')")
public class MyBestPracticeController {

    private final BestPracticeService bestPracticeService;

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) return null;
        return UUID.fromString((String) auth.getPrincipal());
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) BpStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = currentUserId();
        Page<BestPractice> result = bestPracticeService.listMine(userId, status, page, size);
        return ResponseEntity.ok(Map.of(
                "content", result.getContent().stream()
                        .map(bp -> BestPracticeListItemDto.from(bp, bestPracticeService.isLiked(bp.getId(), userId)))
                        .toList(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "page", result.getNumber()
        ));
    }
}
