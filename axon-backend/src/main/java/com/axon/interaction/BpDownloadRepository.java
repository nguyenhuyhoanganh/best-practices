package com.axon.interaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BpDownloadRepository extends JpaRepository<BpDownload, UUID> {

    long countByBpId(UUID bpId);
}
