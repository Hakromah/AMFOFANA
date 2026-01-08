package com.amfofana.school.controllers;

import com.amfofana.school.dto.AttendanceDTO;
import com.amfofana.school.dto.MarksDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.ClasseRepository;
import com.amfofana.school.repositories.LearningMaterialRepository;
import com.amfofana.school.repositories.UserRepository;
import com.amfofana.school.services.TeacherService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
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

    @GetMapping("/classes/{classId}/students")
    @Operation(summary = "Get students by class")
    public ResponseEntity<List<User>> getStudentsByClass(
            @AuthenticationPrincipal UserDetails userDetails, // Get logged-in user
            @PathVariable("classId") Long classId
    ) {

        User teacher = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(teacherService.getStudentsByClass(teacher.getId(), classId));
    }

    // For test ends here
    @GetMapping("/students")
    public ResponseEntity<List<User>> getTeacherStudents(
            @AuthenticationPrincipal UserDetails userDetails, // Use UserDetails
            @RequestParam(required = false) Long classId) {
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

    @GetMapping("/classes/{classId}/attendance-history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(@PathVariable Long classId) {
        return ResponseEntity.ok(teacherService.getAttendanceHistory(classId));
    }

    // 2. Update an existing attendance session
    @PutMapping("/attendance/{attendanceId}")
    public ResponseEntity<?> updateAttendance(
            @PathVariable Long attendanceId,
            @RequestBody AttendanceDTO attendanceDTO) {
        teacherService.updateAttendance(attendanceId, attendanceDTO);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/marks")
    public ResponseEntity<?> submitMarks(@RequestBody MarksDTO marksDTO) {
        teacherService.submitMarks(marksDTO);
        return ResponseEntity.ok().build();
    }

    //EXAM CONTROLLER
    @PostMapping("/exams")
    public ResponseEntity<Exam> createExam(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Exam exam) {
        // 1. Get the authenticated teacher using your helper method
        User teacher = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(teacherService.createExam(teacher.getId(), exam));
    }

    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> getTeacherExams(@AuthenticationPrincipal UserDetails userDetails) {
        // Get the email from the JWT token automatically
        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Call the service using the ID we found from the token
        return ResponseEntity.ok(teacherService.getExamsByTeacher(teacher.getId()));
    }

    // UPDATE EXAM
    @PutMapping("/exams/{id}")
    public ResponseEntity<Exam> updateExam(
            @PathVariable Long id,
            @RequestBody Exam examDetails,
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        return ResponseEntity.ok(teacherService.updateExam(id, examDetails, teacher.getId()));
    }

    // DELETE EXAM
    @DeleteMapping("/exams/{id}")
    public ResponseEntity<?> deleteExam(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User teacher = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        teacherService.deleteExam(id, teacher.getId());
        return ResponseEntity.ok().build();
    }

    // TOGGLE EXAM STATUS (Open/Closed)
    @PatchMapping("/exams/{id}/toggle-status")
    public ResponseEntity<?> toggleExamStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        try {
            // Defensively extract the boolean
            Object closedValue = payload.get("closed");
            if (closedValue == null) {
                return ResponseEntity.badRequest().body("Missing 'closed' status in request body");
            }

            boolean isClosed = Boolean.parseBoolean(closedValue.toString());
            Exam updatedExam = teacherService.toggleExamStatus(id, isClosed);

            return ResponseEntity.ok(updatedExam);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
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

    //BULK MARKS ENTRY CONTROLLER
    @PostMapping("/results/bulk")
    public ResponseEntity<String> saveBulk(@AuthenticationPrincipal UserDetails userDetails, @RequestBody List<ExamResult> results) {
        User teacher = getAuthenticatedUser(userDetails);
        teacherService.saveBulkResults(teacher.getId(), results);
        return ResponseEntity.ok("Bulk marks saved successfully");
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
            @RequestParam(required = false) String studentId) {
        return ResponseEntity.ok(teacherService.filterResults(classId, studentId));
    }

    //TIMETABLE CONTROLLER
    @GetMapping("/timetables")
    public ResponseEntity<List<Timetable>> getMyTimetable(@AuthenticationPrincipal UserDetails userDetails) {
        User teacher = userRepository.findByEmail(userDetails.getUsername()).get();
        return ResponseEntity.ok(teacherService.getTeacherTimetable(teacher.getId()));
    }
}
