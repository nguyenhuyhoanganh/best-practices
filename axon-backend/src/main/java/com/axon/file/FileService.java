package com.axon.file;

import com.axon.bestpractice.BestPractice;
import com.axon.bestpractice.BestPracticeRepository;
import com.axon.bestpractice.BpType;
import com.axon.config.StorageConfig;
import com.axon.user.User;
import com.axon.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final BpFileRepository fileRepository;
    private final BestPracticeRepository bestPracticeRepository;
    private final StorageConfig storageConfig;
    private final UserService userService;

    @Transactional
    public BpFile upload(UUID bpId, MultipartFile file, UUID uploadedById) throws IOException {
        BestPractice bp = bestPracticeRepository.findById(bpId).orElseThrow();
        if (bp.getType() == BpType.WEB) throw new IllegalArgumentException("WEB type does not support file upload");

        String uuid = UUID.randomUUID().toString();
        String safeOriginal = file.getOriginalFilename() != null
                ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_")
                : "file";
        String storedName = uuid + "_" + safeOriginal;
        Path dir = Paths.get(storageConfig.getVolumeBasePath(), bpId.toString());
        Files.createDirectories(dir);
        Path filePath = dir.resolve(storedName);
        file.transferTo(filePath.toFile());

        User uploader = userService.findById(uploadedById);
        BpFile bpFile = BpFile.builder()
                .bp(bp)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .filePath(filePath.toString())
                .uploadedBy(uploader)
                .build();
        return fileRepository.save(bpFile);
    }

    public Resource download(UUID bpId, UUID fileId) {
        BpFile bpFile = fileRepository.findByIdAndBp_Id(fileId, bpId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        Resource resource = new FileSystemResource(Paths.get(bpFile.getFilePath()));
        if (!resource.exists()) throw new RuntimeException("File not found on disk");
        return resource;
    }

    public BpFile findFile(UUID bpId, UUID fileId) {
        return fileRepository.findByIdAndBp_Id(fileId, bpId)
                .orElseThrow(() -> new RuntimeException("File not found"));
    }

    @Transactional
    public void deleteFile(UUID bpId, UUID fileId) throws IOException {
        BpFile bpFile = findFile(bpId, fileId);
        Files.deleteIfExists(Paths.get(bpFile.getFilePath()));
        fileRepository.delete(bpFile);
    }
}
