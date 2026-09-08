package com.krishiscan.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "soil_scans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoilScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String imagePath;
    private String soilType;
    private Double confidence;
    private String phRange;
    private String drainage;
    private String nutrients;

    @Column(length = 1000)
    private String recommendedCrops;

    @Column(updatable = false)
    private LocalDateTime scannedAt;

    @PrePersist
    protected void onCreate() {
        scannedAt = LocalDateTime.now();
    }
}