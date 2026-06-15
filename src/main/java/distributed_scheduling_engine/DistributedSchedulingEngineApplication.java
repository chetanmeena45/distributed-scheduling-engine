package distributed_scheduling_engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DistributedSchedulingEngineApplication {

	public static void main(String[] args) {
		System.out.println("application started");
		SpringApplication.run(DistributedSchedulingEngineApplication.class, args);
	}

}
