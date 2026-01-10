package com.amfofana.school.controllers;


import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.repositories.LearningMaterialRepository;
import com.amfofana.school.repositories.MaterialDownloadRepository;
import com.amfofana.school.services.AdminMaterialService;
import com.amfofana.school.services.CloudStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/materials")
@RequiredArgsConstructor
public class AdminMaterialController {

    private final LearningMaterialRepository materialRepository;
    private final CloudStorageService cloudStorage;
    private final AdminMaterialService adminMaterialService;
    private final MaterialDownloadRepository downloadRepository;

    /**
     * 🟢 FIX: Only ONE @GetMapping allowed for the root path
     */
    @GetMapping
    public ResponseEntity<List<LearningMaterial>> getAllMaterials(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long teacherId
    ) {
        // If a classId is provided, filter by it
        if (classId != null) {
            return ResponseEntity.ok(materialRepository.findByClassId(classId));
        }

        // Otherwise, use the service to get everything (Sorted by Date)
        return ResponseEntity.ok(adminMaterialService.getAllMaterials());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteMaterial(@PathVariable Long id) throws IOException {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        // 1. Purge from Cloudinary
        // ✅ FIXED: Pass publicId and fileType to match the service signature
        cloudStorage.delete(material.getPublicId(), material.getFileType());

        // 2. Purge from Database
        materialRepository.delete(material);
    }

    @GetMapping("/analytics/downloads-per-class")
    public ResponseEntity<List<Map<String, Object>>> downloadsPerClass() {
        List<Object[]> data = downloadRepository.countDownloadsPerClass();

        List<Map<String, Object>> result = data.stream()
                .map(r -> Map.of(
                        "className", r[0] != null ? r[0] : "Unknown",
                        "downloads", r[1] != null ? r[1] : 0
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/search")
    public ResponseEntity<List<LearningMaterial>> search(@RequestParam String q) {
        return ResponseEntity.ok(adminMaterialService.search(q));
    }
}