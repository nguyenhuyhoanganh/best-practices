package com.axon.notification;

import com.axon.bestpractice.BestPractice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailNotificationService implements NotificationService {

    @Override
    public void notifyApproved(BestPractice bp) {
        log.info("Approved notification stub for BP {}", bp.getId());
    }

    @Override
    public void notifyRejected(BestPractice bp, String comment) {
        log.info("Rejected notification stub for BP {} comment={}", bp.getId(), comment);
    }

    @Override
    public void notifyClosed(BestPractice bp, String reason) {
        log.info("Closed notification stub for BP {} reason={}", bp.getId(), reason);
    }
}
