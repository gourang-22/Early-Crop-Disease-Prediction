package com.krishiscan.repository;

import com.krishiscan.model.SoilScan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SoilScanRepository extends JpaRepository<SoilScan, Long> {
    List<SoilScan> findByUserIdOrderByScannedAtDesc(Long userId);
}