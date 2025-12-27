package com.amfofana.school.controllers;

import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.UserRepository;
import com.amfofana.school.services.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final StudentService studentService;
    private final UserRepository userRepository;

    public StudentController(StudentService studentService, UserRepository userRepository) {
        this.studentService = studentService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<Classe>> getStudentClasses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(studentService.getClassesByStudent(user.getId()));
    }

    @GetMapping("/attendance")
    public ResponseEntity<List<Attendance>> getStudentAttendance(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(studentService.getAttendanceByStudent(user.getId()));
    }

    //    @GetMapping("/results")
//    public ResponseEntity<List<ExamResult>> getStudentResults(@AuthenticationPrincipal UserDetails userDetails) {
//        User user = getAuthenticatedUser(userDetails);
//        return ResponseEntity.ok(studentService.getResultsByStudent(user.getId()));
//    }
    @GetMapping("/results")
    public List<Map<String, Object>> getResultsByStudent(@AuthenticationPrincipal UserDetails userDetails) {
        User student = getAuthenticatedUser(userDetails);
        return studentService.getResultsByStudent(student.getId());
    }

    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getStudentExams(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(studentService.getExamsByStudent(user.getId()));
    }

    @GetMapping("/materials")
    public ResponseEntity<List<LearningMaterial>> getStudentMaterials(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(studentService.getMaterialsByStudent(user.getId()));
    }

    @GetMapping("/materials/{materialId}")
    public ResponseEntity<?> downloadMaterial(@PathVariable Long materialId) {
        // This is a placeholder. A real implementation would return a file stream.
        return ResponseEntity.ok().build();
    }
}
