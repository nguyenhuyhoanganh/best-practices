package com.axon.user;

import com.axon.user.dto.UpdateRoleRequest;
import com.axon.user.dto.UserAdminDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Tag(name = "Admin - Users", description = "User management (ADMIN only): search users, update roles. AX_CREATOR is auto-assigned and cannot be set manually.")
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserAdminController {

    private final UserAdminService userAdminService;

    @Operation(summary = "Search users", description = "Paginated list with optional free-text search (name/email) and role filter")
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

    @Operation(summary = "Update user role", description = "Cannot assign AX_CREATOR (auto-assigned on first BP creation). Allowed: USER, AX_SUPPORTER, ADMIN.")
    @ApiResponse(responseCode = "200", description = "Role updated")
    @ApiResponse(responseCode = "400", description = "AX_CREATOR cannot be manually assigned")
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
