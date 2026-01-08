package com.amfofana.school.services;

import com.amfofana.school.entities.Classe;
import com.amfofana.school.entities.LearningMaterial;
import com.amfofana.school.entities.User;
import com.amfofana.school.repositories.ClasseRepository;
import com.amfofana.school.repositories.LearningMaterialRepository;
import com.amfofana.school.repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentMaterialService {
    private final ClasseRepository classeRepository;
    private final UserRepository userRepository;
    private final LearningMaterialRepository materialRepository; // Add this

    public StudentMaterialService(ClasseRepository classeRepository,
                                  UserRepository userRepository,
                                  LearningMaterialRepository materialRepository) {
        this.classeRepository = classeRepository;
        this.userRepository = userRepository;
        this.materialRepository = materialRepository;
    }

    // For the Dropdown
    public List<Classe> getClassesByStudent(Long studentId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        return classeRepository.findByStudentsContains(student);
    }

    // For the Material Cards
    public List<LearningMaterial> getMaterialsForClass(Long classId) {
        return materialRepository.findByClassId(classId);
    }
}