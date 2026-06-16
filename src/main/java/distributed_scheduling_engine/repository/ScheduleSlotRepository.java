package distributed_scheduling_engine.repository;

import distributed_scheduling_engine.entity.ScheduleSlot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, UUID> {

    /**
     * Checks for any existing overlapping slots for a specific resource.
     * Applies a row-level PESSIMISTIC_WRITE lock on the returned records to prevent double-booking.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ScheduleSlot s WHERE s.resourceId = :resourceId " +
            "AND s.status = 'BOOKED' " +
            "AND (s.startTime < :endTime AND s.endTime > :startTime)")
    List<ScheduleSlot> findOverlappingBookedSlotsWithLock(
            @Param("resourceId") String resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
    List<ScheduleSlot> findByResourceId(String resourceId);
}