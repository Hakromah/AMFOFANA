package com.amfofana.school.services;

import com.amfofana.school.dto.UserDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentService {

    // Helper method to calculate grade if missing in DB
    private String calculateGrade(Double marks) {
        if (marks == null) return "N/A";
        if (marks >= 90) return "AA";
        if (marks >= 85) return "BA";
        if (marks >= 80) return "BB";
        if (marks >= 75) return "CB";
        if (marks >= 70) return "CC";
        if (marks >= 60) return "DC";
        if (marks >= 50) return "DD";
        return "FF";
    }

    private final ClasseRepository classeRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExamResultRepository examResultRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final TimetableRepository timetableRepository;

    private PasswordEncoder passwordEncoder;


    public StudentService(ClasseRepository classeRepository,
                          AttendanceRepository attendanceRepository,
                          ExamResultRepository examResultRepository,
                          ExamRepository examRepository,
                          UserRepository userRepository, TimetableRepository timetableRepository, PasswordEncoder passwordEncoder) {
        this.classeRepository = classeRepository;
        this.attendanceRepository = attendanceRepository;
        this.examResultRepository = examResultRepository;
        this.examRepository = examRepository;
        this.userRepository = userRepository;
        this.timetableRepository = timetableRepository;
        this.passwordEncoder = passwordEncoder;
    }


    //STUDENT SECTION
    public UserDTO getStudentProfile(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return convertToDTO(user);
    }

    @Transactional
    public UserDTO updateProfile(String email, UserDTO dto) {
        User user = userRepository.findByEmail(email).orElseThrow();

        // Allowed fields for student to self-update
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setAddress(dto.getAddress());
        user.setBirthCity(dto.getBirthCity());

        return convertToDTO(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, String oldPwd, String newPwd) {
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!passwordEncoder.matches(oldPwd, user.getPassword())) {
            throw new RuntimeException("Invalid current password");
        }
        user.setPassword(passwordEncoder.encode(newPwd));
        userRepository.save(user);
    }

    private UserDTO convertToDTO(User user) {
        // Ensure ALL fields are mapped here
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAddress(user.getAddress());
        dto.setBirthCity(user.getBirthCity());
        dto.setBirthCountry(user.getBirthCountry());
        dto.setBirthDate(user.getBirthDate());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setGender(user.getGender());
        return dto;
    }

    public List<Classe> getClassesByStudent(Long studentId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        return classeRepository.findByStudentsContains(student);
    }

    @Transactional(readOnly = true)
    public List<Attendance> getAttendanceByStudent(Long studentId) {
        // Fetch the sessions
        List<Attendance> sessions = attendanceRepository.findByRecordsStudentId(studentId);

        // Manually trigger the loading of the records and filter for this student
        sessions.forEach(session -> {
            session.getRecords().size(); // Forces initialization of the proxy
            session.setRecords(session.getRecords().stream()
                    .filter(r -> r.getStudent().getId().equals(studentId))
                    .collect(Collectors.toList()));
        });

        return sessions;
    }

    public List<Map<String, Object>> getResultsByStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // findByStudent should return all records in the exam_results table for this student ID
        return examResultRepository.findByStudent(student).stream()
                // Only show results teachers have actually published (PUBLISHED)
                // If failed results are missing, ensure teachers have clicked "Publish"
                .filter(result -> result.getStatus() == ExamResult.Status.SUBMITTED)
                .map(result -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", result.getId());
                    dto.put("marks", result.getMarks());
                    dto.put("grade", result.getLetterGrade());

                    // Ensure the exam object includes the classe object
                    dto.put("exam", result.getExam());

                    // Fetch class average for this specific exam
                    Double avg = examResultRepository.getAverageByExamId(result.getExam().getId());
                    dto.put("classAverage", avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0);

                    // Student Identity
                    Map<String, Object> studentMap = new HashMap<>();
                    studentMap.put("name", student.getName());
                    studentMap.put("userId", student.getUserId());
                    dto.put("student", studentMap);

                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Inside StudentService.java

    public List<Map<String, Object>> getSemesterTranscript(Long studentId, String semester) {
        List<ExamResult> results = examResultRepository.findByStudentIdAndSemester(studentId, semester);

        // Filter only submitted results (don't show drafts to students)
        Map<Long, List<ExamResult>> groupedBySubject = results.stream()
                .filter(r -> r.getStatus() == ExamResult.Status.SUBMITTED)
                .collect(Collectors.groupingBy(r -> r.getExam().getSubject().getId()));

        return groupedBySubject.values().stream().map(subjectResults -> {
            double finalScore = 0;
            String name = subjectResults.get(0).getExam().getSubject().getName();

            for (ExamResult r : subjectResults) {
                finalScore += (r.getMarks() * (r.getExam().getWeight() / 100.0));
            }

            Map<String, Object> map = new HashMap<>();
            map.put("courseName", name);
            map.put("finalScore", Math.round(finalScore * 100.0) / 100.0);
            map.put("grade", calculateGrade(finalScore));
            return map;
        }).collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public List<Exam> getExamsForStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Assuming the student is enrolled in one or more classes
        return examRepository.findByClasseIn(student.getEnrolledClasses());
    }

    public Map<String, Object> getDashboardStats(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // 1. Course Count
        long courseCount = classeRepository.findByStudentsContains(student).size();

        Set<Classe> studentClasses = student.getEnrolledClasses();
        long totalSessions = 0;
        long presentSessions = 0;

        if (!studentClasses.isEmpty()) {
            // Total sessions held for the classes the student is in
            totalSessions = attendanceRepository.countByClasseIn(studentClasses);
            // Sessions where this specific student was marked present
            presentSessions = attendanceRepository.countPresentSessions(studentId);
        }

        double attendanceRate = (totalSessions > 0)
                ? ((double) presentSessions / totalSessions) * 100
                : 0.0;


        // 4. Grade Calculation (Averaging only SUBMITTED results)
        List<ExamResult> results = examResultRepository.findByStudent(student).stream()
                .filter(r -> r.getStatus() == ExamResult.Status.SUBMITTED)
                .collect(Collectors.toList());

        String avgGrade = calculateGrade(
                results.stream().mapToDouble(ExamResult::getMarks).average().orElse(0.0)
        );

        // Response Map for Frontend
        Map<String, Object> stats = new HashMap<>();
        stats.put("courseCount", courseCount);
        stats.put("attendance", Math.round(attendanceRate * 10.0) / 10.0);
        stats.put("averageGrade", avgGrade);

        return stats;
    }

    //TIMETABLE
    public List<Timetable> getStudentTimetable(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return timetableRepository.findByClasseInOrderByDayOfWeekAscStartTimeAsc(student.getEnrolledClasses());
    }

}
