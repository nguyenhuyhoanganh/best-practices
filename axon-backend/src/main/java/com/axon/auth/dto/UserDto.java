package com.axon.auth.dto;

import com.axon.user.User;

public record UserDto(
    String id,
    String email,
    String name,
    String role,
    String avatarUrl,
    String department
) {
    public static UserDto from(User user) {
        return new UserDto(
            user.getId().toString(),
            user.getEmail(),
            user.getName(),
            user.getRole().name(),
            user.getAvatarUrl(),
            user.getDepartment()
        );
    }
}
