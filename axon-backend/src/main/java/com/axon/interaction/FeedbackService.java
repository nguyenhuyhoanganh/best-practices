package com.axon.interaction;

import com.axon.bestpractice.BestPractice;
import com.axon.bestpractice.BestPracticeRepository;
import com.axon.bestpractice.BpStatus;
import com.axon.interaction.dto.FeedbackResponse;
import com.axon.user.User;
import com.axon.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class FeedbackService {

    private final BpFeedbackRepository feedbackRepository;
    private final BestPracticeRepository bestPracticeRepository;
    private final UserService userService;

    public BpFeedback create(UUID bpId, String content, UUID userId) {
        BestPractice bp = bestPracticeRepository.findById(bpId).orElseThrow();
        if (bp.getStatus() != BpStatus.PUBLISHED) {
            throw new IllegalArgumentException("Feedback only on PUBLISHED BPs");
        }
        return feedbackRepository.save(BpFeedback.builder()
                .bpId(bpId)
                .userId(userId)
                .content(content)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<BpFeedback> list(UUID bpId, int page, int size) {
        return feedbackRepository.findByBpIdOrderByCreatedAtDesc(bpId, PageRequest.of(page, size));
    }

    public FeedbackResponse toDto(BpFeedback fb) {
        User u = userService.findById(fb.getUserId());
        return new FeedbackResponse(
                fb.getId(),
                fb.getContent(),
                new FeedbackResponse.FeedbackUserDto(u.getId(), u.getName(), u.getAvatarUrl()),
                fb.getCreatedAt()
        );
    }
}
