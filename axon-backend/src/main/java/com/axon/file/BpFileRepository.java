package com.axon.file;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BpFileRepository extends JpaRepository<BpFile, UUID> {

    List<BpFile> findByBp_IdOrderByUploadedAtDesc(UUID bpId);

    Optional<BpFile> findByIdAndBp_Id(UUID id, UUID bpId);
}
