package com.amfofana.school.controllers;

import com.amfofana.school.dto.UserDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.UserRepository;
import com.amfofana.school.services.StudentService;
import com.amfofana.school.services.TeacherService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final StudentService studentService;
    private final UserRepository userRepository;
    private final TeacherService teacherService;


    public StudentController(StudentService studentService, UserRepository userRepository, TeacherService teacherService) {
        this.studentService = studentService;
        this.userRepository = userRepository;
        this.teacherService = teacherService;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }


    //STUDENT PROFILE SECTION
    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(studentService.getStudentProfile(userDetails.getUsername()));
    }

    @PutMapping("/profile/update")
    public ResponseEntity<UserDTO> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UserDTO updateDto) {
        return ResponseEntity.ok(studentService.updateProfile(userDetails.getUsername(), updateDto));
    }

    @PutMapping("/profile/change-password")
    public ResponseEntity<String> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> passwords) {
        studentService.changePassword(
                userDetails.getUsername(),
                passwords.get("currentPassword"),
                passwords.get("newPassword")
        );
        return ResponseEntity.ok("Security credentials updated");
    }


    @GetMapping("/classes")
    public ResponseEntity<List<Classe>> getStudentClasses(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(studentService.getClassesByStudent(user.getId()));
    }

    @GetMapping("/attendance")
    public ResponseEntity<?> getStudentAttendance(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired");
        }

        try {
            // Find user by email (username) from the JWT token
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            List<Attendance> attendance = studentService.getAttendanceByStudent(user.getId());
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            // IMPORTANT: Check your IDE console/logs to see the real error message
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> getMyDashboardStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        // 1. Resolve student from security context
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Fetch aggregated stats
        Map<String, Object> stats = studentService.getDashboardStats(user.getId());

        return ResponseEntity.ok(stats);
    }

    // Aggregated Semester Transcript (Finalized Course Grades)
    @GetMapping("/academic/semester-transcript")
    public ResponseEntity<List<Map<String, Object>>> getMySemesterTranscript(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String semester) {
        User student = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(studentService.getSemesterTranscript(student.getId(), semester));
    }

    @GetMapping("/results")
    public List<Map<String, Object>> getResultsByStudent(@AuthenticationPrincipal UserDetails userDetails) {
        User student = getAuthenticatedUser(userDetails);
        return studentService.getResultsByStudent(student.getId());
    }

    @GetMapping("/materials/{materialId}")
    public ResponseEntity<?> downloadMaterial(@PathVariable Long materialId) {
        // This is a placeholder. A real implementation would return a file stream.
        return ResponseEntity.ok().build();
    }

    //TIMETABLE CONTROLLER
    @GetMapping("/timetables")
    public ResponseEntity<List<Timetable>> getMyTimetable(@AuthenticationPrincipal UserDetails userDetails) {
        User student = userRepository.findByEmail(userDetails.getUsername()).get();
        return ResponseEntity.ok(studentService.getStudentTimetable(student.getId()));
    }

    @GetMapping("/exams")
    public ResponseEntity<?> getMyExams(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired");
        }

        try {
            // 1. Resolve the student from the database using email from token
            User student = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            // 2. Fetch exams based on the student's enrolled classes
            List<Exam> exams = studentService.getExamsForStudent(student.getId());

            return ResponseEntity.ok(exams);
        } catch (Exception e) {
            // Log the error for debugging (check your console if this returns 400)
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registry Error: " + e.getMessage());
        }
    }
}
