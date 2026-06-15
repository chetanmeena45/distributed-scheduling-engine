package distributed_scheduling_engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DistributedSchedulingEngineApplication {

	public static void main(String[] args) {
		System.out.println("application started");
		SpringApplication.run(DistributedSchedulingEngineApplication.class, args);
	}
}
