package com.amfofana.school.controllers;

import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.entities.User;
import com.amfofana.school.repositories.UserRepository;
import com.amfofana.school.services.StudentMaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/materials")
public class StudentMaterialController {
    private final StudentMaterialService service;
    private final UserRepository userRepository;




    public StudentMaterialController(StudentMaterialService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
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
}
