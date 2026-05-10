package com.axon.auth.sso;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class MockSSOProvider implements SSOProvider {
    @Override
    public String getLoginUrl() {
        return "http://localhost:5173/auth/callback?code=mock-code";
    }

    @Override
    public SSOUserInfo exchangeCode(String code) {
        return new SSOUserInfo("mock", "mock-sub-001",
            "dev@company.com", "Dev User", "https://api.dicebear.com/7.x/avataaars/svg?seed=Dev");
    }

    @Override
    public String getProviderName() { return "mock"; }
}
