package distributed_scheduling_engine.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequestDTO {

    @NotBlank(message = "Resource ID is mandatory")
    private String resourceId;

    @NotNull(message = "Start time is mandatory")
    @Future(message = "Start time must be in the future")
    private LocalDateTime startTime;

    @NotNull(message = "End time is mandatory")
    @Future(message = "End time must be in the future")
    private LocalDateTime endTime;
}