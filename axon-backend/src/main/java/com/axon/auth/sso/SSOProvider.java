package com.axon.auth.sso;

public interface SSOProvider {
    String getLoginUrl();
    SSOUserInfo exchangeCode(String code);
    String getProviderName();
}
