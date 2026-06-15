package distributed_scheduling_engine.exception;

public class SlotUnavailableException extends RuntimeException {
    public SlotUnavailableException(String message) {
        super(message);
    }
}