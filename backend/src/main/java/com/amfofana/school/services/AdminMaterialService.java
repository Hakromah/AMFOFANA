package com.amfofana.school.services;

import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.repositories.LearningMaterialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;

@Service
public class AdminMaterialService {
    private final LearningMaterialRepository materialRepository;
    private final CloudStorageService cloudStorageService;


    public AdminMaterialService(LearningMaterialRepository materialRepository, CloudStorageService cloudStorageService) {
        this.materialRepository = materialRepository;

        this.cloudStorageService = cloudStorageService;
    }

    public List<LearningMaterial> getAllMaterialsGlobal() {
        return materialRepository.findAll();
    }

    @Transactional
    public void adminDelete(Long id) throws IOException {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        // Global Cloud Purge
        cloudStorageService.delete(material.getFileName());

        // Global DB Purge
        materialRepository.delete(material);
    }

//    @Transactional
//    public void adminDelete(Long id) {
//        LearningMaterial material = materialRepository.findById(id).orElseThrow();
//        fileStorage.delete(material.getFileName());
//        materialRepository.delete(material);
//    }
}
