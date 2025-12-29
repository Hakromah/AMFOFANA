package com.amfofana.school.services;

import com.amfofana.school.dto.ClasseDTO;
import com.amfofana.school.dto.ReportDTO;
import com.amfofana.school.dto.UserDTO;
import com.amfofana.school.entities.*;
import com.amfofana.school.repositories.*;
import jakarta.transaction.Transactional;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

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

    private final UserRepository userRepository;
    private final ClasseRepository classeRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExamRepository examRepository;
    private final SubjectRepository subjectRepository;
    private final LearningMaterialRepository learningMaterialRepository;
    private final TimetableRepository timetableRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExamResultRepository examResultRepository;


    public AdminService(UserRepository userRepository, ClasseRepository classeRepository,
                        TeacherProfileRepository teacherProfileRepository, StudentProfileRepository studentProfileRepository,
                        AttendanceRepository attendanceRepository, ExamRepository examRepository,
                        SubjectRepository subjectRepository, LearningMaterialRepository learningMaterialRepository,
                        TimetableRepository timetableRepository, PasswordEncoder passwordEncoder,
                        @Lazy ExamResultRepository examResultRepository) {
        this.userRepository = userRepository;
        this.classeRepository = classeRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.attendanceRepository = attendanceRepository;
        this.examRepository = examRepository;
        this.subjectRepository = subjectRepository;
        this.learningMaterialRepository = learningMaterialRepository;
        this.timetableRepository = timetableRepository;
        this.passwordEncoder = passwordEncoder;
        this.examResultRepository = examResultRepository;
    }


    // User CRUD
    public User createUser(User user) {
        String userId = String.format("%012d", Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setUserId(userId.substring(0, 12));
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public List<UserDTO> getAllUsers(String role) {
        List<User> users;
        if (role != null && !role.isEmpty()) {
            users = userRepository.findByRole(Role.valueOf(role.toUpperCase()));
        } else {
            users = userRepository.findAll();
        }
        return users.stream().map(this::convertToUserDTO).collect(Collectors.toList());
    }

    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setBirthDate(userDetails.getBirthDate());
        user.setBirthCountry(userDetails.getBirthCountry());
        user.setBirthCity(userDetails.getBirthCity());
        user.setAddress(userDetails.getAddress());
        user.setGender(userDetails.getGender());
        user.setPhoneNumber(userDetails.getPhoneNumber());

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Handle Role-specific profiles
        if (user.getRole() == Role.TEACHER) {
            teacherProfileRepository.findByUser(user).ifPresent(teacherProfileRepository::delete);

            // IMPORTANT: Unset this teacher from classes they lead
            // This avoids the "referenced from table classes" error
            for (Classe classe : user.getTeachingClasses()) {
                classe.setTeachers(null);
            }
        } else if (user.getRole() == Role.STUDENT) {
            studentProfileRepository.findByUser(user).ifPresent(studentProfileRepository::delete);
            attendanceRepository.deleteByStudent(user);

            // IMPORTANT: Remove this student from all class enrollments
            // This fixes the "referenced from table classe_students" error
            for (Classe classe : user.getEnrolledClasses()) {
                classe.getStudents().remove(user);
            }
        }

        // 2. Finally, delete the user
        userRepository.delete(user);
    }

    // Class CRUD
    public ClasseDTO createClass(Classe classe) {
        Classe savedClasse = classeRepository.save(classe);
        return convertToClasseDTO(savedClasse);
    }

    public List<ClasseDTO> getAllClasses() {
        return classeRepository.findAll().stream().map(this::convertToClasseDTO).collect(Collectors.toList());
    }

    public ClasseDTO updateClass(Long id, Classe classeDetails) {
        Classe classe = classeRepository.findById(id).orElseThrow(() -> new RuntimeException("Class not found"));
        classe.setName(classeDetails.getName());
        classe.setGrade(classeDetails.getGrade());
        Classe updatedClasse = classeRepository.save(classe);
        return convertToClasseDTO(updatedClasse);
    }

    public void deleteClass(Long id) {
        classeRepository.deleteById(id);
    }

    // Exam Management
    public List<Exam> getExams(Long teacherId, Long classId) {
        if (teacherId != null) {
            return examRepository.findExamsByTeacherId(teacherId);
        }

        if (classId != null) {
            Classe classe = classeRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Class not found"));
            return examRepository.findByClasse(classe);
        }

        return examRepository.findAll();
    }

    // Subject CRUD
    public Subject createSubject(Subject subject) {
        return subjectRepository.save(subject);
    }

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public Subject updateSubject(Long id, Subject subjectDetails) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        subject.setName(subjectDetails.getName());
        return subjectRepository.save(subject);
    }

    public void deleteSubject(Long id) {
        subjectRepository.deleteById(id);
    }

    // Learning Material CRUD
    public LearningMaterial createLearningMaterial(LearningMaterial material) {
        return learningMaterialRepository.save(material);
    }

    public List<LearningMaterial> getAllLearningMaterials() {
        return learningMaterialRepository.findAll();
    }

    public void deleteLearningMaterial(Long id) {
        learningMaterialRepository.deleteById(id);
    }

    // Timetable CRUD
    public Timetable createTimetableEntry(Timetable timetable) {
        return timetableRepository.save(timetable);
    }

    public List<Timetable> getAllTimetableEntries() {
        return timetableRepository.findAll();
    }

    public Timetable updateTimetableEntry(Long id, Timetable timetableDetails) {
        Timetable timetable = timetableRepository.findById(id).orElseThrow(() -> new RuntimeException("Timetable entry not found"));
        timetable.setClasse(timetableDetails.getClasse());
        timetable.setSubject(timetableDetails.getSubject());
        timetable.setDayOfWeek(timetableDetails.getDayOfWeek());
        timetable.setStartTime(timetableDetails.getStartTime());
        timetable.setEndTime(timetableDetails.getEndTime());
        return timetableRepository.save(timetable);
    }

    public void deleteTimetableEntry(Long id) {
        timetableRepository.deleteById(id);
    }

    // Assignments
    //ASSIGN TEACHER TO A CLASS
    public void assignTeacherToClass(Long teacherId, Long classId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Classe classe = classeRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        // Add to the collection instead of overwriting
        classe.getTeachers().add(teacher);

        // Maintain bidirectional link
        teacher.getTeachingClasses().add(classe);

        classeRepository.save(classe);
    }

    @Transactional
    public void assignStudentToClass(Long studentId, Long classId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        Classe classe = classeRepository.findById(classId).orElseThrow(() -> new RuntimeException("Class not found"));

        if (classe.getStudents().contains(student)) {
            throw new RuntimeException("Student is already assigned to this class");
        }

        // Update both sides!
        classe.getStudents().add(student);
        student.getEnrolledClasses().add(classe);

        classeRepository.save(classe);
    }

    // Student Class Lookup
    public List<ClasseDTO> getClassesForStudent(Long studentId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));
        return classeRepository.findByStudentsContains(student).stream().map(this::convertToClasseDTO).collect(Collectors.toList());
    }

    // Reports
    public ReportDTO getSummaryReport() {
        ReportDTO report = new ReportDTO();
        report.setTotalStudents(userRepository.countByRole(Role.STUDENT));
        report.setTotalTeachers(userRepository.countByRole(Role.TEACHER));
        report.setTotalAdmins(userRepository.countByRole(Role.ADMIN));
        report.setTotalClasses(classeRepository.count());
        report.setTotalExams(examRepository.count());
        report.setTotalSubjects(subjectRepository.count());
        return report;
    }

    // Profile & Settings
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

    public List<Map<String, Object>> filterResultsForAdmin(String studentQuery, Long classId) {
        List<ExamResult> rawResults = examResultRepository.findByAdminFilters(studentQuery, classId);

        return rawResults.stream().map(result -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", result.getId());
            dto.put("marks", result.getMarks());
            dto.put("status", result.getStatus());

            // Calculate Grade Fallback
            String grade = result.getLetterGrade();
            if (grade == null || grade.trim().isEmpty()) {
                grade = calculateGrade(result.getMarks());
            }
            dto.put("grade", grade);

            dto.put("student", Map.of(
                    "name", result.getStudent().getName(),
                    "userId", result.getStudent().getUserId()
            ));

            // --- FIX: Put academic details INSIDE the exam map ---
            Map<String, Object> examMap = new HashMap<>();
            examMap.put("name", result.getExam().getName());
            examMap.put("term", result.getExam().getTerm());
            examMap.put("weight", result.getExam().getWeight());
            examMap.put("semester", result.getExam().getSemester()); // Uncommented and fixed
            examMap.put("locked", result.getExam().isLocked());

            String subjectName = (result.getExam().getSubject() != null)
                    ? result.getExam().getSubject().getName()
                    : "General";
            examMap.put("subject", Map.of("name", subjectName));

            dto.put("exam", examMap);
            // ----------------------------------------------------

            Double avg = examResultRepository.getAverageByExamId(result.getExam().getId());
            dto.put("classAverage", avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0);

            return dto;
        }).collect(Collectors.toList());
    }

