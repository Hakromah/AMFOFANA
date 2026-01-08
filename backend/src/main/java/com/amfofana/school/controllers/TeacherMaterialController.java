package com.amfofana.school.controllers;

import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.entities.User;
import com.amfofana.school.repositories.UserRepository;
import com.amfofana.school.services.TeacherMaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher/materials")
public class TeacherMaterialController {

    private final TeacherMaterialService materialService;
    private final UserRepository userRepository;


    public TeacherMaterialController(TeacherMaterialService materialService, UserRepository userRepository) {
        this.materialService = materialService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<LearningMaterial> getMyMaterials(@AuthenticationPrincipal UserDetails user) {
        return materialService.getMyMaterials(user.getUsername());
    }
    @GetMapping("/my-classes")
    public ResponseEntity<?> getMyClasses(@AuthenticationPrincipal UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Returning a simplified list of class data to avoid any hidden recursion
        List<Map<String, Object>> classData = teacher.getTeachingClasses().stream().map(c -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", c.getId());      // Corrected from .id() to .put()
            map.put("name", c.getName());
            return map;
        }).toList();

        return ResponseEntity.ok(classData);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) throws IOException {
        materialService.delete(id, user.getUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<LearningMaterial> upload(
            @AuthenticationPrincipal UserDetails userDetails, // OK HERE
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("classIds") List<Long> classIds
    ) throws IOException {

        // Pass the email string to the service
        return ResponseEntity.ok(materialService.upload(userDetails.getUsername(), file, title, description, classIds));
    }
}