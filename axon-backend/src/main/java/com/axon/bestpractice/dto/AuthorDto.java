package com.axon.bestpractice.dto;

import java.util.UUID;

public record AuthorDto(UUID id, String name, String avatarUrl) {
    public static AuthorDto from(com.axon.user.User u) {
        return new AuthorDto(u.getId(), u.getName(), u.getAvatarUrl());
    }
}
