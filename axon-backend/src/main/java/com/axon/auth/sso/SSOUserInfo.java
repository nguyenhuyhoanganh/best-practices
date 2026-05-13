package com.axon.auth.sso;

// P1: Returned by SSOProvider.exchange(code)
public record SSOUserInfo(
    String email,
    String name,
    String cipId,
    String avatarUrl,
    String department
) {}
