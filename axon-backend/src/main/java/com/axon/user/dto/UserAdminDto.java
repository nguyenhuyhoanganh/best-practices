package com.axon.user.dto;

import com.axon.user.User;
import com.axon.user.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserAdminDto(
    UUID id,
    String email,
    String name,
    @JsonProperty("cip_id") String cipId,
    UserRole role,
    String department,
    @JsonProperty("avatar_url") String avatarUrl,
    @JsonProperty("created_at") LocalDateTime createdAt,
    @JsonProperty("last_login_at") LocalDateTime lastLoginAt
) {
    public static UserAdminDto from(User u) {
        return new UserAdminDto(
            u.getId(), u.getEmail(), u.getName(), u.getCipId(),
            u.getRole(), u.getDepartment(), u.getAvatarUrl(),
            u.getCreatedAt(), u.getLastLoginAt()
        );
    }
}
