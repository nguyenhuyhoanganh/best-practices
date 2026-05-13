package com.axon.user;

import com.axon.user.dto.UpdateRoleRequest;
import com.axon.user.dto.UserAdminDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) UserRole role,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        Page<UserAdminDto> result = userAdminService.search(search, role, page, size);
        return ResponseEntity.ok(Map.of(
            "content", result.getContent(),
            "totalElements", result.getTotalElements(),
            "totalPages", result.getTotalPages(),
            "page", result.getNumber()
        ));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserAdminDto> updateRole(
        @PathVariable UUID id,
        @RequestBody UpdateRoleRequest req) {
        return ResponseEntity.ok(userAdminService.updateRole(id, req.role()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
