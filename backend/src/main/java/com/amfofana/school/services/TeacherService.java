package com.amfofana.school.services;

import com.amfofana.school.dto.AttendanceDTO;
import com.amfofana.school.dto.MarksDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeacherService {

    private String convertToLetter(Double marks) {
        if (marks == null) return "-";
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
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final LearningMaterialRepository learningMaterialRepository;
    private final SubjectRepository subjectRepository;
    private final PasswordEncoder passwordEncoder;

    public TeacherService(ClasseRepository classeRepository,
                          AttendanceRepository attendanceRepository,
                          ExamResultRepository examResultRepository,
                          UserRepository userRepository,
                          ExamRepository examRepository,
                          LearningMaterialRepository learningMaterialRepository,
                          SubjectRepository subjectRepository,
                          PasswordEncoder passwordEncoder) {
        this.classeRepository = classeRepository;
        this.attendanceRepository = attendanceRepository;
        this.examResultRepository = examResultRepository;
        this.userRepository = userRepository;
        this.examRepository = examRepository;
        this.learningMaterialRepository = learningMaterialRepository;
        this.subjectRepository = subjectRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Classe> getClassesByTeacher(Long teacherId) {
//        User teacher = new User();
//        teacher.setId(teacherId);
        User teacher = userRepository.getReferenceById(teacherId);
        return classeRepository.findByTeachersContains(teacher);
    }

    //    GET STUDENTS BY TEACHER
    @Transactional(readOnly = true) // This keeps the DB session open during the stream
    public List<User> getStudentsByTeacher(Long teacherId) {
        List<Classe> classes = classeRepository.findByTeacherWithStudents(teacherId);

        return classes.stream()
                .flatMap(classe -> classe.getStudents().stream())
                .distinct()
                .collect(Collectors.toList());
    }

    //GET STUDENTS BY CLASS
    public List<User> getStudentsByClass(Long teacherId, Long classId) {
        Classe classe = classeRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        // NEW SECURITY CHECK: Verify if the teacherId is in the set of teachers for this class
        boolean isAssigned = classe.getTeachers().stream()
                .anyMatch(t -> t.getId().equals(teacherId));

        // Faster check using the Repository
        if (!classeRepository.existsByIdAndTeachers_Id(classId, teacherId)) {
            throw new RuntimeException("Access denied: This is not one of your classes.");
        }

        return new ArrayList<>(classe.getStudents());
    }

    public void submitAttendance(AttendanceDTO attendanceDTO) {
        Classe classe = classeRepository.findById(attendanceDTO.getClassId()).orElseThrow(() -> new RuntimeException("Class not found"));
        for (AttendanceDTO.AttendanceRecordDTO record : attendanceDTO.getRecords()) {
            User student = userRepository.findById(record.getStudentId()).orElseThrow(() -> new RuntimeException("Student not found"));
            Attendance attendance = new Attendance();
            attendance.setClasse(classe);
            attendance.setStudent(student);
            attendance.setDate(attendanceDTO.getDate());
            attendance.setStatus(record.isPresent());
            attendanceRepository.save(attendance);
        }
    }

    public void submitMarks(MarksDTO marksDTO) {
        Exam exam = examRepository.findById(marksDTO.getExamId()).orElseThrow(() -> new RuntimeException("Exam not found"));
        for (MarksDTO.MarkRecordDTO record : marksDTO.getMarks()) {
            User student = userRepository.findById(record.getStudentId()).orElseThrow(() -> new RuntimeException("Student not found"));
            ExamResult examResult = new ExamResult();
            examResult.setExam(exam);
            examResult.setStudent(student);
            examResult.setMarks(record.getScore());
            examResultRepository.save(examResult);
        }
    }

    // CREATE EXAM
    @Transactional
    public Exam createExam(Long teacherId, Exam exam) {
        User creator = userRepository.findById(teacherId).orElseThrow();

        // Fetch the real Class object from DB using the ID sent from frontend
        Classe classe = classeRepository.findById(exam.getClasse().getId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        exam.setTeacher(creator);
        exam.setClasse(classe);

        return examRepository.save(exam);
    }

    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Exam> getExamsByTeacher(Long teacherId) {
        return examRepository.findExamsByTeacherId(teacherId);
    }

    public List<ExamResult> getGradebookByClass(Long teacherId, Long classId) {
        // Security check: Ensure teacher belongs to this class
        if (!classeRepository.existsByIdAndTeachers_Id(classId, teacherId)) {
            throw new RuntimeException("Unauthorized access to this class gradebook.");
        }
        return examResultRepository.findResultsByClassId(classId);
    }

    //BULK MARKS ENTRY
    @Transactional
    public void saveBulkResults(Long teacherId, List<ExamResult> results) {
        for (ExamResult incoming : results) {
            Long studentId = incoming.getStudent().getId();
            Long examId = incoming.getExam().getId();

            // 1. Authorization Check
            Exam exam = examRepository.findById(examId)
                    .orElseThrow(() -> new RuntimeException("Exam not found"));

            boolean isAuthorized = exam.getClasse().getTeachers().stream()
                    .anyMatch(t -> t.getId().equals(teacherId));

            if (!isAuthorized) throw new RuntimeException("Unauthorized to grade this class");

            // 2. The FindOrCreate (Upsert) Logic
            ExamResult recordToSave = examResultRepository
                    .findByStudentIdAndExamId(studentId, examId)
                    .orElse(new ExamResult()); // Create new if not found

            // 3. Update the data
            if (recordToSave.getId() == null) {
                // New record: set the relationships
                recordToSave.setStudent(userRepository.getReferenceById(studentId));
                recordToSave.setExam(exam);
            }

            recordToSave.setMarks(incoming.getMarks());
            recordToSave.setLetterGrade(convertToLetter(incoming.getMarks()));
            recordToSave.setStatus(ExamResult.Status.SUBMITTED);

            examResultRepository.save(recordToSave);
        }
    }

    public Exam updateExam(Long id, Exam examDetails) {
        Exam exam = examRepository.findById(id).orElseThrow(() -> new RuntimeException("Exam not found"));
        exam.setName(examDetails.getName());
        exam.setClasse(examDetails.getClasse());
        exam.setSubject(examDetails.getSubject());
        exam.setDate(examDetails.getDate());
        exam.setStartTime(examDetails.getStartTime());
        exam.setEndTime(examDetails.getEndTime());
        return examRepository.save(exam);
    }

    @Transactional
    public void deleteExam(Long examId, Long teacherId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        // Check if the teacher trying to delete is the one who created it
        if (!exam.getTeacher().getId().equals(teacherId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You are not the creator of this exam");
        }

        examRepository.delete(exam);
    }


    public LearningMaterial uploadLearningMaterial(LearningMaterial material) {
        return learningMaterialRepository.save(material);
    }

    public List<LearningMaterial> getMaterialsByTeacher(Long teacherId) {
        User teacher = new User();
        teacher.setId(teacherId);
        List<Classe> classes = getClassesByTeacher(teacherId);
        return classes.stream()
                .flatMap(classe -> learningMaterialRepository.findByClasse(classe).stream())
                .collect(Collectors.toList());
    }

    public void deleteLearningMaterial(Long id) {
        learningMaterialRepository.deleteById(id);
    }

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public User updateProfile(Long userId, Map<String, String> payload) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(payload.get("name"));
        user.setEmail(payload.get("email"));
        return userRepository.save(user);
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    //    @Transactional
//    public ExamResult saveResult(Long teacherId, ExamResult result) {
//        Exam exam = examRepository.findById(result.getExam().getId())
//                .orElseThrow(() -> new RuntimeException("Exam not found"));
//        // 2. Security Check: Is the current teacher assigned to this exam's class?
//        boolean isAuthorized = exam.getClasse().getTeachers().stream()
//                .anyMatch(t -> t.getId().equals(teacherId));
//
//        if (!isAuthorized) {
//            throw new RuntimeException("Access Denied: You are not a teacher for this class.");
//        }
//        result.setStatus(ExamResult.Status.DRAFT);
//        return examResultRepository.save(result);
//    }

    @Transactional
    public ExamResult saveResult(Long teacherId, ExamResult result) {

        // 1. Check if result already exists for this Student + Exam combination
        Optional<ExamResult> existing = examResultRepository.findByStudentIdAndExamId(
                result.getStudent().getId(),
                result.getExam().getId()
        );

        if (existing.isPresent()) {
            throw new RuntimeException("A result for this student in this exam already exists. Please edit the existing record instead.");
        }

        // 2. Fetch Exam for security check
        Exam exam = examRepository.findById(result.getExam().getId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        // NEW CHECK: Prevent editing if the semester is locked
        if (exam.isLocked()) {
            throw new RuntimeException("This semester has been closed. You cannot modify results.");
        }

        // 3. Security Check: Is the current teacher assigned to this exam's class?
        boolean isAuthorized = exam.getClasse().getTeachers().stream()
                .anyMatch(t -> t.getId().equals(teacherId));

        if (!isAuthorized) {
            throw new RuntimeException("Access Denied: You are not a teacher for this class.");
        }

        result.setStatus(ExamResult.Status.DRAFT);
        return examResultRepository.save(result);
    }

    public ExamResult updateResult(Long id, ExamResult resultDetails) {
        ExamResult result = examResultRepository.findById(id).orElseThrow(() -> new RuntimeException("Result not found"));
        if (result.getStatus() == ExamResult.Status.SUBMITTED || result.getStatus() == ExamResult.Status.GRADED) {
            throw new RuntimeException("Cannot update a submitted result");
        }
        result.setMarks(resultDetails.getMarks());
        result.setGrade(resultDetails.getGrade());
        return examResultRepository.save(result);
    }

    public void submitResults(List<Long> resultIds) {
        List<ExamResult> results = examResultRepository.findAllById(resultIds);
        for (ExamResult result : results) {
            result.setStatus(ExamResult.Status.SUBMITTED);
        }
        examResultRepository.saveAll(results);
    }

    public List<ExamResult> getResultsByTeacher(Long teacherId) {
        List<User> students = getStudentsByTeacher(teacherId);
        return students.stream()
                .flatMap(student -> examResultRepository.findByStudent(student).stream())
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> filterResults(Long classId, Long studentId) {
        List<ExamResult> rawResults;
        if (classId != null) {
            rawResults = examResultRepository.findByExam_Classe_Id(classId);
        } else if (studentId != null) {
            rawResults = examResultRepository.findByStudent_Id(studentId);
        } else {
            rawResults = examResultRepository.findAll();
        }

        return rawResults.stream().map(result -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", result.getId());
            dto.put("marks", result.getMarks());
            dto.put("status", result.getStatus());
            dto.put("grade", result.getLetterGrade());

            // Student Mapping
            Map<String, Object> studentMap = new HashMap<>();
            studentMap.put("name", result.getStudent().getName());
            studentMap.put("userId", result.getStudent().getUserId());
            dto.put("student", studentMap);

            // Exam Mapping - ADDING TERM AND WEIGHT HERE
            Map<String, Object> examMap = new HashMap<>();
            examMap.put("id", result.getExam().getId());
            examMap.put("name", result.getExam().getName());

            // --- ADD THESE TWO LINES ---
            examMap.put("term", result.getExam().getTerm());     // Matches r.exam.term
            examMap.put("weight", result.getExam().getWeight()); // Matches r.exam.weight
            examMap.put("locked", result.getExam().isLocked());   // Needed for UI Lock icons
            // ---------------------------

            // Class Mapping
            Map<String, Object> classeMap = new HashMap<>();
            classeMap.put("name", result.getExam().getClasse().getName());
            examMap.put("classe", classeMap);

            // Subject Mapping
            if (result.getExam().getSubject() != null) {
                Map<String, Object> subMap = new HashMap<>();
                subMap.put("name", result.getExam().getSubject().getName());
                examMap.put("subject", subMap);
            }

            dto.put("exam", examMap);
            return dto;
        }).collect(Collectors.toList());
    }
}
