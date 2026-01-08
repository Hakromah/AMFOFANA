package com.amfofana.school.controllers;

import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.services.AdminMaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/materials")
public class AdminMaterialController {
    private final AdminMaterialService service;

    public AdminMaterialController(AdminMaterialService service) {
        this.service = service;
    }

    @GetMapping("/all")
    public List<LearningMaterial> getAll() {
        return service.getAllMaterialsGlobal();
    }

//    @DeleteMapping("/{id}")
//    public ResponseEntity<?> forceDelete(@PathVariable Long id) {
//        service.adminDelete(id);
//        return ResponseEntity.ok().build();
//    }
}