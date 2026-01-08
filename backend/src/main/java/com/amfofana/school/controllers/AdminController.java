package com.amfofana.school.controllers;

import com.amfofana.school.dto.ClasseDTO;
import com.amfofana.school.dto.ReportDTO;
import com.amfofana.school.dto.UserDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.UserRepository;
import com.amfofana.school.services.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // User Management
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(adminService.createUser(user));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(adminService.getAllUsers(role));
    }

    @PostMapping("/users/bulk")
    public ResponseEntity<Map<String, Object>> bulkCreateUsers(
            @RequestBody @Valid List<UserDTO> users) {

        // Execute the service logic we built
        Map<String, Object> summary = adminService.saveAll(users);

        // Return 200 OK with the imported/skipped counts
        return ResponseEntity.ok(summary);
    }


    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(adminService.updateUser(id, user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    // Class Management
    @PostMapping("/classes")
    public ResponseEntity<ClasseDTO> createClass(@RequestBody Classe classe) {
        return ResponseEntity.ok(adminService.createClass(classe));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<ClasseDTO>> getAllClasses() {
        return ResponseEntity.ok(adminService.getAllClasses());
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<ClasseDTO> updateClass(@PathVariable Long id, @RequestBody Classe classe) {
        return ResponseEntity.ok(adminService.updateClass(id, classe));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable Long id) {
        adminService.deleteClass(id);
        return ResponseEntity.ok().build();
    }

    // Subject Management
    @PostMapping("/subjects")
    public ResponseEntity<Subject> createSubject(@RequestBody Subject subject) {
        return ResponseEntity.ok(adminService.createSubject(subject));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getAllSubjects() {
        return ResponseEntity.ok(adminService.getAllSubjects());
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable Long id, @RequestBody Subject subject) {
        return ResponseEntity.ok(adminService.updateSubject(id, subject));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        adminService.deleteSubject(id);
        return ResponseEntity.ok().build();
    }

    // Learning Material Management
    @PostMapping("/materials")
    public ResponseEntity<LearningMaterial> uploadMaterial(@RequestBody LearningMaterial material) {
        return ResponseEntity.ok(adminService.createLearningMaterial(material));
    }

    @GetMapping("/materials")
    public ResponseEntity<List<LearningMaterial>> getAllMaterials() {
        return ResponseEntity.ok(adminService.getAllLearningMaterials());
    }

    @DeleteMapping("/materials/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable Long id) {
        adminService.deleteLearningMaterial(id);
        return ResponseEntity.ok().build();
    }

    // Timetable Management
    @PostMapping("/timetables")
    public ResponseEntity<Timetable> createTimetableEntry(@RequestBody Timetable timetable) {
        return ResponseEntity.ok(adminService.createTimetableEntry(timetable));
    }

    @GetMapping("/timetables")
    public ResponseEntity<List<Timetable>> getAllTimetableEntries() {
        return ResponseEntity.ok(adminService.getAllTimetableEntries());
    }

    @PutMapping("/timetables/{id}")
    public ResponseEntity<Timetable> updateTimetableEntry(@PathVariable Long id, @RequestBody Timetable timetable) {
        return ResponseEntity.ok(adminService.updateTimetableEntry(id, timetable));
    }

    @DeleteMapping("/timetables/{id}")
    public ResponseEntity<?> deleteTimetableEntry(@PathVariable Long id) {
        adminService.deleteTimetableEntry(id);
        return ResponseEntity.ok().build();
    }

    // Assignments
    @PostMapping("/assign-teacher")
    public ResponseEntity<?> assignTeacherToClass(@RequestBody Map<String, Long> payload) {
        adminService.assignTeacherToClass(payload.get("teacherId"), payload.get("classId"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/assign-student")
    public ResponseEntity<?> assignStudentToClass(@RequestBody Map<String, Long> payload) {
        adminService.assignStudentToClass(payload.get("studentId"), payload.get("classId"));
        return ResponseEntity.ok().build();
    }

    // Student Class Lookup
    @GetMapping("/students/{studentId}/classes")
    public ResponseEntity<List<ClasseDTO>> getClassesForStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(adminService.getClassesForStudent(studentId));
    }

    // Reports
    @GetMapping("/reports/summary")
    public ResponseEntity<ReportDTO> getSummaryReport() {
        return ResponseEntity.ok(adminService.getSummaryReport());
    }

    // Profile & Settings
    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(adminService.updateProfile(user.getId(), payload));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser(userDetails);
        adminService.changePassword(user.getId(), payload.get("currentPassword"), payload.get("newPassword"));
        return ResponseEntity.ok().build();
    }


    // Centralized Administrative Filtering
    @GetMapping("/results/filter")
    public ResponseEntity<List<Map<String, Object>>> filterResults(
            @RequestParam(required = false) String studentQuery, // Matches frontend key
            @RequestParam(required = false) Long classId) {

        return ResponseEntity.ok(adminService.filterResultsForAdmin(studentQuery, classId));
    }

    // Semester-wide GPA and Aggregated Course Results
    @GetMapping("/reports/semester-summary")
    public ResponseEntity<Map<String, Object>> getStudentSemesterGPA(
            @RequestParam Long studentId,
            @RequestParam String semester) {
        return ResponseEntity.ok(adminService.calculateSemesterGPA(studentId, semester));
    }

    @PutMapping("/semester/finalize")
    public ResponseEntity<?> finalizeSemester(@RequestParam String semester) {
        adminService.lockSemesterResults(semester);
        return ResponseEntity.ok(Map.of("message", "Semester " + semester + " has been officially closed."));
    }

    // Close/Lock a semester to prevent further teacher edits
    @PutMapping("/semester/lock")
    public ResponseEntity<?> lockSemester(@RequestParam String semester) {
        adminService.lockSemesterResults(semester);
        return ResponseEntity.ok().build();
    }


    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getExams(
            @RequestParam(required = false) Long teacherId,
            @RequestParam(required = false) Long classId) {
        return ResponseEntity.ok(adminService.getExams(teacherId, classId));
    }

    @PatchMapping("/exams/lock-semester")
    public ResponseEntity<?> lockSemester(@RequestBody Map<String, String> request) {
        String semester = request.get("semester");
        adminService.lockAllExamsInSemester(semester);
        return ResponseEntity.ok().build();
    }
}