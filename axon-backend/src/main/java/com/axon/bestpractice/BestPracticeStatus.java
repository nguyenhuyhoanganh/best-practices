package com.axon.bestpractice;

public enum BestPracticeStatus {
    DRAFT, PENDING_REVIEW, UNDER_REVIEW, PUBLISHED, REJECTED;

    public boolean canEdit() { return this == DRAFT || this == REJECTED; }
    public boolean canSubmit() { return this == DRAFT || this == REJECTED; }
    public boolean canApproveOrReject() { return this == UNDER_REVIEW; }
}
