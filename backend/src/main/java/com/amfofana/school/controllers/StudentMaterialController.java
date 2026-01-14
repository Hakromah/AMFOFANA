package com.amfofana.school.controllers;

import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.entities.MaterialDownload;
import com.amfofana.school.entities.User;
import com.amfofana.school.repositories.*;
import com.amfofana.school.services.StudentMaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/materials")
public class StudentMaterialController {


    private final StudentMaterialService service;
    private final UserRepository userRepository;
    private final MaterialDownloadRepository downloadRepository;
    private final LearningMaterialRepository materialRepository;





    public StudentMaterialController(StudentMaterialService service, UserRepository userRepository, MaterialDownloadRepository downloadRepository, LearningMaterialRepository materialRepository) {
        this.service = service;
        this.userRepository = userRepository;
        this.downloadRepository = downloadRepository;

        this.materialRepository = materialRepository;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // 1. GET THE DROPDOWN LIST (Called on page load)
    @GetMapping("/my-classes")
    public ResponseEntity<List<Classe>> getStudentClasses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(service.getClassesByStudent(user.getId()));
    }

    // 2. GET THE FILES (Called when class is selected)
    @GetMapping("/list/{classId}")
    public ResponseEntity<List<LearningMaterial>> getByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(service.getMaterialsForClass(classId));
    }

    @PostMapping("/{materialId}/track-download")
    @Transactional
    public ResponseEntity<Void> trackDownload(
            @PathVariable Long materialId,
            @RequestParam String studentEmail) {

        LearningMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        // Find student by email
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        MaterialDownload download = new MaterialDownload();
        download.setMaterial(material);
        download.setDownloadedBy(student);

        // Assign the class directly from the Student entity
        download.setClasse(student.getEnrolledClasses().stream().findFirst().orElse(null));
        download.setDownloadedAt(LocalDateTime.now());

        downloadRepository.save(download);
        return ResponseEntity.ok().build();
    }
}