//    public List<Map<String, Object>> filterResultsForAdmin(String studentQuery, Long classId) {
//        List<ExamResult> rawResults = examResultRepository.findByAdminFilters(studentQuery, classId);
//
//        return rawResults.stream().map(result -> {
//            Map<String, Object> dto = new HashMap<>();
//            dto.put("id", result.getId());
//            dto.put("marks", result.getMarks());
//            dto.put("status", result.getStatus());
//
//            // --- ADD THESE TWO LINES ---
//            dto.put("term", result.getExam().getTerm());     // Matches r.exam.term
//            dto.put("weight", result.getExam().getWeight()); // Matches r.exam.weight
//            dto.put("locked", result.getExam().isLocked());
////            dto.put("semester",result).getExam().getSemester();// Needed for UI Lock icons
//            // ---------------------------
//
//            // --- IMPROVED GRADE LOGIC ---
//            // 1. Try to get the grade from the database
//            String grade = result.getLetterGrade();
//            // 2. If DB grade is null/empty, calculate it on the fly from the marks
//            if (grade == null || grade.trim().isEmpty()) {
//                grade = calculateGrade(result.getMarks());
//            }
//            dto.put("grade", grade);
//            // -----------------------------
//
//            dto.put("student", Map.of(
//                    "name", result.getStudent().getName(),
//                    "userId", result.getStudent().getUserId()
//            ));
//
//            // Ensure we handle potential null subject safely
//            String subjectName = (result.getExam().getSubject() != null)
//                    ? result.getExam().getSubject().getName()
//                    : "General";
//
//            dto.put("exam", Map.of(
//                    "name", result.getExam().getName(),
//                    "subject", Map.of("name", subjectName)
//            ));
//
//            Double avg = examResultRepository.getAverageByExamId(result.getExam().getId());
//            dto.put("classAverage", avg != null ? Math.round(avg * 100.0) / 100.0 : 0.0);
//
//            return dto;
//        }).collect(Collectors.toList());
//    }

    // Calculate SEMESTER GPA
    public Map<String, Object> calculateSemesterGPA(Long studentId, String semester) {
        List<ExamResult> results = examResultRepository.findByStudentIdAndSemester(studentId, semester);

        // Group by Subject to handle Midterms, Finals, and Quizzes together
        Map<Long, List<ExamResult>> subjectGroups = results.stream()
                .collect(Collectors.groupingBy(r -> r.getExam().getSubject().getId()));

        List<Map<String, Object>> courses = new ArrayList<>();
        double totalWeightedScore = 0;
        int courseCount = 0;

        for (Map.Entry<Long, List<ExamResult>> entry : subjectGroups.entrySet()) {
            double subjectFinalScore = 0;
            String subjectName = entry.getValue().get(0).getExam().getSubject().getName();

            for (ExamResult r : entry.getValue()) {
                // Apply weighting (e.g., marks 80 * weight 30% = 24 points)
                double weight = r.getExam().getWeight() / 100.0;
                subjectFinalScore += (r.getMarks() * weight);
            }

            totalWeightedScore += subjectFinalScore;
            courseCount++;

            courses.add(Map.of(
                    "subject", subjectName,
                    "finalScore", Math.round(subjectFinalScore * 100.0) / 100.0,
                    "grade", calculateGrade(subjectFinalScore)
            ));
        }

        double gpa = courseCount > 0 ? totalWeightedScore / courseCount : 0;

        return Map.of(
                "studentId", studentId,
                "semester", semester,
                "courses", courses,
                "gpa", Math.round(gpa * 100.0) / 100.0
        );
    }

    // Inside AdminService.java

    @Transactional
    public void lockSemesterResults(String semester) {
        // 1. Fetch all exams belonging to that semester
        List<Exam> exams = examRepository.findBySemester(semester);

        if (exams.isEmpty()) {
            throw new RuntimeException("No exams found for the semester: " + semester);
        }

        // 2. Set the isLocked flag to true for every exam found
        exams.forEach(exam -> {
            exam.setLocked(true);
        });

        // 3. Save the changes back to the database
        examRepository.saveAll(exams);
    }

    //    public List<Map<String, Object>> getSemesterTranscript(Long studentId, String semester) {
