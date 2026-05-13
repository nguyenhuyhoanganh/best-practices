package com.axon.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI axonOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AXon Best Practice Platform API")
                        .description("Internal Samsung best practice sharing platform API. " +
                                "Authenticate via GET /auth/login (Samsung SSO), then use the returned access_token as Bearer.")
                        .version("2.1.0")
                        .contact(new Contact()
                                .name("AXon Team")
                                .email("axon@company.internal")))
                .servers(List.of(
                        new Server().url("/").description("Current server")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT access token obtained from /auth/callback. " +
                                        "Refresh via POST /auth/refresh (uses HttpOnly cookie).")));
    }
}
