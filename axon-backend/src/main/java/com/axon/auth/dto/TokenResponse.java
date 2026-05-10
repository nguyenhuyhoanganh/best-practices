package com.axon.auth.dto;

public record TokenResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    UserInfoResponse user
) {}
