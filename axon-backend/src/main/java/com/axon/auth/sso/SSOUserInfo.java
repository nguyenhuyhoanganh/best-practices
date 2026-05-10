package com.axon.auth.sso;

public record SSOUserInfo(
    String provider, String subject,
    String email, String name, String avatarUrl
) {}
