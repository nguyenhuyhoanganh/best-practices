package com.axon.dashboard;

import com.axon.dashboard.dto.DashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "Dashboard", description = "Platform-wide statistics. Cached in Redis for 15 minutes per date-range key.")
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Get dashboard statistics",
            description = "Returns total submitters, published BPs, usage trend, top-5 lists, by-job/dept/capability breakdowns. " +
                    "Optionally filter by startDate/endDate (ISO format: YYYY-MM-DD).")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DashboardResponse> getStats(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getStats(startDate, endDate));
    }
}
