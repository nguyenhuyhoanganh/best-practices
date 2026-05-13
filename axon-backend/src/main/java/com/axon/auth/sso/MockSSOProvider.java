package com.axon.auth.sso;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

// P1: 4 hardcoded users for dev testing (no CIP/AD needed)
// user=user1 → USER, creator1 → AX_CREATOR, supporter1 → AX_SUPPORTER, admin1 → ADMIN
@Component
@Profile("dev")
public class MockSSOProvider implements SSOProvider {

    @Override
    public SSOUserInfo exchange(String code) {
        throw new UnsupportedOperationException("Implement in P1");
    }
}
