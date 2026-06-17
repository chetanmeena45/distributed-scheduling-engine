package distributed_scheduling_engine.controller;

import distributed_scheduling_engine.dto.BookingRequestDTO;
import distributed_scheduling_engine.dto.BookingResponseDTO;
import distributed_scheduling_engine.service.SchedulingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SchedulingController {

    private final SchedulingService schedulingService;

    @PostMapping("/book")
    public ResponseEntity<BookingResponseDTO> bookSlot(@Valid @RequestBody BookingRequestDTO request) {
        log.info("Received booking request for resource: {}", request.getResourceId());
        BookingResponseDTO response = schedulingService.bookSlot(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelSlot(@PathVariable UUID id) {
        log.info("Received cancellation request for slot ID: {}", id);
        schedulingService.cancelSlot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{resourceId}")
    public ResponseEntity<List<BookingResponseDTO>> getSchedules(@PathVariable String resourceId) {
        log.info("Fetching active schedules for resource: {}", resourceId);
        return ResponseEntity.ok(schedulingService.getSlotsByResource(resourceId));
    }

}