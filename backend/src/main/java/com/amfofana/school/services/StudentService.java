package com.amfofana.school.services;

import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentService {

    private final ClasseRepository classeRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExamResultRepository examResultRepository;
    private final LearningMaterialRepository learningMaterialRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    public StudentService(ClasseRepository classeRepository,
                          AttendanceRepository attendanceRepository,
                          ExamResultRepository examResultRepository,
                          LearningMaterialRepository learningMaterialRepository,
                          ExamRepository examRepository,
                          UserRepository userRepository) {
        this.classeRepository = classeRepository;
        this.attendanceRepository = attendanceRepository;
        this.examResultRepository = examResultRepository;
        this.learningMaterialRepository = learningMaterialRepository;
        this.examRepository = examRepository;
        this.userRepository = userRepository;
    }

    public List<Classe> getClassesByStudent(Long studentId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        return classeRepository.findByStudentsContains(student);
    }

    public List<Attendance> getAttendanceByStudent(Long studentId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        return attendanceRepository.findByStudent(student);
    }

//    public List<Map<String, Object>> getResultsByStudent(Long studentId) {
//        User student = userRepository.findById(studentId)
//                .orElseThrow(() -> new RuntimeException("Student not found"));
//
//        return examResultRepository.findByStudent(student).stream()
//                .filter(result -> result.getStatus() == ExamResult.Status.PUBLISHED || result.getStatus() == ExamResult.Status.GRADED)
//                .map(result -> {
//                    Map<String, Object> dto = new HashMap<>();
//                    dto.put("id", result.getId());
//                    dto.put("marks", result.getMarks());
//                    dto.put("grade", result.getLetterGrade());
//                    dto.put("exam", result.getExam());
//                    dto.put("classAverage", examResultRepository.getAverageByExamId(result.getExam().getId()));
//
//                    // --- ADD THIS SECTION ---
//                    Map<String, Object> studentMap = new HashMap<>();
//                    studentMap.put("name", student.getName());
//                    studentMap.put("userId", student.getUserId()); // This is your Student ID
//                    dto.put("student", studentMap);
//                    // ------------------------
//
//                    return dto;
//                })
//                .collect(Collectors.toList());
//    }

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

    public List<Exam> getExamsByStudent(Long studentId) {
        return examRepository.findAll();
    }

    public List<LearningMaterial> getMaterialsByStudent(Long studentId) {
        List<Classe> classes = getClassesByStudent(studentId);
        return classes.stream()
                .flatMap(classe -> learningMaterialRepository.findByClasse(classe).stream())
                .collect(Collectors.toList());
    }
}
