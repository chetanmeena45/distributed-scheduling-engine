package distributed_scheduling_engine.service;

import distributed_scheduling_engine.dto.BookingRequestDTO;
import distributed_scheduling_engine.dto.BookingResponseDTO;
import distributed_scheduling_engine.entity.ScheduleSlot;
import distributed_scheduling_engine.entity.SlotStatus;
import distributed_scheduling_engine.exception.SlotUnavailableException;
import distributed_scheduling_engine.repository.ScheduleSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulingService {

    private final ScheduleSlotRepository repository;

    @Transactional
    public BookingResponseDTO bookSlot(BookingRequestDTO request) {
        log.info("Attempting to lock and book slot for resource: {}", request.getResourceId());

        // 1. Acquire Pessimistic Lock on any overlapping slots
        List<ScheduleSlot> overlappingSlots = repository.findOverlappingBookedSlotsWithLock(
                request.getResourceId(),
                request.getStartTime(),
                request.getEndTime()
        );

        // 2. If the list is not empty, someone already has this slot
        if (!overlappingSlots.isEmpty()) {
            log.warn("Double booking attempt blocked for resource: {}", request.getResourceId());
            throw new SlotUnavailableException("The requested time slot is already booked for this resource.");
        }

        // 3. Safe to proceed. Create and save the new slot.
        ScheduleSlot newSlot = ScheduleSlot.builder()
                .resourceId(request.getResourceId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(SlotStatus.BOOKED)
                .build();

        ScheduleSlot savedSlot = repository.save(newSlot);
        log.info("Successfully booked slot ID: {}", savedSlot.getId());

        // 4. Map to Response DTO
        return BookingResponseDTO.builder()
                .id(savedSlot.getId())
                .resourceId(savedSlot.getResourceId())
                .startTime(savedSlot.getStartTime())
                .endTime(savedSlot.getEndTime())
                .status(savedSlot.getStatus().name())
                .build();
    }
}