package distributed_scheduling_engine.lock;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class MemoryLockManager {

    // A thread-safe map where the key is the Resource ID and the value is a Boolean (true if locked)
    private final ConcurrentHashMap<String, Boolean> locks = new ConcurrentHashMap<>();

    /**
     * Attempts to acquire a lock for a specific resource.
     * @return true if the lock was successfully acquired, false if it was already locked.
     */
    public boolean acquireLock(String resourceId) {
        // putIfAbsent acts as our atomic test-and-set operator.
        // It inserts the key with value 'true' ONLY if the key does not exist yet.
        Boolean previousValue = locks.putIfAbsent(resourceId, true);

        // If previousValue is null, it means the key wasn't there, so we successfully grabbed the lock!
        boolean acquired = (previousValue == null);

        if (acquired) {
            log.info("Memory lock ACQUIRED for resource: {}", resourceId);
        } else {
            log.warn("Memory lock COLLISION: Resource {} is already locked by another thread", resourceId);
        }

        return acquired;
    }

    /**
     * Releases the lock for a specific resource so others can use it.
     */
    public void releaseLock(String resourceId) {
        locks.remove(resourceId);
        log.info("Memory lock RELEASED for resource: {}", resourceId);
    }
}