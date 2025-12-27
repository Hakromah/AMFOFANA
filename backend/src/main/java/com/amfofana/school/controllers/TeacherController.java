package com.amfofana.school.controllers;

import com.amfofana.school.dto.AttendanceDTO;
import com.amfofana.school.dto.MarksDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.ClasseRepository;
import com.amfofana.school.repositories.UserRepository;
import com.amfofana.school.services.TeacherService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {

    private final TeacherService teacherService;
    private final UserRepository userRepository;


    public TeacherController(TeacherService teacherService, UserRepository userRepository) {
        this.teacherService = teacherService;
        this.userRepository = userRepository;

    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<Classe>> getTeacherClasses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(teacherService.getClassesByTeacher(user.getId()));
    }

//    @GetMapping("/classes")
//    public ResponseEntity<List<Classe>> getTeacherClasses(@AuthenticationPrincipal User teacher) {
//        return ResponseEntity.ok(classeRepository.findByTeacher(teacher));
//    }


// For test starts here
//    @GetMapping("/students")
//    public ResponseEntity<List<User>> getTeacherStudents(@AuthenticationPrincipal UserDetails userDetails) {
//        User user = getAuthenticatedUser(userDetails);
//        return ResponseEntity.ok(teacherService.getStudentsByTeacher(user.getId()));
//    }

//    @GetMapping("/classes/{classId}/students")
//    @Operation(summary = "Get students by class")
//    public ResponseEntity<List<User>> getStudentsByClass(Long teacherId, @PathVariable Long classId) {
//        return ResponseEntity.ok(teacherService.getStudentsByClass(teacherId, classId));
//    }

    @GetMapping("/classes/{classId}/students")
    @Operation(summary = "Get students by class")
    public ResponseEntity<List<User>> getStudentsByClass(
            @AuthenticationPrincipal UserDetails userDetails, // Get logged-in user
            @PathVariable("classId") Long classId
    ) {
        // Assuming you have a helper to get your User entity from userDetails
//        User teacher = userRepository.findByEmail(userDetails.getUsername())
//                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        User teacher = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(teacherService.getStudentsByClass(teacher.getId(), classId));
    }

    // For test ends here
    @GetMapping("/students")
    public ResponseEntity<List<User>> getTeacherStudents(
            @AuthenticationPrincipal UserDetails userDetails, // Use UserDetails
            @RequestParam(required = false) Long classId
    ) {
        // You likely have a helper or can find by email/username to get the ID
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (classId != null) {
            return ResponseEntity.ok(teacherService.getStudentsByClass(teacher.getId(), classId));
        }
        return ResponseEntity.ok(teacherService.getStudentsByTeacher(teacher.getId()));
    }

    @PostMapping("/attendance")
    public ResponseEntity<?> submitAttendance(@RequestBody AttendanceDTO attendanceDTO) {
        teacherService.submitAttendance(attendanceDTO);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/marks")
    public ResponseEntity<?> submitMarks(@RequestBody MarksDTO marksDTO) {
        teacherService.submitMarks(marksDTO);
        return ResponseEntity.ok().build();
    }


    @PostMapping("/exams")
    public ResponseEntity<Exam> createExam(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Exam exam
    ) {
        // 1. Get the authenticated teacher using your helper method
        User teacher = getAuthenticatedUser(userDetails);

        // 2. Pass both the teacher ID and the exam to the service
        return ResponseEntity.ok(teacherService.createExam(teacher.getId(), exam));
    }


    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getTeacherExams(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        // 1. Get the authenticated teacher from your helper method
        User teacher = getAuthenticatedUser(userDetails);

        // 2. Call the new service method that hops from Teacher -> Class -> Exams
        List<Exam> exams = teacherService.getExamsByTeacher(teacher.getId());

        return ResponseEntity.ok(exams);
    }

    @PutMapping("/exams/{id}")
    public ResponseEntity<Exam> updateExam(@PathVariable Long id, @RequestBody Exam exam) {
        return ResponseEntity.ok(teacherService.updateExam(id, exam));
    }


    @GetMapping("/classes/{classId}/gradebook")
    @Operation(summary = "Get all student marks for a specific class")
    public ResponseEntity<List<ExamResult>> getGradebook(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long classId
    ) {
        // 1. Identify the logged-in teacher
        User teacher = getAuthenticatedUser(userDetails);

        // 2. Call the service method we built
        List<ExamResult> gradebook = teacherService.getGradebookByClass(teacher.getId(), classId);

        return ResponseEntity.ok(gradebook);
    }

    @DeleteMapping("/exams/{id}")
    public ResponseEntity<?> deleteExam(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User teacher = getAuthenticatedUser(userDetails);
        teacherService.deleteExam(id, teacher.getId());
        return ResponseEntity.ok().build();
    }

    //BULK MARKS ENTRY CONTROLLER
    @PostMapping("/results/bulk")
    public ResponseEntity<String> saveBulk(@AuthenticationPrincipal UserDetails userDetails, @RequestBody List<ExamResult> results) {
        User teacher = getAuthenticatedUser(userDetails);
        teacherService.saveBulkResults(teacher.getId(), results);
        return ResponseEntity.ok("Bulk marks saved successfully");
    }

    @PostMapping("/materials")
    public ResponseEntity<LearningMaterial> uploadMaterial(@RequestBody LearningMaterial material) {
        return ResponseEntity.ok(teacherService.uploadLearningMaterial(material));
    }

    @GetMapping("/materials")
    public ResponseEntity<List<LearningMaterial>> getMaterials(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(teacherService.getMaterialsByTeacher(user.getId()));
    }

    @DeleteMapping("/materials/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable Long id) {
        teacherService.deleteLearningMaterial(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getAllSubjects() {
        return ResponseEntity.ok(teacherService.getAllSubjects());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(teacherService.updateProfile(user.getId(), payload));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser(userDetails);
        teacherService.changePassword(user.getId(), payload.get("currentPassword"), payload.get("newPassword"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/results")
    public ResponseEntity<ExamResult> createResult(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ExamResult result
    ) {
        User teacher = getAuthenticatedUser(userDetails); // Your existing helper
        return ResponseEntity.ok(teacherService.saveResult(teacher.getId(), result));
    }

    @PutMapping("/results/{id}")
    public ResponseEntity<ExamResult> updateResult(@PathVariable Long id, @RequestBody ExamResult result) {
        return ResponseEntity.ok(teacherService.updateResult(id, result));
    }

    @PostMapping("/results/submit")
    public ResponseEntity<?> submitResults(@RequestBody List<Long> resultIds) {
        teacherService.submitResults(resultIds);
        return ResponseEntity.ok().build();
    }


    @GetMapping("/results")
    public ResponseEntity<List<ExamResult>> getResults(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(teacherService.getResultsByTeacher(user.getId()));
    }


    @GetMapping("/results/filter")
    public ResponseEntity<List<Map<String, Object>>> filterResults(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long studentId) {
        return ResponseEntity.ok(teacherService.filterResults(classId, studentId));
    }
}
