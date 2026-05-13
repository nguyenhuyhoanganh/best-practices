package com.axon.interaction.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LikeResult(
        @JsonProperty("like_count") int likeCount,
        @JsonProperty("is_liked") boolean isLiked
) {}
