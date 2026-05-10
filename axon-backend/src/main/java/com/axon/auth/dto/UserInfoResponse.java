package com.axon.auth.dto;

public record UserInfoResponse(
    String id,
    String email,
    String name,
    String role,
    String avatarUrl
) {
    public static UserInfoResponse from(com.axon.user.User u) {
        return new UserInfoResponse(
            u.getId().toString(),
            u.getEmail(),
            u.getName(),
            u.getRole().name(),
            u.getAvatarUrl()
        );
    }
}
