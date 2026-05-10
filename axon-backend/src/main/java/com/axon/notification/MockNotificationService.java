package com.axon.notification;

import com.axon.bestpractice.BestPractice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockNotificationService implements NotificationService {
    @Override
    public void notifyApproved(BestPractice bp) {
        log.info("NOTIFY: Best Practice '{}' APPROVED. Author: {}", bp.getTitle(), bp.getAuthor().getEmail());
    }

    @Override
    public void notifyRejected(BestPractice bp, String comment) {
        log.info("NOTIFY: Best Practice '{}' REJECTED. Reason: {}. Author: {}", bp.getTitle(), comment, bp.getAuthor().getEmail());
    }

    @Override
    public void notifyAdmins(BestPractice bp) {
        log.info("NOTIFY: New Best Practice '{}' PENDING review.", bp.getTitle());
    }
}
