package com.axon.auth.jwt;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

// P1: Read Authorization: Bearer → validate → set SecurityContext
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        Claims claims = jwtService.parseToken(token);
        String userId = claims.getSubject();
        String role = claims.get("role", String.class);

        List<SimpleGrantedAuthority> authorities = buildAuthorities(role);

        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(userId, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> buildAuthorities(String role) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        if (role == null) {
            return authorities;
        }

        switch (role) {
            case "AX_CREATOR" -> authorities.add(new SimpleGrantedAuthority("ROLE_AX_CREATOR"));
            case "AX_SUPPORTER" -> {
                authorities.add(new SimpleGrantedAuthority("ROLE_AX_CREATOR"));
                authorities.add(new SimpleGrantedAuthority("ROLE_AX_SUPPORTER"));
            }
            case "ADMIN" -> {
                authorities.add(new SimpleGrantedAuthority("ROLE_AX_CREATOR"));
                authorities.add(new SimpleGrantedAuthority("ROLE_AX_SUPPORTER"));
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }
            default -> {
                // USER role — ROLE_USER already added
            }
        }

        return authorities;
    }
}
