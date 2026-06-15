package distributed_scheduling_engine.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class BookingResponseDTO {
    private UUID id;
    private String resourceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}