//        List<ExamResult> results = examResultRepository.findByStudentIdAndSemester(studentId, semester);
//
//        // Group by Subject ID to aggregate Midterm/Final/Quiz
//        Map<Long, List<ExamResult>> groupedBySubject = results.stream()
//                .collect(Collectors.groupingBy(r -> r.getExam().getSubject().getId()));
//
//        return groupedBySubject.values().stream().map(subjectResults -> {
//            double finalSemesterScore = 0;
//            String subjectName = subjectResults.get(0).getExam().getSubject().getName();
//
//            for (ExamResult r : subjectResults) {
//                double weightDecimal = r.getExam().getWeight() / 100.0;
//                finalSemesterScore += (r.getMarks() * weightDecimal);
//            }
//
//            Map<String, Object> courseData = new HashMap<>();
//            courseData.put("subject", subjectName);
//            courseData.put("finalScore", Math.round(finalSemesterScore * 100.0) / 100.0);
//            courseData.put("grade", calculateGrade(finalSemesterScore));
//            return courseData;
//        }).collect(Collectors.toList());
//    }
    // DTO Converters
    private UserDTO convertToUserDTO(User user) {
        if (user == null) return null;
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUserId(user.getUserId());
        userDTO.setName(user.getName());
        userDTO.setEmail(user.getEmail());
        userDTO.setRole(user.getRole());
        userDTO.setBirthDate(user.getBirthDate());
        userDTO.setBirthCountry(user.getBirthCountry());
        userDTO.setBirthCity(user.getBirthCity());
        userDTO.setAddress(user.getAddress());
        userDTO.setGender(user.getGender());
        userDTO.setPhoneNumber(user.getPhoneNumber());
        userDTO.setCreatedAt(user.getCreatedAt());
        return userDTO;
    }

    private ClasseDTO convertToClasseDTO(Classe classe) {
        if (classe == null) return null;

        ClasseDTO classeDTO = new ClasseDTO();
        classeDTO.setId(classe.getId());
        classeDTO.setName(classe.getName());
        classeDTO.setGrade(classe.getGrade());
        // 1. Map the Set of Teachers
        if (classe.getTeachers() != null) {
            classeDTO.setTeachers(classe.getTeachers().stream()
                    .map(this::convertToUserDTO)
                    .collect(Collectors.toSet()));
        } else {
            classeDTO.setTeachers(Collections.emptySet());
        }

        // 2. Map the Set of Students
        if (classe.getStudents() != null) {
            classeDTO.setStudents(classe.getStudents().stream()
                    .map(this::convertToUserDTO)
                    .collect(Collectors.toSet()));
        } else {
            classeDTO.setStudents(Collections.emptySet());
        }

        return classeDTO;
    }
}
