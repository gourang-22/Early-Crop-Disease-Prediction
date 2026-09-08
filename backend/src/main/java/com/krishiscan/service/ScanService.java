package com.krishiscan.service;

import com.krishiscan.model.SoilScan;
import com.krishiscan.repository.SoilScanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ScanService {

    private final SoilScanRepository scanRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    public Map<String, Object> processSoilScan(MultipartFile file) throws Exception {
        Map<String, Object> aiResult = callAiService(file);
        String soilType = (String) aiResult.get("soil_type");
        List<String> crops = getCropRecommendations(soilType);
        Map<String, String> health = getSoilHealth(soilType);

        SoilScan scan = SoilScan.builder()
                .soilType(soilType)
                .confidence(((Number) aiResult.get("confidence")).doubleValue())
                .phRange(health.get("phRange"))
                .drainage(health.get("drainage"))
                .nutrients(health.get("nutrients"))
                .recommendedCrops(String.join(",", crops))
                .build();
        scanRepository.save(scan);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("scanId", scan.getId());
        response.put("soilType", soilType);
        response.put("confidence", scan.getConfidence());
        response.put("health", health);
        response.put("crops", crops);
        return response;
    }

    private Map<String, Object> callAiService(MultipartFile file) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override public String getFilename() { return file.getOriginalFilename(); }
        };
        body.add("file", resource);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                aiServiceUrl + "/predict/soil", request, Map.class);
        return Objects.requireNonNull(response.getBody());
    }

    public Optional<Map<String, Object>> getScanById(Long id) {
        return scanRepository.findById(id).map(scan -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("scanId", scan.getId());
            result.put("soilType", scan.getSoilType());
            result.put("confidence", scan.getConfidence());
            result.put("health", Map.of(
                "phRange", scan.getPhRange(),
                "drainage", scan.getDrainage(),
                "nutrients", scan.getNutrients()
            ));
            result.put("crops", scan.getRecommendedCrops() != null
                ? List.of(scan.getRecommendedCrops().split(",")) : List.of());
            return result;
        });
    }

    public List<Map<String, Object>> getHistory(Long userId) {
        return scanRepository.findByUserIdOrderByScannedAtDesc(userId)
                .stream()
                .map(scan -> Map.<String, Object>of(
                    "scanId", scan.getId(),
                    "soilType", scan.getSoilType(),
                    "confidence", scan.getConfidence(),
                    "scannedAt", scan.getScannedAt()
                ))
                .toList();
    }

    private List<String> getCropRecommendations(String soilType) {
    if (soilType == null) return List.of();
    return switch (soilType.toLowerCase()) {
        case "alluvial_soil" -> List.of("Wheat", "Rice", "Sugarcane", "Maize", "Pulses");
        case "black_soil"    -> List.of("Cotton", "Soybean", "Sorghum", "Groundnut", "Sunflower");
        case "red_soil"      -> List.of("Groundnut", "Millets", "Tobacco", "Potato", "Ragi");
        case "laterite_soil" -> List.of("Tea", "Coffee", "Rubber", "Cashew", "Tapioca");
        case "arid_soil"     -> List.of("Bajra", "Jowar", "Moth Bean", "Cluster Bean", "Sesame");
        case "mountain_soil" -> List.of("Apple", "Tea", "Coffee", "Barley", "Potato");
        case "yellow_soil"   -> List.of("Rice", "Maize", "Groundnut", "Potato", "Vegetables");
        default              -> List.of("Consult local agronomist");
    };
    }

    private Map<String, String> getSoilHealth(String soilType) {
        if (soilType == null) return Map.of("phRange", "Unknown", "drainage", "Unknown", "nutrients", "Unknown");
        return switch (soilType.toLowerCase()) {
            case "alluvial" -> Map.of("phRange", "6.5-7.5", "drainage", "Good",      "nutrients", "High");
            case "black"    -> Map.of("phRange", "7.2-8.5", "drainage", "Poor",      "nutrients", "Moderate");
            case "red"      -> Map.of("phRange", "6.0-7.0", "drainage", "Good",      "nutrients", "Low");
            case "laterite" -> Map.of("phRange", "5.5-6.0", "drainage", "Excellent", "nutrients", "Low");
            case "sandy"    -> Map.of("phRange", "5.5-7.0", "drainage", "Excellent", "nutrients", "Very Low");
            default         -> Map.of("phRange", "N/A",     "drainage", "N/A",       "nutrients", "N/A");
        };
    }
}