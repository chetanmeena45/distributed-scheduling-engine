package distributed_scheduling_engine.service;

import distributed_scheduling_engine.dto.BookingRequestDTO;
import distributed_scheduling_engine.dto.BookingResponseDTO;
import distributed_scheduling_engine.entity.ScheduleSlot;
import distributed_scheduling_engine.entity.SlotStatus;
import distributed_scheduling_engine.exception.SlotUnavailableException;
import distributed_scheduling_engine.lock.MemoryLockManager;
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
    private final MemoryLockManager lockManager;

    @Transactional
    public BookingResponseDTO bookSlot(BookingRequestDTO request) {
        String resourceId = request.getResourceId();
        log.info("Processing booking request for resource: {}", resourceId);

        // Stage 1: Try to acquire the ultra-fast In-Memory Lock
        if (!lockManager.acquireLock(resourceId)) {
            throw new SlotUnavailableException("The resource is currently busy. Please try again in a moment.");
        }

        try {
            // Stage 2: Perform the overlapping interval check with a database write lock
            List<ScheduleSlot> overlappingSlots = repository.findOverlappingBookedSlotsWithLock(
                    resourceId,
                    request.getStartTime(),
                    request.getEndTime()
            );

            if (!overlappingSlots.isEmpty()) {
                log.warn("Double booking attempt blocked in DB for resource: {}", resourceId);
                throw new SlotUnavailableException("The requested time slot is already booked for this resource.");
            }

            // Safe to insert into the database
            ScheduleSlot newSlot = ScheduleSlot.builder()
                    .resourceId(resourceId)
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .status(SlotStatus.BOOKED)
                    .build();

            ScheduleSlot savedSlot = repository.save(newSlot);
            log.info("Successfully booked slot ID: {}", savedSlot.getId());

            return BookingResponseDTO.builder()
                    .id(savedSlot.getId())
                    .resourceId(savedSlot.getResourceId())
                    .startTime(savedSlot.getStartTime())
                    .endTime(savedSlot.getEndTime())
                    .status(savedSlot.getStatus().name())
                    .build();

        } finally {
            // ALWAYS release the memory lock when done, whether the booking succeeds or fails!
            lockManager.releaseLock(resourceId);
        }
    }
}