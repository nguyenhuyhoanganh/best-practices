package com.axon.bestpractice.dto;

import com.axon.user.User;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record CreatorDto(
        UUID id,
        String name,
        @JsonProperty("avatar_url") String avatarUrl,
        String department
) {
    public static CreatorDto from(User u) {
        return new CreatorDto(u.getId(), u.getName(), u.getAvatarUrl(), u.getDepartment());
    }
}
