package com.amfofana.school.services;

import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.repositories.LearningMaterialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminMaterialService {

    private final LearningMaterialRepository materialRepository; // Add this

    public AdminMaterialService(LearningMaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    @Transactional(readOnly = true)
    public List<LearningMaterial> getAllMaterials() {
        return materialRepository.findAllWithRelations();
    }

    /**
     * 🔍 FULL-TEXT SEARCH
     */
    @Transactional(readOnly = true)
    public List<LearningMaterial> search(String q) {
        return materialRepository.search(q);
    }
}
