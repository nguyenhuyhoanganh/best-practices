package com.axon.notification;

import com.axon.bestpractice.BestPractice;

public interface NotificationService {

    void notifyApproved(BestPractice bp);

    void notifyRejected(BestPractice bp, String comment);

    void notifyClosed(BestPractice bp, String reason);
}
