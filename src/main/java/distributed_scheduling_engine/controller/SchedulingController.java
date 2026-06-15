package distributed_scheduling_engine.controller;

import distributed_scheduling_engine.dto.BookingRequestDTO;
import distributed_scheduling_engine.dto.BookingResponseDTO;
import distributed_scheduling_engine.service.SchedulingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
public class SchedulingController {

    private final SchedulingService schedulingService;

    @PostMapping("/book")
    public ResponseEntity<BookingResponseDTO> bookSlot(@Valid @RequestBody BookingRequestDTO request) {
        log.info("Received booking request for resource: {}", request.getResourceId());
        BookingResponseDTO response = schedulingService.bookSlot(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}