package com.axon.auth.sso;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

// P1: Returns a fixed dev user for any code — no CIP/AD needed
@Component
@Profile("dev")
public class MockSSOProvider implements SSOProvider {

    @Override
    public SSOUserInfo exchange(String code) {
        return new SSOUserInfo("dev@samsung.com", "Dev User", null, null, "IT Innovation");
    }
}
