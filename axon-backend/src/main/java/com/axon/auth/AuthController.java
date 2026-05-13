package com.axon.auth;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// P1: POST /auth/login, GET /auth/callback, POST /auth/refresh, POST /auth/logout, GET /auth/me
@RestController
@RequestMapping("/auth")
public class AuthController {
}
