package com.axon.auth.sso;

// P1: Pluggable SSO — dev uses MockSSOProvider, prod uses CIPADProvider (P11)
public interface SSOProvider {
    SSOUserInfo exchange(String code);
}
