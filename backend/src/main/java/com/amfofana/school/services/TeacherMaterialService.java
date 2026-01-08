package com.amfofana.school.services;

import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.entities.User;
import com.amfofana.school.repositories.ClasseRepository;
import com.amfofana.school.repositories.LearningMaterialRepository;
import com.amfofana.school.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@Service
public class TeacherMaterialService {

    private final LearningMaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final ClasseRepository classeRepository;
    private final CloudStorageService cloudStorage;

    public TeacherMaterialService(LearningMaterialRepository materialRepository,
                                  UserRepository userRepository,
                                  ClasseRepository classeRepository,
                                  CloudStorageService cloudStorage) {
        this.materialRepository = materialRepository;
        this.userRepository = userRepository;
        this.classeRepository = classeRepository;
        this.cloudStorage = cloudStorage;
    }

    /**
     * Process file upload, store in Cloudinary, and save metadata to DB
     */
    @Transactional
    public LearningMaterial upload(
            String email,
            MultipartFile file,
            String title,
            String desc,
            List<Long> classIds
    ) throws IOException {

        User teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Teacher identity not found"));

        List<Classe> targetClasses = classeRepository.findAllById(classIds);
        if (targetClasses.isEmpty()) {
            throw new RuntimeException("At least one target class must be selected");
        }

        Map<?, ?> uploadResult = cloudStorage.upload(file);

        LearningMaterial material = new LearningMaterial();
        material.setTitle(title);
        material.setDescription(desc);
        material.setPublicId((String) uploadResult.get("public_id")); // ✅ CORRECT
        material.setFileUrl((String) uploadResult.get("secure_url")); // ✅ RAW URL
        material.setFileName(file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : material.getTitle() + ".pdf");
        material.setFileType((String) uploadResult.get("resource_type"));
        material.setFileSize(((Number) uploadResult.get("bytes")).longValue());
        material.setUploadedBy(teacher);
        material.setTargetClasses(new HashSet<>(targetClasses));

        return materialRepository.save(material);
    }


    /**
     * Fetch all materials uploaded by the current teacher
     */
    public List<LearningMaterial> getMyMaterials(String email) {
        return materialRepository.findByUploadedByEmailOrderByCreatedAtDesc(email);
    }

    /**
     * Securely delete material from both Cloudinary and Database
     */
    @Transactional
    public void delete(Long id, String email) throws IOException {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        // Ownership Verification
        if (!material.getUploadedBy().getEmail().equals(email)) {
            throw new RuntimeException("Access Denied: You do not own this resource");
        }

        // 1. Purge from Cloudinary using the stored public_id
        cloudStorage.delete(material.getFileName());

        // 2. Purge from Database
        materialRepository.delete(material);
    }


//    @Transactional
//    public void fixBrokenCloudinaryUrls() {
//        List<LearningMaterial> materials = materialRepository.findAll();
//
//        materials.forEach(m -> {
//            if (m.getFileUrl() != null && m.getFileUrl().contains("/image/upload/")) {
//                m.setFileUrl(
//                        m.getFileUrl().replace("/image/upload/", "/raw/upload/")
//                );
//            }
//        });
//    }
}