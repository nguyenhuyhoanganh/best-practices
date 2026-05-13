package com.axon.user;

import com.axon.user.dto.UserAdminDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<UserAdminDto> search(String search, UserRole role, int page, int size) {
        String q = (search != null && !search.isBlank()) ? search.trim() : null;
        PageRequest pr = PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.searchUsers(q, role, pr).map(UserAdminDto::from);
    }

    @Transactional
    public UserAdminDto updateRole(UUID userId, UserRole newRole) {
        // Only AX_SUPPORTER, ADMIN, USER allowed — AX_CREATOR is auto-assigned when first BP created
        if (newRole == UserRole.AX_CREATOR) {
            throw new IllegalArgumentException("AX_CREATOR role is auto-assigned and cannot be set manually");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        user.setRole(newRole);
        return UserAdminDto.from(userRepository.save(user));
    }
}
